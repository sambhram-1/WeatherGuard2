import React, { useState } from 'react';
import { TrendingUp, CloudRain, Thermometer, Wind } from 'lucide-react';
import { UserPreferences, WeatherData } from '../types/weather';
import { playTactileClick } from '../services/soundEffects';

interface TrendForecastProps {
  weather: WeatherData;
  preferences: UserPreferences;
}

export const TrendForecast: React.FC<TrendForecastProps> = ({
  weather,
  preferences,
}) => {
  const [metric, setMetric] = useState<'rain' | 'temp' | 'wind'>('rain');

  const hourly = weather.hourly;
  if (!hourly || !hourly.time || hourly.time.length === 0) {
    return null;
  }

  const times = hourly.time.slice(0, 8);
  const rainVals = hourly.precipitationProbability.slice(0, 8);
  const tempVals = hourly.temperature.slice(0, 8).map((t) =>
    preferences.tempUnit === 'F' ? Math.round((t * 9) / 5 + 32) : Math.round(t)
  );
  const windVals = hourly.windSpeed.slice(0, 8).map((w) =>
    preferences.speedUnit === 'mph' ? Math.round(w * 0.621371) : Math.round(w)
  );

  let activeVals = rainVals;
  let unit = '%';
  let chartColor = '#ef4444';
  let fillColor = 'rgba(239, 68, 68, 0.15)';

  if (metric === 'temp') {
    activeVals = tempVals;
    unit = preferences.tempUnit === 'F' ? '°F' : '°C';
    chartColor = '#0ea5e9';
    fillColor = 'rgba(14, 165, 233, 0.15)';
  } else if (metric === 'wind') {
    activeVals = windVals;
    unit = preferences.speedUnit === 'mph' ? 'mph' : 'km/h';
    chartColor = '#f59e0b';
    fillColor = 'rgba(245, 158, 11, 0.15)';
  }

  const minVal = Math.min(...activeVals);
  const maxVal = Math.max(...activeVals);
  const range = maxVal - minVal || 1;

  // Compute SVG Points (width=340, height=80, padding=16)
  const width = 340;
  const height = 75;
  const padX = 20;
  const padY = 16;
  const stepX = (width - 2 * padX) / (activeVals.length - 1);

  const points = activeVals.map((val, i) => {
    const x = padX + i * stepX;
    const y = height - padY - ((val - minVal) / range) * (height - 2 * padY);
    return { x, y, val, time: times[i] };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${p.y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  return (
    <section
      role="region"
      aria-label="12-Hour Nowcasting Trend Projection"
      className="px-3 py-2 text-slate-800"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-slate-700" />
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
            Hourly Nowcast Projection
          </h3>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-slate-200/60 p-0.5">
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              setMetric('rain');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
              metric === 'rain'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
            aria-pressed={metric === 'rain'}
          >
            Rain %
          </button>
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              setMetric('temp');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
              metric === 'temp'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
            aria-pressed={metric === 'temp'}
          >
            Temp
          </button>
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              setMetric('wind');
            }}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md transition ${
              metric === 'wind'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-700 hover:text-slate-900'
            }`}
            aria-pressed={metric === 'wind'}
          >
            Wind
          </button>
        </div>
      </div>

      {/* Responsive SVG Chart Card */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height + 22}`}
          className="w-full h-24 overflow-visible"
          role="img"
          aria-label={`Trend chart showing ${metric} forecast over next hours`}
        >
          {/* Area fill */}
          <path d={areaD} fill={fillColor} />
          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={chartColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Dots and Labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#ffffff"
                stroke={chartColor}
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 7}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="bold"
                fill="#1e293b"
              >
                {p.val}
                {idx === 0 || idx === points.length - 1 ? unit : ''}
              </text>
              <text
                x={p.x}
                y={height + 14}
                textAnchor="middle"
                fontSize="8"
                fontWeight="600"
                fill="#64748b"
              >
                {p.time.split(' ')[0]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
};
