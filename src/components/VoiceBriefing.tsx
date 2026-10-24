import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, Square, X } from 'lucide-react';
import { RiskAssessment, WeatherData } from '../types/weather';

interface VoiceBriefingProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  assessment: RiskAssessment;
}

export const VoiceBriefing: React.FC<VoiceBriefingProps> = ({
  isOpen,
  onClose,
  weather,
  assessment,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Formulate natural speech script
  const scriptText = `Weather Guard Autonomous Nowcast Report for ${weather.locationName}, grid ${weather.gridId}.
Current composite threat level is ${assessment.overallScore} percent, classified as ${assessment.overallLevel} risk.
Dominant meteorological hazard is ${assessment.dominantHazard}.
Precipitation rate is currently ${weather.rainfallMmHr} millimeters per hour. Wind velocity is ${weather.windSpeedKmh} kilometers per hour, with atmospheric pressure at ${weather.pressureHpa} hectopascals.
Critical instruction: ${assessment.advisories[0]?.actionText || 'Remain vigilant and monitor official emergency broadcasts.'}
Recommended protocol: ${assessment.advisories[0]?.recommendedAction || 'Seek secure shelter and stay off flooded transit routes.'}`;

  useEffect(() => {
    if (!isOpen) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      setIsPaused(false);
    } else {
      // Auto-start speaking when opened
      speakScript();
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

  const speakScript = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(scriptText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseResume = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
    } else if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    } else {
      speakScript();
    }
  };

  const handleStop = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voiceModalHeading"
    >
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-800 to-blue-900 p-4 flex items-center justify-between border-b border-white/15">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-cyan-500/30 border border-cyan-400/40 flex items-center justify-center text-cyan-200 shadow-inner">
              <Volume2 className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <h2 id="voiceModalHeading" className="font-display font-extrabold text-sm sm:text-base text-white">
                Autonomous Voice Audio Briefing
              </h2>
              <p className="text-[10px] text-cyan-200/80">
                Accessible synthesized hands-free spoken nowcast
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleStop();
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition"
            aria-label="Close voice briefing"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Waveform / Visualizer simulation */}
        <div className="p-4 flex flex-col items-center justify-center bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-1.5 h-12 my-2">
            {[8, 18, 32, 24, 40, 28, 44, 30, 20, 36, 12, 22, 14].map((h, i) => (
              <span
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlaying ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'
                }`}
                style={{
                  height: isPlaying ? `${Math.max(6, (h * (i % 2 === 0 ? 1 : 0.8)))}px` : '6px',
                }}
              />
            ))}
          </div>

          <span className="text-[11px] font-bold text-cyan-300">
            {isPlaying
              ? 'Broadcasting Real-time Spoken Briefing...'
              : isPaused
              ? 'Audio Paused'
              : 'Playback Finished'}
          </span>
        </div>

        {/* Spoken Text Transcript */}
        <div className="p-4 space-y-2 text-xs">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider block">
            Verbatim Spoken Transcript
          </span>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-200 text-[11px] leading-relaxed max-h-40 overflow-y-auto">
            {scriptText}
          </div>
        </div>

        {/* Playback Controls */}
        <div className="p-4 border-t border-white/10 bg-slate-800/80 flex items-center justify-center gap-3">
          <button
            onClick={handlePauseResume}
            className="py-2.5 px-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Replay'}</span>
          </button>
          <button
            onClick={handleStop}
            className="py-2.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Stop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
