import { MicroGridSector, WeatherData } from '../types/weather';
import { calculateMultiHazardRisk } from './riskEngine';

export interface CityLocation {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export const POPULAR_CITIES: CityLocation[] = [
  { name: 'Bengaluru', country: 'India', lat: 12.9716, lon: 77.5946 },
  { name: 'Mumbai', country: 'India', lat: 19.076, lon: 72.8777 },
  { name: 'Delhi NCR', country: 'India', lat: 28.6139, lon: 77.209 },
  { name: 'Chennai', country: 'India', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', country: 'India', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', country: 'India', lat: 17.385, lon: 78.4867 },
  { name: 'London', country: 'UK', lat: 51.5074, lon: -0.1278 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503 },
  { name: 'New York', country: 'USA', lat: 40.7128, lon: -74.006 },
];

export const SIMULATION_PRESETS: Record<
  string,
  { label: string; description: string; data: Partial<WeatherData> }
> = {
  calm: {
    label: 'Fair / Clear Sky',
    description: 'Minimal threat • 12% Risk • Clear glass radiance',
    data: {
      temperatureC: 28.2,
      feelsLikeC: 29.0,
      dewPointC: 19.0,
      rainfallMmHr: 0.0,
      humidityPct: 58,
      windSpeedKmh: 11.2,
      windGustsKmh: 15.0,
      windDirectionDeg: 115,
      pressureHpa: 1013.8,
      lightningStrikesMin: 0,
      uvIndex: 7.2,
      visibilityKm: 10.0,
      usAqi: 36,
      pm25: 8.8,
      weatherCode: 1,
    },
  },
  monsoon_deluge: {
    label: 'Monsoon Deluge',
    description: 'Heavy precipitation • 68% Risk • Rapid drain saturation',
    data: {
      temperatureC: 23.5,
      feelsLikeC: 25.8,
      dewPointC: 22.4,
      rainfallMmHr: 54.0,
      humidityPct: 94,
      windSpeedKmh: 36.0,
      windGustsKmh: 52.0,
      windDirectionDeg: 240,
      pressureHpa: 998.0,
      lightningStrikesMin: 8,
      uvIndex: 1.5,
      visibilityKm: 2.2,
      usAqi: 28,
      pm25: 6.2,
      weatherCode: 82,
    },
  },
  thunderstorm: {
    label: 'Convective Severe Storm',
    description: '78% Threat • 65 mm/h rain • 21 strikes/min • Gale gusts',
    data: {
      temperatureC: 22.4,
      feelsLikeC: 24.0,
      dewPointC: 21.3,
      rainfallMmHr: 65.0,
      humidityPct: 95,
      windSpeedKmh: 48.5,
      windGustsKmh: 72.0,
      windDirectionDeg: 255,
      pressureHpa: 994.2,
      lightningStrikesMin: 21,
      uvIndex: 1.0,
      visibilityKm: 1.4,
      usAqi: 32,
      pm25: 7.5,
      weatherCode: 96,
    },
  },
  cyclone: {
    label: 'Tropical Cyclone Inundation',
    description: 'Extreme 94% Risk • 88 mm/h rain • 82 km/h winds • 978 hPa',
    data: {
      temperatureC: 21.0,
      feelsLikeC: 22.0,
      dewPointC: 20.5,
      rainfallMmHr: 88.0,
      humidityPct: 98,
      windSpeedKmh: 82.0,
      windGustsKmh: 114.0,
      windDirectionDeg: 290,
      pressureHpa: 978.0,
      lightningStrikesMin: 28,
      uvIndex: 0.5,
      visibilityKm: 0.6,
      usAqi: 22,
      pm25: 5.0,
      weatherCode: 99,
    },
  },
  heatwave: {
    label: 'Extreme Heat Stress',
    description: 'Severe Thermal Hazard • 41.8°C • UV 11.4 • High PM2.5',
    data: {
      temperatureC: 41.8,
      feelsLikeC: 45.6,
      dewPointC: 14.0,
      rainfallMmHr: 0.0,
      humidityPct: 22,
      windSpeedKmh: 18.0,
      windGustsKmh: 27.0,
      windDirectionDeg: 320,
      pressureHpa: 1004.8,
      lightningStrikesMin: 0,
      uvIndex: 11.4,
      visibilityKm: 7.0,
      usAqi: 122,
      pm25: 44.0,
      weatherCode: 0,
    },
  },
};

export async function fetchLiveWeather(
  lat = 12.9716,
  lon = 77.5946,
  locationName = 'Bengaluru'
): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,rain,precipitation,surface_pressure,wind_speed_10m,wind_gusts_10m,wind_direction_10m,uv_index,visibility,weather_code&hourly=temperature_2m,precipitation_probability,rain,wind_speed_10m&forecast_hours=12&timezone=auto`;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5`;

