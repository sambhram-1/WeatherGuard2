import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  Volume2,
  ChevronRight,
  Info,
  UserCheck,
} from 'lucide-react';
import { RiskAssessment, UserPreferences } from '../types/weather';
import { playTactileClick } from '../services/soundEffects';

interface ThreatBannerProps {
  assessment: RiskAssessment;
  preferences: UserPreferences;
  onOpenGuidance: () => void;
  onOpenVoiceBriefing: () => void;
  onOpenPersonalization: () => void;
}

export const ThreatBanner: React.FC<ThreatBannerProps> = ({
  assessment,
  preferences,
  onOpenGuidance,
  onOpenVoiceBriefing,
  onOpenPersonalization,
}) => {
  const isSevere = assessment.overallLevel === 'severe';
  const isHigh = assessment.overallLevel === 'high';
  const isModerate = assessment.overallLevel === 'moderate';
  const isNominal = assessment.overallLevel === 'low';

  const badgeConfig = {
    severe: {
      bg: 'bg-red-600',
      text: 'text-red-100',
      border: 'border-red-400',
      label: 'CRITICAL ALERT',
      gradient: 'from-red-600 via-rose-700 to-amber-700',
      icon: AlertTriangle,
    },
    high: {
      bg: 'bg-orange-600',
      text: 'text-orange-100',
      border: 'border-orange-400',
      label: 'HIGH THREAT',
      gradient: 'from-orange-600 via-red-600 to-rose-700',
      icon: AlertTriangle,
    },
    moderate: {
      bg: 'bg-amber-600',
      text: 'text-amber-100',
      border: 'border-amber-400',
      label: 'WEATHER WATCH',
      gradient: 'from-amber-600 to-orange-600',
      icon: Info,
    },
    low: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-100',
      border: 'border-emerald-400',
      label: 'NOMINAL CONDITIONS',
      gradient: 'from-emerald-700 via-teal-700 to-cyan-700',
      icon: ShieldCheck,
    },
  }[assessment.overallLevel];

  const IconComp = badgeConfig.icon;

  // Primary Action text based on threat
  const mandateText = isSevere || isHigh
    ? 'Move above ground floor in low-lying zones; avoid waterlogged underpasses.'
    : isModerate
    ? 'Monitor incoming convective rain bands; prepare indoor transit alternates.'
    : 'All regional travel corridors open with standard precautions.';

  return (
    <section
      role="region"
      aria-label="Meteorological Threat and Actionable Guidance"
      className="w-full px-3 my-1.5 z-30"
    >
      <div
        className={`relative w-full rounded-2xl p-3 sm:p-3.5 border shadow-xl transition-all duration-200 bg-gradient-to-r ${badgeConfig.gradient} ${badgeConfig.border} ${
          preferences.highContrast ? 'border-2 border-white' : ''
        }`}
      >
        {/* Top Status Header */}
        <div className="flex items-center justify-between mb-1.5 gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`p-1 rounded-lg bg-black/30 border border-white/20 text-white shrink-0 ${
                isSevere && !preferences.reducedMotion ? 'animate-pulse' : ''
              }`}
            >
              <IconComp className="w-4 h-4 text-white" />
            </span>
            <span className="font-display font-black text-[11px] sm:text-xs tracking-wider uppercase text-white truncate drop-shadow">
              {badgeConfig.label}
            </span>
          </div>

          {/* Composite Hazard Score Chip */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="px-2 py-0.5 rounded-full bg-black/40 border border-white/30 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
              <span>Risk:</span>
              <span className="font-mono text-xs font-black text-amber-200">
                {assessment.overallScore}/100
              </span>
            </div>

            {/* Personalized Delta indicator */}
            {assessment.personalizedScore > assessment.overallScore && (
              <button
                onClick={() => {
                  playTactileClick(preferences.soundEnabled);
                  onOpenPersonalization();
                }}
                className="px-2 py-0.5 rounded-full bg-yellow-400 text-black font-extrabold text-[9.5px] hover:bg-yellow-300 transition flex items-center gap-0.5 shadow-sm"
                title={`Personalized risk is ${assessment.personalizedScore} based on your role & vulnerabilities`}
                aria-label={`Personalized score is ${assessment.personalizedScore}. Tap to edit.`}
              >
                <UserCheck className="w-3 h-3" />
                <span>You: {assessment.personalizedScore}%</span>
              </button>
            )}
          </div>
        </div>

        {/* Hazard Headline & Actionable Mandate */}
        <div className="mb-2.5">
          <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight drop-shadow-md">
            {assessment.dominantHazard}: {mandateText}
          </h2>
          <p className="text-[11px] text-white/90 mt-0.5 font-medium leading-snug">
            {assessment.advisories[0]?.actionText ||
              'Follow municipal emergency broadcasts and keep devices charged.'}
          </p>
        </div>

        {/* Action Controls Hierarchy (High Visibility Buttons) */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/20">
          {/* Primary Action Button: Open Safety Guidance */}
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              onOpenGuidance();
            }}
            className="flex-1 py-1.5 px-3 rounded-xl bg-white text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-100 active:scale-[0.98] transition shadow-md"
            aria-label="View Actionable Safety Guidance, evacuation corridors, and emergency shelters"
          >
            <span>Action Guidance & Shelters</span>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 text-slate-900" />
          </button>

          {/* Voice Briefing Button */}
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              onOpenVoiceBriefing();
            }}
            className="p-1.5 px-2.5 rounded-xl bg-black/35 hover:bg-black/50 border border-white/30 text-white font-semibold text-xs flex items-center gap-1 transition active:scale-95 shrink-0"
            title="Listen to synthesized voice audio safety briefing"
            aria-label="Listen to voice weather briefing"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-200" />
            <span className="hidden sm:inline text-[11px]">Listen</span>
          </button>
        </div>
      </div>
    </section>
  );
};
