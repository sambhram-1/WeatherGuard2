import React, { useState } from 'react';
import {
  Globe,
  X,
  Compass,
  Radio,
  Eye,
  Maximize2,
  Minimize2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MicroGridSector, RiskAssessment, WeatherData } from '../types/weather';
import { ThreeGlobeScene } from './ThreeGlobeScene';
import { playTactileClick } from '../services/soundEffects';

interface GlobeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  assessment: RiskAssessment;
  sectors: MicroGridSector[];
  soundEnabled: boolean;
  reducedMotion: boolean;
  onRadarPing: () => void;
}

export const GlobeInspectorModal: React.FC<GlobeInspectorModalProps> = ({
  isOpen,
  onClose,
  weather,
  assessment,
  sectors,
  soundEnabled,
  reducedMotion,
  onRadarPing,
}) => {
  const [activeLayer, setActiveLayer] = useState<'clouds' | 'radars' | 'graticule'>('radars');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="globeInspectorTitle"
    >
      <div className="w-full max-w-lg bg-slate-950 border border-white/20 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-3.5 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-inner">
              <Globe className="w-4 h-4" />
            </span>
            <div>
              <h2 id="globeInspectorTitle" className="font-display font-black text-sm text-white uppercase tracking-wider">
                Orbital Weather Guard 3D Globe Inspector
              </h2>
              <p className="text-[10px] text-white/60">
                PBR Multi-Layer Meteorological Globe • Lat {weather.lat}°, Lon {weather.lon}°
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/70 hover:text-white transition"
            aria-label="Close 3D globe inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Central 3D Interactive Viewport */}
        <div className="relative flex-1 min-h-[320px] flex flex-col items-center justify-center bg-radial from-slate-900 via-[#07040d] to-black overflow-hidden p-4">
          {/* Subtle Background Orbital Star Field Grid */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at center, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Three.js Globe Scene */}
          <div className="relative z-10 flex items-center justify-center">
            <ThreeGlobeScene
              weather={weather}
              assessment={assessment}
              soundEnabled={soundEnabled}
              reducedMotion={reducedMotion}
              size={280}
              onRadarPing={onRadarPing}
            />
          </div>

          {/* Floating HUD Badges inside Viewport */}
          <div className="absolute top-3 left-3 glass-pill-dark px-2.5 py-1 rounded-xl text-[10px] font-mono text-white/80 pointer-events-none">
            <span>COORD: {weather.lat.toFixed(3)}°N, {weather.lon.toFixed(3)}°E</span>
          </div>

          <div className="absolute top-3 right-3 glass-pill-dark px-2.5 py-1 rounded-xl text-[10px] font-mono text-cyan-300 pointer-events-none flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>DOPPLER BEACON ACTIVE</span>
          </div>

          <div className="absolute bottom-3 inset-x-4 flex justify-between items-center text-[10px] text-white/60 font-semibold pointer-events-none">
            <span>Drag anywhere to spin • Tap to ping radar</span>
            <span className="text-amber-300 font-bold">Threat: {assessment.overallScore}%</span>
          </div>
        </div>

        {/* 9-Sector Spatial List Bar */}
        <div className="p-3 bg-slate-900 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Surrounding Radar Corridors (9 Nodes)</span>
            </span>
            <span className="text-[10px] text-white/50">Grid {weather.gridId}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 max-h-28 overflow-y-auto pr-0.5">
            {sectors.map((s) => (
              <div
                key={s.id}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] flex justify-between items-center"
              >
                <span className="truncate font-medium text-white/90 max-w-[70px]">
                  {s.sectorName.split(' ')[0]}
                </span>
                <span
                  className={`font-mono font-bold text-[9px] px-1 rounded ${
                    s.riskLevel === 'severe'
                      ? 'bg-red-500/30 text-red-300'
                      : s.riskLevel === 'high'
                      ? 'bg-orange-500/30 text-orange-300'
                      : s.riskLevel === 'moderate'
                      ? 'bg-amber-500/30 text-amber-300'
                      : 'bg-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {s.riskScore}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/10 bg-slate-950 flex items-center justify-between">
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onRadarPing();
            }}
            className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition active:scale-95"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Ping Doppler Radar Pulse</span>
          </button>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onClose();
            }}
            className="py-2 px-4 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-bold text-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