  try {
    const [resWeather, resAqi] = await Promise.allSettled([
      fetch(weatherUrl),
      fetch(aqiUrl),
    ]);

    if (resWeather.status !== 'fulfilled' || !resWeather.value.ok) {
      throw new Error('Open-Meteo weather response non-ok');
    }

    const wData = await resWeather.value.json();
    const curr = wData.current || {};

    let usAqi = 38;
    let pm25 = 9.2;
    if (resAqi.status === 'fulfilled' && resAqi.value.ok) {
      try {
        const aqiData = await resAqi.value.json();
        if (aqiData.current) {
          usAqi = aqiData.current.us_aqi ?? usAqi;
          pm25 = aqiData.current.pm2_5 ?? pm25;
        }
      } catch {
        // Fallback AQI retained
      }
    }

    const temp = Number(curr.temperature_2m ?? 26.0);
    const humidity = Number(curr.relative_humidity_2m ?? 65);
    const rain = Number(curr.rain ?? curr.precipitation ?? 0.0);
    const pressure = Number(curr.surface_pressure ?? 1013.0);
    const wind = Number(curr.wind_speed_10m ?? 12.0);
    const gusts = Number(curr.wind_gusts_10m ?? wind * 1.3);
    const weatherCode = Number(curr.weather_code ?? 0);

    // Approximate lightning based on convective indicators & WMO code
    let lightning = 0;
    if (weatherCode >= 95 || rain >= 15 || pressure < 998) {
      lightning = Math.floor(12 + Math.random() * 15);
    } else if (rain >= 3 || pressure < 1005) {
      lightning = Math.floor(2 + Math.random() * 5);
    }

    const dewPoint = Math.round((temp - (100 - humidity) / 5) * 10) / 10;

    return {
      gridId: 'WG-LIVE-NODE',
      locationName,
      lat,
      lon,
      isSimulated: false,
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperatureC: Math.round(temp * 10) / 10,
      feelsLikeC: Math.round(Number(curr.apparent_temperature ?? temp) * 10) / 10,
      dewPointC: dewPoint,
      rainfallMmHr: Math.round(rain * 10) / 10,
      humidityPct: Math.round(humidity),
      windSpeedKmh: Math.round(wind * 10) / 10,
      windGustsKmh: Math.round(gusts * 10) / 10,
      windDirectionDeg: Number(curr.wind_direction_10m ?? 180),
      pressureHpa: Math.round(pressure * 10) / 10,
      lightningStrikesMin: lightning,
      uvIndex: Math.round(Number(curr.uv_index ?? 5.0) * 10) / 10,
      visibilityKm: Math.round((Number(curr.visibility ?? 10000) / 1000) * 10) / 10,
      usAqi,
      pm25: Math.round(pm25 * 10) / 10,
      weatherCode,
      hourly: wData.hourly
        ? {
            time: (wData.hourly.time || []).slice(0, 12),
            temperature: (wData.hourly.temperature_2m || []).slice(0, 12),
            precipitationProbability: (wData.hourly.precipitation_probability || []).slice(0, 12),
            rain: (wData.hourly.rain || []).slice(0, 12),
            windSpeed: (wData.hourly.wind_speed_10m || []).slice(0, 12),
          }
        : undefined,
    };
  } catch (err) {
    console.warn('[Weather Guard] Real API offline, falling back to simulated calm weather:', err);
    return getSimulatedWeather('calm', lat, lon, locationName);
  }
}

