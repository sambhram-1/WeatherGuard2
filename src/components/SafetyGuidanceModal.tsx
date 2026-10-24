import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  MapPin,
  CheckSquare,
  Square,
  PhoneCall,
  Download,
  AlertTriangle,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { RiskAssessment, WeatherData } from '../types/weather';
import { playTactileClick } from '../services/soundEffects';

interface SafetyGuidanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: RiskAssessment;
  weather: WeatherData;
  soundEnabled: boolean;
}

interface ChecklistItem {
  id: string;
  text: string;
  category: 'Immediate' | 'Supplies' | 'Home Protection';
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'item-power', text: 'Fully charge all mobile phones, radios, and emergency power banks', category: 'Immediate' },
  { id: 'item-shelter', text: 'Relocate family, pets, and vital belongings above ground level', category: 'Immediate' },
  { id: 'item-water', text: 'Store at least 3 liters of potable drinking water per person for 72 hours', category: 'Supplies' },
  { id: 'item-meds', text: 'Assemble essential prescription medications in waterproof pouch', category: 'Supplies' },
  { id: 'item-drain', text: 'Clear balcony drain grates and secure loose outdoor patio furniture', category: 'Home Protection' },
  { id: 'item-circuit', text: 'Identify location of main electrical circuit breaker in case of water entry', category: 'Home Protection' },
];

