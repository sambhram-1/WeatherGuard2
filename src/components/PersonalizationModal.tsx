import React from 'react';
import {
  UserCheck,
  X,
  Shield,
  Briefcase,
  GraduationCap,
  HeartPulse,
  Truck,
  Check,
} from 'lucide-react';
import {
  UserPreferences,
  UserRole,
  VulnerabilityFactorId,
} from '../types/weather';
import { playTactileClick } from '../services/soundEffects';

interface PersonalizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onUpdatePreferences: (pref: Partial<UserPreferences>) => void;
  baseScore: number;
  personalizedScore: number;
}

export const PersonalizationModal: React.FC<PersonalizationModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onUpdatePreferences,
  baseScore,
  personalizedScore,
}) => {
  if (!isOpen) return null;

  const roles: Array<{ id: UserRole; title: string; desc: string; icon: any }> = [
    { id: 'citizen', title: 'Resident / Citizen', desc: 'Household safety & municipal storm guidance', icon: Shield },
    { id: 'commuter', title: 'Daily Commuter', desc: 'Arterial transit delays & flood route bypass', icon: Briefcase },
    { id: 'student', title: 'Student / Campus', desc: 'Campus shuttle timings & family alerts', icon: GraduationCap },
    { id: 'responder', title: 'Emergency Responder', desc: 'Pump pre-positioning & rescue grid coordination', icon: HeartPulse },
    { id: 'farmer', title: 'Agricultural / Rural', desc: 'Crop drainage & livestock protection protocols', icon: Truck },
  ];

  const factors: Array<{ id: VulnerabilityFactorId; label: string; desc: string; weight: string }> = [
    { id: 'low_lying_home', label: 'Ground-Floor or Low-Lying Home', desc: 'Prone to stormwater backflow and rapid ponding', weight: '+9 pts' },
    { id: 'medical_dependency', label: 'Life-Support / Cold-Chain Meds', desc: 'Requires continuous electricity & power backups', weight: '+8 pts' },
    { id: 'two_wheeler_commute', label: 'Two-Wheeler / Bike Commuter', desc: 'High hydroplaning & gale wind tip-over hazard', weight: '+7 pts' },
    { id: 'elderly', label: 'Senior Citizens or Infants in Home', desc: 'Limited evacuation mobility during waterlogging', weight: '+6 pts' },
    { id: 'outdoor_worker', label: 'Outdoor / Field Worker', desc: 'Direct exposure to lightning strikes & flash storms', weight: '+7 pts' },
    { id: 'family_members', label: 'Multi-Member Dependent Family', desc: 'Extended coordination required during evacuation', weight: '+4 pts' },
  ];

  const toggleFactor = (fId: VulnerabilityFactorId) => {
    playTactileClick(preferences.soundEnabled);
    const existing = preferences.factors;
    const next = existing.includes(fId)
      ? existing.filter((id) => id !== fId)
      : [...existing, fId];
    onUpdatePreferences({ factors: next });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personalModalHeading"
    >
      <div className="w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-4 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-500/30 border border-blue-400/40 flex items-center justify-center text-blue-200 shadow-inner">
              <UserCheck className="w-4 h-4" />
            </span>
            <div>
              <h2 id="personalModalHeading" className="font-display font-extrabold text-sm sm:text-base text-white">
                Personal Vulnerability Adjuster
              </h2>
              <p className="text-[10px] text-blue-200/80">
                Tailor actionable advisories to your role & circumstances
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Score Adjustment Card */}
        <div className="p-3 bg-slate-800/80 border-b border-white/10 flex items-center justify-between px-4">
          <div>
            <span className="text-[10px] text-white/60 block font-semibold">
              Base Grid Threat vs Personalized Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="font-mono text-sm text-slate-400 font-bold">
                Base: {baseScore}%
              </span>
              <span className="text-sm text-yellow-400">➔</span>
              <span className="font-mono text-lg font-black text-yellow-300">
                Personalized: {personalizedScore}%
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-200 bg-amber-500/20 border border-amber-400/40 px-2 py-1 rounded-full">
            +{personalizedScore - baseScore} vuln boost
          </span>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Role Selection */}
          <div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              1. Your Operational Safety Role
            </span>
            <div className="space-y-1.5">
              {roles.map((r) => {
                const IconComp = r.icon;
                const isSelected = preferences.role === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      playTactileClick(preferences.soundEnabled);
                      onUpdatePreferences({ role: r.id });
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-400 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold leading-tight">{r.title}</div>
                        <div className="text-[10px] text-white/60 font-normal">{r.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-cyan-300 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vulnerability Factors */}
          <div>
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block mb-1.5">
              2. Vulnerability Adjusters (Select All That Apply)
            </span>
            <div className="space-y-1.5">
              {factors.map((f) => {
                const isChecked = preferences.factors.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFactor(f.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                      isChecked
                        ? 'bg-yellow-500/20 border-yellow-400 text-white'
                        : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
                        <span>{f.label}</span>
                        <span className="text-[9px] font-mono text-yellow-300 bg-yellow-400/20 px-1 py-0.2 rounded">
                          {f.weight}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/60 mt-0.5">{f.desc}</div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-yellow-400 border-yellow-300 text-black' : 'border-white/30'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 font-black" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/15 bg-slate-800/90 flex justify-end">
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              onClose();
            }}
            className="py-2 px-5 rounded-xl bg-white hover:bg-slate-200 text-slate-950 font-black text-xs uppercase tracking-wider transition"
          >
            Apply Profile
          </button>
        </div>
      </div>
    </div>
  );
};
