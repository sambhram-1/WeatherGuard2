"""
Weather Guard — Hyper-Local AI Weather Nowcasting & Risk Engine
Upgraded from the legacy prototype into a full-featured ML & Weather Pipeline:
    1. LIVE WEATHER & AIR QUALITY SERVICE — Open-Meteo Forecast + Air Quality + 24h Hourly Data
    2. MULTI-GRID SPATIAL SCANNER         — Generates hyper-local micro-grid readings around any lat/lon
    3. SYNTHETIC HISTORICAL DATASET       — Physically plausible severe-weather dataset (Rain, Lightning, Storm, Flood)
    4. RANDOM FOREST ENSEMBLE TRAINING    — Trains 4 RandomForestRegressor models + stores evaluation metrics & feature importances
    5. AI RISK & PERSONALIZATION ENGINE   — Predicts multi-hazard risk with tree-variance confidence + vulnerability adjustments
"""

import json
import math
import random
from pathlib import Path
from typing import Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

# ─────────────────────────────────────────────────────────────────────────
# Paths — data and trained models live alongside this script
# ─────────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
DATA_DIR.mkdir(exist_ok=True)
MODELS_DIR.mkdir(exist_ok=True)

TRAINING_DATA_PATH = DATA_DIR / "weather_guard_training_data.csv"

FEATURES = [
    "temperature_c",
    "rainfall_mm_hr",
    "humidity_pct",
    "wind_speed_kmh",
    "pressure_hpa",
    "lightning_strikes_min",
]
TARGETS = ["rain_risk", "lightning_risk", "storm_risk", "flood_risk"]


# ═══════════════════════════════════════════════════════════════════════
# 1. WEATHER & AIR QUALITY SERVICE
# ═══════════════════════════════════════════════════════════════════════
def get_live_weather(
    lat: float = 12.9716,
    lon: float = 77.5946,
    grid_id: str = "WG-GRID-01",
) -> dict:
    """
    Fetches real-time weather, 24-hour forecast, and air quality from Open-Meteo APIs
    for given coordinates and formats into the standardized Weather Guard dataset.
    """
    weather_url = (
        f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}"
        f"&current=temperature_2m,apparent_temperature,relative_humidity_2m,rain,precipitation,"
        f"surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m,uv_index,visibility,weather_code"
        f"&hourly=temperature_2m,precipitation_probability,rain,wind_speed_10m,surface_pressure,uv_index,weather_code"
        f"&forecast_hours=24&timezone=auto"
    )
    aqi_url = (
        f"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={lat}&longitude={lon}"
        f"&current=us_aqi,pm2_5,pm10"
    )

    try:
        response = requests.get(weather_url, timeout=10)
        response.raise_for_status()
        payload = response.json()
        data = payload.get("current", {})

        temp = float(data.get("temperature_2m", 25.0))
        feels_like = float(data.get("apparent_temperature", temp))
        humidity = int(data.get("relative_humidity_2m", 70))
        rain = float(data.get("rain", data.get("precipitation", 0.0)))
        pressure = float(data.get("surface_pressure", 1013.0))
        wind = float(data.get("wind_speed_10m", 10.0))
        wind_gusts = float(data.get("wind_gusts_10m", wind * 1.25))
        wind_dir = int(data.get("wind_direction_10m", 180))
        uv_index = float(data.get("uv_index", 4.0))
        visibility_m = float(data.get("visibility", 10000.0))
        weather_code = int(data.get("weather_code", 0))

        # Estimate lightning activity from convective indicators (rain intensity, pressure drop, WMO storm code)
        lightning = 0
        if weather_code >= 95 or rain > 12 or pressure < 1000:
            lightning = random.randint(6, 26)
        elif rain > 2.5 or pressure < 1006:
            lightning = random.randint(1, 5)

        # Optional Air Quality fetch
        aqi_val = 42
        pm2_5 = 12.0
        try:
            aqi_res = requests.get(aqi_url, timeout=5)
            if aqi_res.ok:
                aqi_curr = aqi_res.json().get("current", {})
                aqi_val = int(aqi_curr.get("us_aqi") or 42)
                pm2_5 = float(aqi_curr.get("pm2_5") or 12.0)
        except Exception:
            pass

        # Calculate dew point (Magnus approximation)
        dew_point = round(temp - ((100 - humidity) / 5.0), 1)

        return {
            "grid_id": grid_id,
            "lat": lat,
            "lon": lon,
            "source": "live_open_meteo",
            "temperature_c": round(temp, 1),
            "feels_like_c": round(feels_like, 1),
            "dew_point_c": dew_point,
            "rainfall_mm_hr": round(rain, 1),
            "humidity_pct": humidity,
            "wind_speed_kmh": round(wind, 1),
            "wind_gusts_kmh": round(wind_gusts, 1),
            "wind_direction_deg": wind_dir,
            "pressure_hpa": round(pressure, 1),
            "lightning_strikes_min": lightning,
            "uv_index": round(uv_index, 1),
            "visibility_km": round(visibility_m / 1000.0, 1),
            "us_aqi": aqi_val,
            "pm2_5": round(pm2_5, 1),
            "weather_code": weather_code,
            "hourly": payload.get("hourly", {}),
        }

    except Exception as e:
        print(f"[Weather Guard] Live API call failed, switching to fallback simulator: {e}")
        return get_mock_weather(grid_id, scenario="calm", lat=lat, lon=lon)