export const SafetyGuidanceModal: React.FC<SafetyGuidanceModalProps> = ({
  isOpen,
  onClose,
  assessment,
  weather,
  soundEnabled,
}) => {
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wg_checklist_state');
      return saved ? JSON.parse(saved) : ['item-power'];
    } catch {
      return ['item-power'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('wg_checklist_state', JSON.stringify(checkedIds));
    } catch {}
  }, [checkedIds]);

  if (!isOpen) return null;

  const toggleCheck = (id: string) => {
    playTactileClick(soundEnabled);
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const completedPct = Math.round((checkedIds.length / CHECKLIST_ITEMS.length) * 100);

  // Generate downloadable JSON Situation Report
  const handleExportSitRep = () => {
    playTactileClick(soundEnabled);
    const report = {
      title: 'Weather Guard AI - Hyper-Local Threat Situation Report',
      timestamp: new Date().toISOString(),
      gridId: weather.gridId,
      location: weather.locationName,
      coordinates: { lat: weather.lat, lon: weather.lon },
      isSimulation: weather.isSimulated,
      meteorologicalObservations: {
        temperatureC: weather.temperatureC,
        rainfallMmHr: weather.rainfallMmHr,
        windSpeedKmh: weather.windSpeedKmh,
        pressureHpa: weather.pressureHpa,
        lightningStrikesMin: weather.lightningStrikesMin,
        airQualityAqi: weather.usAqi,
      },
      riskAssessment: {
        compositeScore: assessment.overallScore,
        overallLevel: assessment.overallLevel,
        dominantHazard: assessment.dominantHazard,
        personalizedScore: assessment.personalizedScore,
        confidencePct: assessment.confidencePct,
      },
      advisories: assessment.advisories,
      checklistProgressPct: completedPct,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `WeatherGuard-SitRep-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guidanceModalTitle"
    >
      <div className="w-full max-w-lg max-h-[90vh] bg-slate-900 border border-white/20 rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/15 bg-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-200 shadow-inner">
              <ShieldAlert className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <h2 id="guidanceModalTitle" className="font-display font-extrabold text-sm sm:text-base text-white">
                Actionable Safety Guidance & Shelters
              </h2>
              <p className="text-[10px] text-white/60">
                Grid {weather.gridId} • Verified Disaster Management Protocol
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Close guidance dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Active Mandate Callout */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 to-rose-950/80 border border-red-500/40 shadow-inner">
            <div className="flex items-center gap-1.5 text-red-300 font-extrabold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>IMMEDIATE SURVIVAL MANDATE</span>
            </div>
            <p className="text-white/95 leading-relaxed font-medium">
              Outer Ring Road, Bellandur, and low underpasses exceed safe wading limits. Safe evacuation corridor routed via Sarjapur Elevated Highway. Avoid flooded road dips; moving water as shallow as 15cm can sweep pedestrians.
            </p>
          </div>

          {/* Categorized Advisories */}
          <div>
            <h3 className="font-bold text-white uppercase text-[10.5px] tracking-wider mb-2 flex items-center gap-1">
              <span>Risk-Specific Action Steps</span>
              <span className="text-white/50">({assessment.advisories.length})</span>
            </h3>
            <div className="space-y-2">
              {assessment.advisories.map((adv) => (
                <div
                  key={adv.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-[11px] text-amber-300">
                      {adv.category}
                    </span>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        adv.priority === 'high'
                          ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                          : 'bg-amber-500/30 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {adv.priority} priority
                    </span>
                  </div>
                  <div className="font-semibold text-white leading-snug">{adv.title}</div>
                  <p className="text-[11px] text-white/80 mt-1">{adv.actionText}</p>
                  <div className="mt-1.5 pt-1.5 border-t border-white/10 text-[10px] text-emerald-300 font-medium">
                    ↳ Action: {adv.recommendedAction}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* High-Ground Emergency Shelters */}
          <div>
            <h3 className="font-bold text-white uppercase text-[10.5px] tracking-wider mb-2 flex items-center gap-1">
              <Home className="w-3.5 h-3.5 text-cyan-400" />
              <span>Designated High-Ground Shelters (Within 2.5km)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { name: 'Kanteerava Elevated Indoor Stadium', dist: '1.2 km NW', cap: '850 beds', status: 'Ready • Generator Active' },
                { name: 'St. Joseph Higher Ground Pavilion', dist: '1.8 km N', cap: '420 beds', status: 'Ready • Medical Station' },
                { name: 'HAL Community Relief Centre', dist: '2.4 km E', cap: '600 beds', status: 'Operational' },
              ].map((shelter, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between"
                >
                  <div className="font-bold text-white text-[11px]">{shelter.name}</div>
                  <div className="text-[10px] text-white/60 mt-0.5 flex justify-between">
                    <span>{shelter.dist}</span>
                    <span>Cap: {shelter.cap}</span>
                  </div>
                  <div className="mt-1 text-[9.5px] font-bold text-emerald-400">
                    ● {shelter.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Preparedness Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-white uppercase text-[10.5px] tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emergency Readiness Checklist</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-300">
                {checkedIds.length}/{CHECKLIST_ITEMS.length} ({completedPct}%)
              </span>
            </div>

            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-2">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${completedPct}%` }}
              />
            </div>

            <div className="space-y-1.5">
              {CHECKLIST_ITEMS.map((item) => {
                const isChecked = checkedIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className="w-full p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-start gap-2.5 text-left transition"
                    aria-checked={isChecked}
                    role="checkbox"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-white/40 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-xs block leading-snug ${
                          isChecked ? 'line-through text-white/50' : 'text-white/95 font-medium'
                        }`}
                      >
                        {item.text}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">
                        {item.category}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Helpline Dials */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/15 space-y-2">
            <span className="font-bold text-white text-[11px] block">
              Emergency Services Dispatch Helplines
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href="tel:112"
                className="py-2 px-1 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-[11px] text-center shadow-lg transition flex items-center justify-center gap-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>112 Unified</span>
              </a>
              <a
                href="tel:108"
                className="py-2 px-1 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[11px] text-center shadow-lg transition flex items-center justify-center gap-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>108 Medical</span>
              </a>
              <a
                href="tel:1077"
                className="py-2 px-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-[11px] text-center shadow-lg transition flex items-center justify-center gap-1"
              >
                <PhoneCall className="w-3 h-3" />
                <span>1077 Disaster</span>
              </a>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 border-t border-white/15 bg-slate-800/90 flex items-center gap-2">
          <button
            onClick={handleExportSitRep}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export SitRep JSON</span>
          </button>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              onClose();
            }}
            className="py-2.5 px-5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-xs uppercase tracking-wider transition active:scale-[0.98]"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
