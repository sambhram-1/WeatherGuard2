import React, { useState } from 'react';
import {
  Sliders,
  X,
  Play,
  RotateCcw,
  Sparkles,
  CloudLightning,
  Sun,
  CloudRain,
  Wind,
} from 'lucide-react';
import { WeatherData } from '../types/weather';
import { SIMULATION_PRESETS } from '../services/weatherService';
import { playTactileClick } from '../services/soundEffects';

interface StormSimulatorLabProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather: WeatherData;
  onApplyCustomWeather: (weather: WeatherData) => void;
  onResetToLive: () => void;
  soundEnabled: boolean;
}

export const StormSimulatorLab: React.FC<StormSimulatorLabProps> = ({
  isOpen,
  onClose,
  currentWeather,
  onApplyCustomWeather,
  onResetToLive,
  soundEnabled,
}) => {
  const [params, setParams] = useState({
    rainfallMmHr: currentWeather.rainfallMmHr,
    windSpeedKmh: currentWeather.windSpeedKmh,
    pressureHpa: currentWeather.pressureHpa,
    temperatureC: currentWeather.temperatureC,
    humidityPct: currentWeather.humidityPct,
    lightningStrikesMin: currentWeather.lightningStrikesMin,
  });

  if (!isOpen) return null;

  const handlePresetSelect = (presetKey: string) => {
    playTactileClick(soundEnabled);
    const preset = SIMULATION_PRESETS[presetKey];
    if (preset && preset.data) {
      setParams({
        rainfallMmHr: preset.data.rainfallMmHr ?? 0,
        windSpeedKmh: preset.data.windSpeedKmh ?? 10,
        pressureHpa: preset.data.pressureHpa ?? 1013,
        temperatureC: preset.data.temperatureC ?? 26,
        humidityPct: preset.data.humidityPct ?? 65,
        lightningStrikesMin: preset.data.lightningStrikesMin ?? 0,
      });
    }
  };

  const handleApply = () => {
    playTactileClick(soundEnabled);
    const updated: WeatherData = {
      ...currentWeather,
      ...params,
      isSimulated: true,
      simulationPreset: 'custom_lab',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onApplyCustomWeather(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="simLabHeading"
    >
      <div className="w-full max-w-lg bg-slate-900 border border-purple-500/50 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800 to-indigo-800 p-4 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-purple-200 shadow-inner">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h2 id="simLabHeading" className="font-display font-extrabold text-sm sm:text-base text-white">
                Meteorological "What-If" Simulation Lab
              </h2>
              <p className="text-[10px] text-purple-200/80">
                Stress-test the 4-model RandomForest threat matrix with synthetic hazards
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Close simulator"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Preset Buttons */}
          <div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              Instant Disaster & Climate Presets
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {[
                { id: 'calm', label: '☀️ Fair Sky', sub: '12% Threat' },
                { id: 'monsoon_deluge', label: '🌧️ Monsoon', sub: '68% Deluge' },
                { id: 'thunderstorm', label: '⚡ Thunderstorm', sub: '78% Severe' },
                { id: 'cyclone', label: '🌀 Cyclone', sub: '94% Catastrophic' },
                { id: 'heatwave', label: '🔥 Heatwave', sub: '58% Thermal' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePresetSelect(p.id)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-left transition active:scale-95 flex flex-col justify-between"
                >
                  <span className="font-bold text-white text-[11px] truncate">{p.label}</span>
                  <span className="text-[9px] text-purple-300 font-semibold">{p.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders Grid */}
          <div className="space-y-3 pt-1 border-t border-white/10">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
              Parameter Controls
            </span>

            {/* Rainfall Slider */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-red-300">
                  <CloudRain className="w-3.5 h-3.5" /> Rainfall Rate
                </span>
                <span className="font-mono text-white font-bold">{params.rainfallMmHr} mm/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                step="1"
                value={params.rainfallMmHr}
                onChange={(e) => setParams({ ...params, rainfallMmHr: Number(e.target.value) })}
                className="w-full accent-red-500 cursor-pointer"
                aria-label="Rainfall rate in millimeters per hour"
              />
            </div>

            {/* Wind Speed Slider */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-amber-300">
                  <Wind className="w-3.5 h-3.5" /> Wind Sustained
                </span>
                <span className="font-mono text-white font-bold">{params.windSpeedKmh} km/h</span>
              </div>
              <input
                type="range"
                min="0"
                max="140"
                step="1"
                value={params.windSpeedKmh}
                onChange={(e) => setParams({ ...params, windSpeedKmh: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
                aria-label="Wind speed in kilometers per hour"
              />
            </div>

            {/* Surface Pressure Slider */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-indigo-300">Surface Pressure (Storm Eye)</span>
                <span className="font-mono text-white font-bold">{params.pressureHpa} hPa</span>
              </div>
              <input
                type="range"
                min="960"
                max="1030"
                step="0.5"
                value={params.pressureHpa}
                onChange={(e) => setParams({ ...params, pressureHpa: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
                aria-label="Surface pressure in hectopascals"
              />
            </div>

            {/* Lightning Strikes */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-yellow-300">
                  <CloudLightning className="w-3.5 h-3.5" /> Lightning Strikes
                </span>
                <span className="font-mono text-white font-bold">{params.lightningStrikesMin} strikes/min</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="1"
                value={params.lightningStrikesMin}
                onChange={(e) => setParams({ ...params, lightningStrikesMin: Number(e.target.value) })}
                className="w-full accent-yellow-400 cursor-pointer"
                aria-label="Lightning strikes per minute"
              />
            </div>

            {/* Temperature Slider */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1 text-cyan-300">
                  <Sun className="w-3.5 h-3.5" /> Ambient Temperature
                </span>
                <span className="font-mono text-white font-bold">{params.temperatureC}°C</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="0.5"
                value={params.temperatureC}
                onChange={(e) => setParams({ ...params, temperatureC: Number(e.target.value) })}
                className="w-full accent-cyan-400 cursor-pointer"
                aria-label="Temperature in celsius"
              />
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/15 bg-slate-800/90 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onResetToLive();
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset To Live</span>
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Hazard Inference</span>
          </button>
        </div>
      </div>
    </div>
  );
};