def get_mock_weather(
    grid_id: str = "WG-GRID-01",
    is_storm: bool = False,
    scenario: Optional[str] = None,
    lat: float = 12.9716,
    lon: float = 77.5946,
) -> dict:
    """
    Fallback & Scenario Simulator: Generates realistic weather presets for demos and testing.
    Supported scenarios: 'calm', 'monsoon_deluge', 'thunderstorm', 'cyclone', 'heatwave'
    """
    if scenario is None:
        scenario = "thunderstorm" if is_storm else "calm"

    presets = {
        "calm": {
            "temperature_c": 27.8,
            "feels_like_c": 28.5,
            "dew_point_c": 19.8,
            "rainfall_mm_hr": 0.4,
            "humidity_pct": 62,
            "wind_speed_kmh": 11.5,
            "wind_gusts_kmh": 16.0,
            "wind_direction_deg": 110,
            "pressure_hpa": 1013.2,
            "lightning_strikes_min": 0,
            "uv_index": 6.2,
            "visibility_km": 10.0,
            "us_aqi": 38,
            "pm2_5": 9.4,
            "weather_code": 1,
        },
        "monsoon_deluge": {
            "temperature_c": 23.1,
            "feels_like_c": 25.4,
            "dew_point_c": 22.0,
            "rainfall_mm_hr": 52.0,
            "humidity_pct": 94,
            "wind_speed_kmh": 34.0,
            "wind_gusts_kmh": 48.0,
            "wind_direction_deg": 240,
            "pressure_hpa": 998.5,
            "lightning_strikes_min": 8,
            "uv_index": 1.5,
            "visibility_km": 2.1,
            "us_aqi": 28,
            "pm2_5": 6.0,
            "weather_code": 82,
        },
        "thunderstorm": {
            "temperature_c": 22.4,
            "feels_like_c": 24.0,
            "dew_point_c": 21.3,
            "rainfall_mm_hr": 65.0,
            "humidity_pct": 95,
            "wind_speed_kmh": 48.5,
            "wind_gusts_kmh": 68.0,
            "wind_direction_deg": 255,
            "pressure_hpa": 994.2,
            "lightning_strikes_min": 21,
            "uv_index": 1.0,
            "visibility_km": 1.4,
            "us_aqi": 32,
            "pm2_5": 7.5,
            "weather_code": 96,
        },
        "cyclone": {
            "temperature_c": 21.0,
            "feels_like_c": 22.0,
            "dew_point_c": 20.5,
            "rainfall_mm_hr": 88.0,
            "humidity_pct": 98,
            "wind_speed_kmh": 82.0,
            "wind_gusts_kmh": 112.0,
            "wind_direction_deg": 290,
            "pressure_hpa": 978.0,
            "lightning_strikes_min": 28,
            "uv_index": 0.5,
            "visibility_km": 0.6,
            "us_aqi": 22,
            "pm2_5": 5.0,
            "weather_code": 99,
        },
        "heatwave": {
            "temperature_c": 41.6,
            "feels_like_c": 45.2,
            "dew_point_c": 14.0,
            "rainfall_mm_hr": 0.0,
            "humidity_pct": 24,
            "wind_speed_kmh": 19.0,
            "wind_gusts_kmh": 28.0,
            "wind_direction_deg": 315,
            "pressure_hpa": 1005.0,
            "lightning_strikes_min": 0,
            "uv_index": 11.2,
            "visibility_km": 7.5,
            "us_aqi": 118,
            "pm2_5": 42.0,
            "weather_code": 0,
        },
    }

    chosen = presets.get(scenario, presets["calm"]).copy()
    chosen.update({
        "grid_id": grid_id,
        "lat": lat,
        "lon": lon,
        "source": f"simulator_{scenario}",
    })
    return chosen


