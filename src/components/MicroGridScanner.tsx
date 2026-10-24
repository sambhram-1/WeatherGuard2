import React, { useState } from 'react';
import { MicroGridSector, UserPreferences } from '../types/weather';
import { Compass, AlertCircle, ShieldCheck } from 'lucide-react';
import { playTactileClick } from '../services/soundEffects';

interface MicroGridScannerProps {
  sectors: MicroGridSector[];
  preferences: UserPreferences;
  onSelectSector: (sector: MicroGridSector) => void;
}

export const MicroGridScanner: React.FC<MicroGridScannerProps> = ({
  sectors,
  preferences,
  onSelectSector,
}) => {
  const [selectedId, setSelectedId] = useState<string>(sectors[4]?.id || 'sector-5');
  const activeSector = sectors.find((s) => s.id === selectedId) || sectors[4] || sectors[0];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'severe':
        return 'bg-red-500/20 border-red-500 text-red-700';
      case 'high':
        return 'bg-orange-500/20 border-orange-500 text-orange-700';
      case 'moderate':
        return 'bg-amber-500/20 border-amber-500 text-amber-700';
      default:
        return 'bg-emerald-500/20 border-emerald-500 text-emerald-700';
    }
  };

  const getCellBg = (level: string, isSelected: boolean) => {
    if (isSelected) {
      return 'ring-2 ring-slate-900 shadow-md scale-[1.02] border-slate-900 bg-white';
    }
    switch (level) {
      case 'severe':
        return 'bg-red-50 border-red-300 hover:bg-red-100';
      case 'high':
        return 'bg-orange-50 border-orange-300 hover:bg-orange-100';
      case 'moderate':
        return 'bg-amber-50 border-amber-300 hover:bg-amber-100';
      default:
        return 'bg-emerald-50 border-emerald-300 hover:bg-emerald-100';
    }
  };

  return (
    <section
      role="region"
      aria-label="3 by 3 Hyper-local Micro-Grid Scanner"
      className="px-3 py-2 text-slate-800"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-slate-700" />
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-900">
            3×3 Micro-Grid Spatial Threat Matrix
          </h3>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">
          9 Adjacent Sensor Nodes
        </span>
      </div>

      {/* 3x3 Grid Matrix */}
      <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
        {sectors.map((sector) => {
          const isSelected = sector.id === selectedId;
          const isSevere = sector.riskLevel === 'severe';

          return (
            <button
              key={sector.id}
              onClick={() => {
                playTactileClick(preferences.soundEnabled);
                setSelectedId(sector.id);
                onSelectSector(sector);
              }}
              className={`p-2 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between h-20 ${getCellBg(
                sector.riskLevel,
                isSelected
              )}`}
              aria-pressed={isSelected}
              aria-label={`${sector.sectorName}: Risk ${sector.riskScore} percent, ${sector.riskLevel}. Click to view sector details.`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[9.5px] font-bold text-slate-700 truncate max-w-[65px]">
                  {sector.sectorName.split(' ')[0]}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    sector.riskLevel === 'severe'
                      ? 'bg-red-500 animate-pulse'
                      : sector.riskLevel === 'high'
                      ? 'bg-orange-500'
                      : sector.riskLevel === 'moderate'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="my-0.5">
                <div className="font-display font-extrabold text-base leading-none text-slate-900">
                  {sector.riskScore}%
                </div>
                <div className="text-[9px] font-semibold text-slate-600 truncate mt-0.5">
                  {sector.rainfallMmHr} mm/h
                </div>
              </div>

              <div className="text-[8px] font-extrabold uppercase tracking-tight text-slate-500 truncate">
                {sector.elevationTrend}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Micro-Sector Detail Card */}
      {activeSector && (
        <div className="mt-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <div className="text-xs font-bold text-slate-900 truncate">
              {activeSector.sectorName}
            </div>
            <div className="text-[10px] text-slate-600 flex items-center gap-2 mt-0.5">
              <span>GPS: {activeSector.lat.toFixed(3)}°, {activeSector.lon.toFixed(3)}°</span>
              <span>•</span>
              <span className="font-semibold text-red-600">
                Rain: {activeSector.rainfallMmHr} mm/h
              </span>
              <span>•</span>
              <span>Wind: {activeSector.windSpeedKmh} km/h</span>
            </div>
          </div>

          <div
            className={`px-2 py-1 rounded-lg border text-center font-bold text-xs uppercase tracking-wider shrink-0 ${getRiskColor(
              activeSector.riskLevel
            )}`}
          >
            {activeSector.riskLevel}
          </div>
        </div>
      )}
    </section>
  );
};
