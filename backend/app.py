"""
Weather Guard — FastAPI Backend Server
Upgraded from the legacy prototype to connect the RandomForest ML Engine,
Live Open-Meteo Telemetry, Multi-Grid Spatial Scanner, and Personalized Risk API
directly to the Weather Guard frontend UI.
"""

from pathlib import Path
from typing import List, Optional
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import uvicorn

from weather_guard_ml import (
    MODELS_DIR,
    get_live_weather,
    get_mock_weather,
    predict_risk,
    scan_surrounding_grids,
    train_models,
)

app = FastAPI(
    title="Weather Guard — AI Hyper-Local Nowcasting & Early Warning API",
    description="Real-time meteorological telemetry, RandomForest multi-hazard prediction, and personalized safety intelligence.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CustomWeatherPayload(BaseModel):
    grid_id: str = Field(default="WG-SIM-01")
    lat: float = Field(default=12.9716)
    lon: float = Field(default=77.5946)
    temperature_c: float = Field(default=26.0, ge=-20, le=60)
    rainfall_mm_hr: float = Field(default=0.0, ge=0, le=300)
    humidity_pct: int = Field(default=65, ge=0, le=100)
    wind_speed_kmh: float = Field(default=12.0, ge=0, le=250)
    pressure_hpa: float = Field(default=1013.0, ge=900, le=1060)
    lightning_strikes_min: int = Field(default=0, ge=0, le=120)
    uv_index: float = Field(default=5.0, ge=0, le=16)
    profile_type: str = Field(default="citizen")
    factors: List[str] = Field(default_factory=list)


class PersonalizedRiskRequest(BaseModel):
    base_score: int = Field(..., ge=0, le=100)
    profile_type: str = Field(default="citizen")
    factors: List[str] = Field(default_factory=list)
    weather: Optional[dict] = None


@app.get("/")
def api_root():
    """Describe the backend API; the React frontend is served separately by Vite."""
    return {
        "app": "WeatherGuard AI",
        "status": "ok",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health_check():
    """Returns API status and trained RandomForest evaluation metrics."""
    metrics_file = MODELS_DIR / "metrics.json"
    if not metrics_file.exists():
        metrics = train_models()
    else:
        import json
        metrics = json.loads(metrics_file.read_text(encoding="utf-8"))

    return {
        "app": "Weather Guard",
        "status": "operational",
        "version": "2.0.0",
        "models_loaded": True,
        "metrics": metrics,
    }


@app.get("/api/weather")
def api_get_weather(
    lat: float = Query(12.9716, description="Latitude"),
    lon: float = Query(77.5946, description="Longitude"),
    grid_id: str = Query("WG-GRID-01", description="Grid Identifier"),
    scenario: Optional[str] = Query(None, description="Optional simulator preset: calm, monsoon_deluge, thunderstorm, cyclone, heatwave"),
    profile_type: str = Query("citizen", description="User safety role"),
    factors: Optional[str] = Query(None, description="Comma-separated vulnerability factors"),
):
    """
    Fetches live (or simulated preset) weather data, runs the 4 RandomForest hazard models,
    and scans surrounding 3x3 micro-grids for geo-spatial mapping.
    """
    factor_list = [f.strip() for f in factors.split(",") if f.strip()] if factors else []

    if scenario:
        weather = get_mock_weather(grid_id=grid_id, scenario=scenario, lat=lat, lon=lon)
    else:
        weather = get_live_weather(lat=lat, lon=lon, grid_id=grid_id)

    risk = predict_risk(weather, profile_type=profile_type, factors=factor_list)
    grids = scan_surrounding_grids(weather)

    return {
        "app": "Weather Guard",
        "weather": weather,
        "risk": risk,
        "grids": grids,
    }


@app.post("/api/predict")
def api_predict_risk(payload: CustomWeatherPayload):
    """
    Runs AI multi-hazard prediction on custom or simulated weather parameters.
    Powers the interactive Weather Guard What-If Storm Simulator Lab.
    """
    weather_dict = payload.model_dump()
    risk = predict_risk(
        weather_dict,
        profile_type=payload.profile_type,
        factors=payload.factors,
    )
    grids = scan_surrounding_grids(weather_dict)
    return {
        "app": "Weather Guard",
        "weather": weather_dict,
        "risk": risk,
        "grids": grids,
    }


@app.post("/api/personalized-risk")
def api_personalized_risk(req: PersonalizedRiskRequest):
    """Calculates vulnerability-adjusted risk score and tailored safety guidance."""
    weather_data = req.weather or get_mock_weather("WG-DEFAULT", scenario="calm")
    risk = predict_risk(weather_data, profile_type=req.profile_type, factors=req.factors)
    return {
        "app": "Weather Guard",
        "base_score": risk["overall"],
        "personalized_score": risk["personalized_score"],
        "personalized_level": risk["personalized_level"],
        "advisories": risk["advisories"],
    }


if __name__ == "__main__":
    print("Starting Weather Guard Server on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