# ═══════════════════════════════════════════════════════════════════════
# 2. TRAINING DATA GENERATOR
# ═══════════════════════════════════════════════════════════════════════
def _clip(x, lo=0, hi=100):
    return np.clip(x, lo, hi)


def generate_dataset(n_samples: int = 6000, seed: int = 42) -> pd.DataFrame:
    """
    Synthesizes a physically plausible dataset pairing weather observations with
    4 hazard targets: rain_risk, lightning_risk, storm_risk, and flood_risk.
    """
    rng = np.random.default_rng(seed)

    temperature_c = rng.normal(26, 4.5, n_samples).clip(8, 45)
    rainfall_mm_hr = rng.exponential(4.0, n_samples).clip(0, 110)
    humidity_pct = rng.normal(66, 16, n_samples).clip(15, 100)
    wind_speed_kmh = rng.exponential(13, n_samples).clip(0, 110)
    pressure_hpa = rng.normal(1010, 8.5, n_samples).clip(965, 1035)
    lightning_strikes_min = rng.poisson(
        lam=_clip(rainfall_mm_hr / 5.5, 0, 22), size=n_samples
    ).clip(0, 45)

    rain_risk = _clip(
        rainfall_mm_hr * 1.55
        + (humidity_pct - 50) * 0.48
        + (1013 - pressure_hpa) * 0.82
        + rng.normal(0, 5, n_samples)
    )

    lightning_risk = _clip(
        lightning_strikes_min * 3.4
        + rainfall_mm_hr * 0.75
        + (1013 - pressure_hpa) * 0.65
        + rng.normal(0, 5, n_samples)
    )

    storm_risk = _clip(
        wind_speed_kmh * 1.12
        + (1013 - pressure_hpa) * 1.28
        + rainfall_mm_hr * 0.58
        + rng.normal(0, 5, n_samples)
    )

    flood_risk = _clip(
        rainfall_mm_hr * 1.75
        + np.maximum(0, humidity_pct - 70) * 0.65
        + np.maximum(0, 1008 - pressure_hpa) * 0.70
        + rng.normal(0, 5, n_samples)
    )

    return pd.DataFrame(
        {
            "temperature_c": temperature_c,
            "rainfall_mm_hr": rainfall_mm_hr,
            "humidity_pct": humidity_pct,
            "wind_speed_kmh": wind_speed_kmh,
            "pressure_hpa": pressure_hpa,
            "lightning_strikes_min": lightning_strikes_min,
            "rain_risk": rain_risk,
            "lightning_risk": lightning_risk,
            "storm_risk": storm_risk,
            "flood_risk": flood_risk,
        }
    )