export function getSimulatedWeather(
  presetKey = 'thunderstorm',
  lat = 12.9716,
  lon = 77.5946,
  locationName = 'Bengaluru'
): WeatherData {
  const preset = SIMULATION_PRESETS[presetKey] || SIMULATION_PRESETS.thunderstorm;
  const p = preset.data;

  // Generate synthetic 12-hour hourly projection
  const now = new Date();
  const times: string[] = [];
  const temps: number[] = [];
  const rainProbs: number[] = [];
  const rains: number[] = [];
  const winds: number[] = [];

  for (let i = 0; i < 12; i++) {
    const h = new Date(now.getTime() + i * 3600000);
    times.push(h.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    const cycle = Math.sin((i / 12) * Math.PI);
    temps.push(Math.round(((p.temperatureC ?? 26) + (i > 6 ? -2 : 1) * cycle) * 10) / 10);
    rainProbs.push(Math.min(100, Math.round(((p.rainfallMmHr ?? 0) > 5 ? 85 : 15) + (cycle * 20))));
    rains.push(Math.round(Math.max(0, (p.rainfallMmHr ?? 0) * (0.8 + 0.5 * cycle)) * 10) / 10);
    winds.push(Math.round(((p.windSpeedKmh ?? 12) * (0.9 + 0.3 * cycle)) * 10) / 10);
  }

  return {
    gridId: `WG-SIM-${presetKey.toUpperCase().slice(0, 4)}`,
    locationName,
    lat,
    lon,
    isSimulated: true,
    simulationPreset: presetKey,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperatureC: p.temperatureC ?? 26,
    feelsLikeC: p.feelsLikeC ?? 27.5,
    dewPointC: p.dewPointC ?? 20.5,
    rainfallMmHr: p.rainfallMmHr ?? 0,
    humidityPct: p.humidityPct ?? 65,
    windSpeedKmh: p.windSpeedKmh ?? 14,
    windGustsKmh: p.windGustsKmh ?? 20,
    windDirectionDeg: p.windDirectionDeg ?? 250,
    pressureHpa: p.pressureHpa ?? 1012,
    lightningStrikesMin: p.lightningStrikesMin ?? 0,
    uvIndex: p.uvIndex ?? 5,
    visibilityKm: p.visibilityKm ?? 8,
    usAqi: p.usAqi ?? 35,
    pm25: p.pm25 ?? 8,
    weatherCode: p.weatherCode ?? 1,
    hourly: {
      time: times,
      temperature: temps,
      precipitationProbability: rainProbs,
      rain: rains,
      windSpeed: winds,
    },
  };
}

export function generateMicroGridSectors(base: WeatherData): MicroGridSector[] {
  const sectorsConfig: Array<{
    name: string;
    dlat: number;
    dlon: number;
    rainMult: number;
    windMult: number;
    dpress: number;
    trend: 'low-lying' | 'elevated' | 'standard';
  }> = [
    { name: 'NW Sector (Hebbal Lake Drainage)', dlat: 0.035, dlon: -0.035, rainMult: 1.15, windMult: 1.1, dpress: -1.4, trend: 'low-lying' },
    { name: 'North Sector (Yelahanka Corridor)', dlat: 0.038, dlon: 0.0, rainMult: 1.05, windMult: 1.05, dpress: -0.6, trend: 'standard' },
    { name: 'NE Sector (Airport Expressway)', dlat: 0.035, dlon: 0.035, rainMult: 0.88, windMult: 1.18, dpress: 0.4, trend: 'elevated' },
    { name: 'West Sector (Yeshwanthpur Industrial)', dlat: 0.0, dlon: -0.038, rainMult: 1.20, windMult: 0.95, dpress: -1.6, trend: 'low-lying' },
    { name: 'Central Core (CBD & MG Road)', dlat: 0.0, dlon: 0.0, rainMult: 1.00, windMult: 1.00, dpress: 0.0, trend: 'standard' },
    { name: 'East Sector (Whitefield IT Hub)', dlat: 0.0, dlon: 0.038, rainMult: 0.85, windMult: 0.92, dpress: 0.8, trend: 'standard' },
    { name: 'SW Valley (Silk Board & Bellandur)', dlat: -0.035, dlon: -0.035, rainMult: 1.30, windMult: 1.15, dpress: -2.0, trend: 'low-lying' },
    { name: 'South Sector (Jayanagar Uplands)', dlat: -0.038, dlon: 0.0, rainMult: 0.92, windMult: 0.90, dpress: 0.5, trend: 'elevated' },
    { name: 'SE Corridor (Electronic City Elevated)', dlat: -0.035, dlon: 0.035, rainMult: 0.78, windMult: 0.88, dpress: 1.2, trend: 'elevated' },
  ];

  return sectorsConfig.map((cfg, idx) => {
    const lat = Math.round((base.lat + cfg.dlat) * 10000) / 10000;
    const lon = Math.round((base.lon + cfg.dlon) * 10000) / 10000;
    const rainfall = Math.round(Math.max(0, base.rainfallMmHr * cfg.rainMult) * 10) / 10;
    const wind = Math.round(Math.max(2, base.windSpeedKmh * cfg.windMult) * 10) / 10;
    const pressure = Math.round((base.pressureHpa + cfg.dpress) * 10) / 10;
    const strikes = Math.round(base.lightningStrikesMin * cfg.rainMult);

    const cellWeather: WeatherData = {
      ...base,
      gridId: `WG-0${idx + 1}`,
      lat,
      lon,
      rainfallMmHr: rainfall,
      windSpeedKmh: wind,
      pressureHpa: pressure,
      lightningStrikesMin: strikes,
    };

    const risk = calculateMultiHazardRisk(cellWeather);

    return {
      id: `sector-${idx + 1}`,
      sectorName: cfg.name,
      lat,
      lon,
      temperatureC: base.temperatureC,
      rainfallMmHr: rainfall,
      windSpeedKmh: wind,
      pressureHpa: pressure,
      lightningStrikesMin: strikes,
      riskScore: risk.overallScore,
      riskLevel: risk.overallLevel,
      dominantHazard: risk.dominantHazard,
      elevationTrend: cfg.trend,
    };
  });
}

export async function searchCities(query: string): Promise<CityLocation[]> {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        query.trim()
      )}&count=6&language=en&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      name: item.name,
      country: item.country || item.admin1 || '',
      lat: item.latitude,
      lon: item.longitude,
    }));
  } catch {
    return [];
  }
}
