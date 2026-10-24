import React, { useState } from 'react';
import { Maximize2, Radio } from 'lucide-react';
import { RiskAssessment, UserPreferences, WeatherData } from '../types/weather';
import { ThreeGlobeScene } from './ThreeGlobeScene';
import { playRadarSonar, playTactileClick } from '../services/soundEffects';

interface SphereArtifactProps {
  weather: WeatherData;
  assessment: RiskAssessment;
  preferences: UserPreferences;
  onRadarPing: () => void;
  onOpenGlobeInspector?: () => void;
}

export const SphereArtifact: React.FC<SphereArtifactProps> = ({
  weather,
  assessment,
  preferences,
  onRadarPing,
  onOpenGlobeInspector,
}) => {
  const isStormy = assessment.overallLevel === 'high' || assessment.overallLevel === 'severe';

  // Circumference for r=86 is 2 * PI * 86 ≈ 540.35
  const circumference = 540.35;
  const strokeOffset = circumference * (1 - assessment.overallScore / 100);

  const handlePing = () => {
    playTactileClick(preferences.soundEnabled);
    playRadarSonar(preferences.soundEnabled);
    onRadarPing();
  };

  return (
    <div
      className="relative my-2 flex flex-col items-center justify-center z-20 select-none"
      data-testid="storm-sphere-container"
    >
      {/* 3D Volumetric Three.js Globe Container */}
      <div
        className="relative w-[184px] h-[184px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-transform hover:scale-[1.02]"
        style={{
          boxShadow: isStormy
            ? '0 18px 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.4)'
            : '0 18px 45px rgba(0, 0, 0, 0.8), 0 0 35px rgba(16, 185, 129, 0.35)',
        }}
      >
        {/* Three.js 3D Procedural Meteorological Globe & Atmosphere */}
        <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center pointer-events-auto">
          <ThreeGlobeScene
            weather={weather}
            assessment={assessment}
            soundEnabled={preferences.soundEnabled}
            reducedMotion={preferences.reducedMotion}
            size={184}
            onRadarPing={onRadarPing}
          />
        </div>

        {/* Outer Circular SVG Progress Gauge Arc */}
        <svg
          className="absolute -inset-2.5 w-[204px] h-[204px] pointer-events-none -rotate-90 z-20"
          viewBox="0 0 204 204"
        >
          <circle
            cx="102"
            cy="102"
            r="86"
            fill="none"
            stroke="rgba(255, 255, 255, 0.12)"
            strokeWidth="3.5"
          />
          <circle
            cx="102"
            cy="102"
            r="86"
            fill="none"
            stroke={isStormy ? '#ef4444' : '#10b981'}
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: isStormy
                ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.9))'
                : 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.9))',
            }}
          />
        </svg>

        {/* Optical Specular Glint Reflection Overlays */}
        <div className="specular-glint-main pointer-events-none" />
        <div className="specular-rim-fresnel pointer-events-none" />

        {/* Stationary Center Readout HUD (Bottom-anchored or center with semi-transparent backdrop) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 pointer-events-none text-center">
          <div className="text-white font-display text-4xl font-black tracking-tight flex items-baseline drop-shadow-[0_2px_14px_rgba(0,0,0,0.95)]">
            <span>{assessment.overallScore}</span>
            <span
              className={`text-xl ml-0.5 ${
                isStormy ? 'text-red-300' : 'text-emerald-300'
              }`}
            >
              %
            </span>
          </div>

          <div
            className={`mt-0.5 px-2.5 py-0.5 rounded-full border backdrop-blur-md flex items-center space-x-1 shadow-lg ${
              isStormy
                ? 'bg-black/75 border-red-500/80 text-red-200'
                : 'bg-black/75 border-emerald-500/80 text-emerald-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStormy ? 'bg-red-400' : 'bg-emerald-400'
              } ${!preferences.reducedMotion ? 'animate-ping' : ''}`}
            />
            <span className="text-[9px] font-black uppercase tracking-wider font-display">
              {assessment.overallLevel === 'severe'
                ? 'Severe Threat'
                : assessment.overallLevel === 'high'
                ? 'High Hazard'
                : assessment.overallLevel === 'moderate'
                ? 'Moderate Watch'
                : 'Nominal Sky'}
            </span>
          </div>
        </div>

        {/* 3D Inspector Expand Button (Top-Right) */}
        {onOpenGlobeInspector && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              playTactileClick(preferences.soundEnabled);
              onOpenGlobeInspector();
            }}
            className="absolute top-1 right-1 z-40 p-1.5 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 text-white/80 hover:text-white transition active:scale-95 shadow-md cursor-pointer"
            title="Open 3D Globe Inspector"
            aria-label="Inspect 3D Globe in full view with micro-sectors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tap to Scan Radar Sensor Trigger */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={handlePing}
          className="glass-pill-dark px-3.5 py-1 rounded-full flex items-center space-x-2 border border-white/25 hover:border-white/50 active:scale-95 transition-all shadow-md group cursor-pointer text-white/90 hover:text-white"
          aria-label="Ping sensor radar for Doppler echo"
        >
          <div className="relative flex items-center justify-center w-2.5 h-2.5">
            {!preferences.reducedMotion && (
              <span
                className={`absolute w-full h-full rounded-full radar-pulse-ring ${
                  isStormy ? 'bg-red-500' : 'bg-emerald-500'
                }`}
              />
            )}
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isStormy ? 'bg-red-400' : 'bg-emerald-400'
              } group-hover:scale-125 transition-transform`}
            />
          </div>
          <span className="text-[10px] font-bold tracking-tight">
            {isStormy ? 'Tap Orb: Ping Convective Radar' : 'Tap Orb: Scan Solar Flux'}
          </span>
        </button>

        {onOpenGlobeInspector && (
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              onOpenGlobeInspector();
            }}
            className="glass-pill-dark px-2.5 py-1 rounded-full flex items-center space-x-1 text-[10px] font-semibold text-cyan-300 hover:text-white border border-cyan-400/30 hover:border-cyan-400/60 active:scale-95 transition cursor-pointer"
            title="Inspect 3D Globe"
            aria-label="Open 3D Globe Inspector"
          >
            <span>3D Inspect</span>
          </button>
        )}
      </div>
    </div>
  );
};