# ═══════════════════════════════════════════════════════════════════════
# 3. MODEL TRAINING
# ═══════════════════════════════════════════════════════════════════════
def train_models(force: bool = False) -> dict:
    if force or not TRAINING_DATA_PATH.exists():
        generate_dataset().to_csv(TRAINING_DATA_PATH, index=False)

    df = pd.read_csv(TRAINING_DATA_PATH)
    X = df[FEATURES].to_numpy(dtype=float)

    metrics = {}
    for target in TARGETS:
        y = df[target].to_numpy(dtype=float)
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = RandomForestRegressor(
            n_estimators=150,
            max_depth=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        mae = mean_absolute_error(y_test, preds)
        r2 = r2_score(y_test, preds)
        importances = {
            feat: round(float(imp), 4)
            for feat, imp in zip(FEATURES, model.feature_importances_)
        }
        metrics[target] = {
            "mae": round(float(mae), 2),
            "r2": round(float(r2), 3),
            "feature_importances": importances,
        }

        joblib.dump(model, MODELS_DIR / f"{target}_model.pkl")
        print(f"[Weather Guard ML] {target} trained | MAE={mae:.2f} | R2={r2:.3f}")

    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    return metrics


# ═══════════════════════════════════════════════════════════════════════
# 4. AI PREDICTION & ADVISORY ENGINE
# ═══════════════════════════════════════════════════════════════════════
_models = None


def _load_models():
    global _models
    if _models is None:
        for target in TARGETS:
            path = MODELS_DIR / f"{target}_model.pkl"
            if not path.exists():
                train_models()
                break
        _models = {t: joblib.load(MODELS_DIR / f"{t}_model.pkl") for t in TARGETS}
    return _models


def _predict_with_confidence(model: RandomForestRegressor, x_row: np.ndarray):
    """Mean prediction + confidence derived from spread across ensemble trees."""
    tree_preds = np.array([tree.predict(x_row)[0] for tree in model.estimators_])
    mean_pred = float(np.clip(tree_preds.mean(), 0.0, 100.0))
    std_pred = float(tree_preds.std())
    confidence = float(np.clip(100.0 - std_pred * 3.5, 55.0, 99.0))
    return mean_pred, confidence


def score_to_level(score: int) -> str:
    if score < 25:
        return "low"
    if score < 50:
        return "moderate"
    if score < 75:
        return "high"
    return "severe"


def build_safety_advisories(weather: dict, risk: dict, profile_type: str = "citizen", factors: List[str] = None) -> List[dict]:
    """Generates context-aware, actionable advisories based on weather hazards and user profile."""
    factors = factors or []
    advisories = []

    if risk["flood_risk"] >= 55 or weather.get("rainfall_mm_hr", 0) >= 20:
        advisories.append({
            "priority": "high",
            "category": "Flood & Waterlogging",
            "text": "Avoid underpasses and low-lying drainage corridors; urban flash ponding likely within 45 minutes.",
        })
    if risk["lightning_risk"] >= 50 or weather.get("lightning_strikes_min", 0) >= 5:
        advisories.append({
            "priority": "high",
            "category": "Electrical Storm",
            "text": "Seek grounded indoor shelter immediately. Unplug sensitive electronics and stay clear of open fields or tall trees.",
        })
    if risk["storm_risk"] >= 50 or weather.get("wind_speed_kmh", 0) >= 35:
        advisories.append({
            "priority": "moderate" if risk["storm_risk"] < 70 else "high",
            "category": "High Winds",
            "text": "Secure balcony/outdoor items and watch for falling branches or loose hoardings.",
        })
    if weather.get("temperature_c", 26) >= 37 or weather.get("uv_index", 5) >= 8:
        advisories.append({
            "priority": "moderate",
            "category": "Heat & UV Stress",
            "text": "Extreme solar/thermal load detected. Hydrate every 30 minutes and limit direct midday sun exposure.",
        })

    # Profile-specific guidance
    role_guidance = {
        "citizen": "Keep emergency contacts and power banks charged; monitor local municipal bulletins.",
        "commuter": "Check metro/bus transit delays and avoid waterlogged arterial junctions before departing.",
        "student": "Verify campus shuttle timings and keep guardians updated on live location.",
        "responder": "HIGH PRIORITY: Pre-position dewatering pumps, rescue boats, and emergency medical units near red-zone grids.",
        "farmer": "Protect harvested produce under tarpaulins, clear field drainage channels, and shelter livestock.",
    }
    advisories.append({
        "priority": "high" if profile_type == "responder" else "info",
        "category": f"{profile_type.capitalize()} Protocol",
        "text": role_guidance.get(profile_type, role_guidance["citizen"]),
    })

    if "medical_dependency" in factors:
        advisories.append({
            "priority": "high",
            "category": "Medical Preparedness",
            "text": "Ensure backup power for medical devices and maintain a 72-hour buffer of essential medications.",
        })
    if "low_lying_home" in factors and risk["rain_risk"] >= 40:
        advisories.append({
            "priority": "high",
            "category": "Basement / Ground-Floor Protection",
            "text": "Place flood barriers at entryways and elevate valuables above ground level.",
        })

    return advisories


def predict_risk(weather_data: dict, profile_type: str = "citizen", factors: Optional[List[str]] = None) -> dict:
    """
    Main entry point for Weather Guard risk assessment.
    Evaluates Rain, Lightning, Storm, and Flood risks + overall composite & personalized scores.
    """
    models = _load_models()
    factors = factors or []

    x_row = np.array(
        [[
            float(weather_data.get("temperature_c", 26.0)),
            float(weather_data.get("rainfall_mm_hr", 0.0)),
            float(weather_data.get("humidity_pct", 60)),
            float(weather_data.get("wind_speed_kmh", 10.0)),
            float(weather_data.get("pressure_hpa", 1013.0)),
            float(weather_data.get("lightning_strikes_min", 0)),
        ]],
        dtype=float,
    )

    result = {"grid_id": weather_data.get("grid_id", "WG-GRID-01")}
    confidences = []

    for target in TARGETS:
        pred, conf = _predict_with_confidence(models[target], x_row)
        result[target] = int(round(pred))
        confidences.append(conf)

    # Composite overall score weighted across primary hazards + peak hazard boost
    hazard_vals = [result["rain_risk"], result["lightning_risk"], result["storm_risk"], result["flood_risk"]]
    mean_hazard = sum(hazard_vals) / len(hazard_vals)
    max_hazard = max(hazard_vals)
    overall = int(round(0.6 * mean_hazard + 0.4 * max_hazard))
    overall = max(0, min(100, overall))

    # Personalized vulnerability adjustment
    factor_weights = {
        "elderly": 6,
        "medical_dependency": 8,
        "low_lying_home": 9 if result["flood_risk"] >= 30 else 5,
        "family_members": 4,
        "two_wheeler_commute": 7 if (result["rain_risk"] >= 30 or result["storm_risk"] >= 30) else 4,
        "outdoor_worker": 7,
    }
    vuln_bonus = sum(factor_weights.get(f, 5) for f in factors)
    personalized_score = min(100, overall + vuln_bonus)

    dominant_hazard = max(
        [
            ("Rainfall", result["rain_risk"]),
            ("Lightning", result["lightning_risk"]),
            ("Wind / Storm", result["storm_risk"]),
            ("Urban Flood", result["flood_risk"]),
        ],
        key=lambda item: item[1],
    )[0]

    result.update({
        "overall": overall,
        "level": score_to_level(overall),
        "personalized_score": personalized_score,
        "personalized_level": score_to_level(personalized_score),
        "dominant_hazard": dominant_hazard,
        "confidence": int(round(sum(confidences) / len(confidences))),
        "advisories": build_safety_advisories(weather_data, result, profile_type, factors),
    })
    return result


def scan_surrounding_grids(base_weather: dict) -> List[dict]:
    """
    Generates a 3x3 hyper-local spatial micro-grid around the selected location
    with realistic micro-climatic gradients for geo-spatial visualization.
    """
    base_lat = float(base_weather.get("lat", 12.9716))
    base_lon = float(base_weather.get("lon", 77.5946))
    offsets = [
        ("NW Sector", 0.035, -0.035, 1.12, -1.2),
        ("North Sector", 0.038, 0.0, 1.05, -0.5),
        ("NE Sector", 0.035, 0.035, 0.90, 0.4),
        ("West Sector", 0.0, -0.038, 1.18, -1.5),
        ("Central Core", 0.0, 0.0, 1.00, 0.0),
        ("East Sector", 0.0, 0.038, 0.85, 0.8),
        ("SW Valley", -0.035, -0.035, 1.25, -1.8),
        ("South Sector", -0.038, 0.0, 0.95, 0.2),
        ("SE Corridor", -0.035, 0.035, 0.80, 1.1),
    ]
    grids = []
    for idx, (label, dlat, dlon, rain_mult, dpress) in enumerate(offsets, start=1):
        cell_weather = {
            "grid_id": f"WG-{idx:02d}",
            "sector_name": label,
            "lat": round(base_lat + dlat, 4),
            "lon": round(base_lon + dlon, 4),
            "temperature_c": round(base_weather.get("temperature_c", 26.0) + (0.6 if rain_mult < 1 else -0.5), 1),
            "rainfall_mm_hr": round(max(0.0, base_weather.get("rainfall_mm_hr", 0.0) * rain_mult), 1),
            "humidity_pct": int(np.clip(base_weather.get("humidity_pct", 65) + (4 if rain_mult > 1 else -3), 20, 100)),
            "wind_speed_kmh": round(max(2.0, base_weather.get("wind_speed_kmh", 10.0) * (0.9 + 0.2 * rain_mult)), 1),
            "pressure_hpa": round(base_weather.get("pressure_hpa", 1012.0) + dpress, 1),
            "lightning_strikes_min": int(max(0, round(base_weather.get("lightning_strikes_min", 0) * rain_mult))),
        }
        cell_risk = predict_risk(cell_weather)
        grids.append({**cell_weather, "risk": cell_risk})
    return grids


if __name__ == "__main__":
    print("=== Weather Guard ML & Weather Engine Self-Test ===")
    metrics = train_models()
    print("Model Metrics:", json.dumps(metrics, indent=2))

    calm = get_mock_weather("WG-CALM", scenario="calm")
    print("\nCalm Scenario Risk:", predict_risk(calm)["overall"], predict_risk(calm)["level"])

    storm = get_mock_weather("WG-STORM", scenario="thunderstorm")
    print("Storm Scenario Risk:", predict_risk(storm)["overall"], predict_risk(storm)["level"])
