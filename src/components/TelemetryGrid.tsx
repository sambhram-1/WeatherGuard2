import React from 'react';
import {
  CloudRain,
  Wind,
  Thermometer,
  Zap,
  Gauge,
  Droplets,
  Sun,
  Activity,
} from 'lucide-react';
import { RiskAssessment, UserPreferences, WeatherData } from '../types/weather';
import { playTactileClick } from '../services/soundEffects';

interface TelemetryGridProps {
  weather: WeatherData;
  assessment: RiskAssessment;
  preferences: UserPreferences;
  onCardClick: (label: string, detail: string) => void;
}

export const TelemetryGrid: React.FC<TelemetryGridProps> = ({
  weather,
  assessment,
  preferences,
  onCardClick,
}) => {
  // Unit conversion helpers
  const formatTemp = (c: number) => {
    if (preferences.tempUnit === 'F') {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${c}°C`;
  };

  const formatSpeed = (kmh: number) => {
    if (preferences.speedUnit === 'mph') {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${kmh} km/h`;
  };

  // Pressure trend heuristic
  const pressureTrend =
    weather.pressureHpa < 1000
      ? 'Rapidly Dropping ⚠️'
      : weather.pressureHpa < 1008
      ? 'Slow Descent'
      : 'Barometric Steady';

  // AQI color & description
  const getAqiCategory = (aqi: number) => {
    if (aqi <= 50) return { label: 'Good', color: 'text-emerald-700 bg-emerald-100' };
    if (aqi <= 100) return { label: 'Moderate', color: 'text-amber-800 bg-amber-100' };
    if (aqi <= 150) return { label: 'Sensitive', color: 'text-orange-800 bg-orange-100' };
    return { label: 'Unhealthy', color: 'text-red-800 bg-red-100' };
  };

  const aqiInfo = getAqiCategory(weather.usAqi);

  return (
    <section
      role="region"
      aria-label="Environmental Telemetry Bento Matrix"
      className="grid grid-cols-2 gap-2.5 px-3 py-2 text-slate-800"
    >
      {/* 1. Precipitation Rate (Spans 2 rows on left or hero card) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Precipitation Doppler',
            `${weather.rainfallMmHr} mm/h precipitation rate. Risk level: ${assessment.rainRisk}%.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Precipitation Doppler', `${weather.rainfallMmHr} mm/h rate.`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-red-400"
        aria-label={`Precipitation: ${weather.rainfallMmHr} millimeters per hour`}
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-inner">
            <CloudRain className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-[10px] font-black text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
            {weather.rainfallMmHr > 25
              ? 'Torrent'
              : weather.rainfallMmHr > 5
              ? 'Moderate'
              : 'Drizzle'}
          </span>
        </div>

        <div className="my-1.5">
          <div className="text-2xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            {weather.rainfallMmHr}{' '}
            <span className="text-xs font-semibold text-slate-600">mm/h</span>
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">Precipitation Rate</p>
        </div>

        {/* 6-Hour Mini Forecast Bars */}
        <div className="space-y-1">
          <div className="flex items-end justify-between h-8 px-1 pt-1 bg-slate-100/60 rounded-lg">
            {[-2, -1, 0, 1, 2, 3].map((offset, i) => {
              const height =
                offset === 0
                  ? Math.min(28, Math.max(8, weather.rainfallMmHr * 0.45))
                  : Math.min(24, Math.max(5, (weather.rainfallMmHr * 0.3) + (i % 3) * 4));
              const isNow = offset === 0;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <div
                    className={`w-1.5 rounded-full transition-all ${
                      isNow
                        ? 'bg-red-600 animate-pulse'
                        : height > 14
                        ? 'bg-red-400'
                        : 'bg-slate-300'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  <span
                    className={`text-[9px] font-semibold ${
                      isNow ? 'text-red-700 font-extrabold' : 'text-slate-500'
                    }`}
                  >
                    {isNow ? 'Now' : `${offset > 0 ? '+' : ''}${offset}h`}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="text-[9px] font-extrabold text-red-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Peak Cell In ~25 min</span>
          </div>
        </div>
      </div>

      {/* 2. Wind & Gust Vector */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Wind Vector',
            `Sustained: ${formatSpeed(weather.windSpeedKmh)}, Peak Gusts: ${formatSpeed(
              weather.windGustsKmh
            )}. Bearing: ${weather.windDirectionDeg}°.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Wind Vector', `Sustained: ${formatSpeed(weather.windSpeedKmh)}`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label={`Wind speed: ${formatSpeed(weather.windSpeedKmh)}, gusts: ${formatSpeed(weather.windGustsKmh)}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
            <Wind className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-md uppercase">
            {weather.windDirectionDeg > 200 && weather.windDirectionDeg < 300
              ? 'WSW'
              : weather.windDirectionDeg > 300
              ? 'NW'
              : weather.windDirectionDeg > 90
              ? 'SE'
              : 'NE'}
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            {formatSpeed(weather.windSpeedKmh)}
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">
            Gusts: {formatSpeed(weather.windGustsKmh)}
          </p>
        </div>

        <div className="text-[9.5px] text-slate-500 font-semibold mt-1 flex items-center gap-1">
          <span>Bearing {weather.windDirectionDeg}°</span>
          <span className="text-amber-700 font-bold">
            {weather.windSpeedKmh > 35 ? '• Gale Force' : '• Moderate'}
          </span>
        </div>
      </div>

      {/* 3. Temperature & Dew Point */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Thermal Sensors',
            `Ambient: ${formatTemp(weather.temperatureC)}, Feels like: ${formatTemp(
              weather.feelsLikeC
            )}, Dew Point: ${formatTemp(weather.dewPointC)}.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Thermal Sensors', `Ambient: ${formatTemp(weather.temperatureC)}`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400"
        aria-label={`Temperature: ${formatTemp(weather.temperatureC)}, feels like ${formatTemp(weather.feelsLikeC)}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center shadow-inner">
            <Thermometer className="w-4 h-4 text-cyan-600" />
          </div>
          <span className="text-[10px] font-bold text-cyan-800 bg-cyan-200/80 px-1.5 py-0.5 rounded-md">
            Dew {formatTemp(weather.dewPointC)}
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            {formatTemp(weather.temperatureC)}
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">
            Feels like {formatTemp(weather.feelsLikeC)}
          </p>
        </div>

        <div className="text-[9.5px] text-slate-500 font-semibold mt-1">
          Thermal load nominal
        </div>
      </div>

      {/* 4. Electrical Activity (Lightning Strikes) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Lightning RF Sensor',
            `Sensor records ${weather.lightningStrikesMin} cloud-to-ground strikes per minute within a 15km radar radius.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Lightning RF Sensor', `${weather.lightningStrikesMin} strikes/min`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label={`Electrical lightning activity: ${weather.lightningStrikesMin} strikes per minute`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-inner">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/80 px-1.5 py-0.5 rounded-full">
            {weather.lightningStrikesMin > 10
              ? 'Severe RF'
              : weather.lightningStrikesMin > 0
              ? 'Active RF'
              : 'Quiet'}
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            {weather.lightningStrikesMin}{' '}
            <span className="text-[11px] font-semibold text-slate-600">strikes/m</span>
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">Electrical Activity</p>
        </div>

        <div className="flex items-center space-x-1 mt-1">
          {[4, 8, 14, 6, 12, 18, 9, 5].map((h, idx) => (
            <span
              key={idx}
              className={`w-1 rounded-full ${
                weather.lightningStrikesMin > 5
                  ? 'bg-amber-500 animate-pulse'
                  : 'bg-slate-300'
              }`}
              style={{ height: `${h}px` }}
            />
          ))}
          <span className="text-[9px] font-bold text-slate-500 ml-1">15km range</span>
        </div>
      </div>

      {/* 5. Barometric Pressure */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Barometric Surface Pressure',
            `Current pressure: ${weather.pressureHpa} hPa. State: ${pressureTrend}. Pressure drops signify storm convection.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Pressure', `${weather.pressureHpa} hPa`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-label={`Surface barometric pressure: ${weather.pressureHpa} hectopascals, trend: ${pressureTrend}`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-inner">
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-[10px] font-bold text-indigo-800 bg-indigo-200/80 px-1.5 py-0.5 rounded-md">
            hPa
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            {weather.pressureHpa}
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">Surface Pressure</p>
        </div>

        <div className="text-[9.5px] font-semibold text-indigo-900 mt-1 truncate">
          {pressureTrend}
        </div>
      </div>

      {/* 6. Relative Humidity */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Atmospheric Moisture',
            `Relative humidity: ${weather.humidityPct}%. High humidity fuels rapid cloud convection and downpours.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Humidity', `${weather.humidityPct}%`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-400"
        aria-label={`Relative humidity: ${weather.humidityPct} percent`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-inner">
            <Droplets className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-[10px] font-bold text-blue-800 bg-blue-200/80 px-1.5 py-0.5 rounded-md">
            Saturated
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            {weather.humidityPct}%
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">Relative Humidity</p>
        </div>

        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className="bg-blue-600 h-full rounded-full transition-all"
            style={{ width: `${weather.humidityPct}%` }}
          />
        </div>
      </div>

      {/* 7. Air Quality (US AQI & PM2.5) */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Air Quality Index',
            `US AQI: ${weather.usAqi} (${aqiInfo.label}), PM2.5: ${weather.pm25} µg/m³.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('Air Quality', `AQI ${weather.usAqi}`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400"
        aria-label={`Air quality index: ${weather.usAqi}, level ${aqiInfo.label}, PM2.5 ${weather.pm25} micrograms per cubic meter`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-inner">
            <Activity className="w-4 h-4 text-teal-600" />
          </div>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${aqiInfo.color}`}
          >
            {aqiInfo.label}
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            AQI {weather.usAqi}
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">
            PM2.5: {weather.pm25} µg/m³
          </p>
        </div>

        <div className="text-[9.5px] text-slate-500 font-semibold mt-1">
          Clean breathable air
        </div>
      </div>

      {/* 8. UV Index & Solar Radiance */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          playTactileClick(preferences.soundEnabled);
          onCardClick(
            'Solar & UV Radiance',
            `UV Index: ${weather.uvIndex}. Visibility: ${weather.visibilityKm} km.`
          );
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCardClick('UV Index', `${weather.uvIndex}`);
          }
        }}
        className="neomorphic-telemetry-card p-3 flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-400"
        aria-label={`UV Index: ${weather.uvIndex}, visibility: ${weather.visibilityKm} kilometers`}
      >
        <div className="flex items-center justify-between">
          <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-inner">
            <Sun className="w-4 h-4 text-orange-600" />
          </div>
          <span className="text-[10px] font-bold text-orange-800 bg-orange-200/80 px-1.5 py-0.5 rounded-md">
            Vis {weather.visibilityKm}km
          </span>
        </div>

        <div className="mt-1">
          <div className="text-xl font-display font-extrabold tracking-tight text-slate-900 leading-none">
            UV {weather.uvIndex}
          </div>
          <p className="text-[11px] font-bold text-slate-700 mt-0.5">Solar Radiance</p>
        </div>

        <div className="text-[9.5px] font-semibold text-slate-500 mt-1">
          {weather.uvIndex >= 8
            ? 'Extreme UV protection required'
            : weather.uvIndex >= 5
            ? 'Moderate sun exposure'
            : 'Low solar hazard'}
        </div>
      </div>
    </section>
  );
};
