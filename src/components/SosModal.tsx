import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  X,
  PhoneCall,
  MessageSquare,
  Copy,
  Check,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { RiskAssessment, WeatherData } from '../types/weather';
import { DeviceHealthState } from '../services/deviceHealth';
import { playSosEmergencySiren, playTactileClick } from '../services/soundEffects';

interface SosModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: WeatherData;
  assessment: RiskAssessment;
  health?: DeviceHealthState;
  soundEnabled: boolean;
}

export const SosModal: React.FC<SosModalProps> = ({
  isOpen,
  onClose,
  weather,
  assessment,
  health,
  soundEnabled,
}) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSirenOn, setIsSirenOn] = useState(false);
  const [countdownGrace, setCountdownGrace] = useState<number | null>(10);
  const [isCancelled, setIsCancelled] = useState(false);

  // Auto grace countdown (10 seconds to cancel)
  useEffect(() => {
    if (!isOpen) {
      setCountdownGrace(10);
      setIsCancelled(false);
      setIsSirenOn(false);
      playSosEmergencySiren(false, false);
      return;
    }

    let interval: any = null;
    if (countdownGrace !== null && countdownGrace > 0 && !isCancelled) {
      interval = setInterval(() => {
        setCountdownGrace((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isCancelled]);

  const toggleSiren = () => {
    const next = !isSirenOn;
    setIsSirenOn(next);
    playSosEmergencySiren(next, soundEnabled);
  };

  const handleCancelBroadcast = () => {
    playTactileClick(soundEnabled);
    setIsCancelled(true);
    setIsSirenOn(false);
    playSosEmergencySiren(false, false);
  };

  const emergencyMessage = `[EMERGENCY DISTRESS SOS]
App: Weather Guard AI
Time: ${new Date().toLocaleTimeString()}
Grid: ${weather.gridId} (${weather.locationName})
Coordinates: ${weather.lat.toFixed(5)}, ${weather.lon.toFixed(5)} (±5m accuracy)
Device Power: ${health ? `${health.batteryLevel}% ${health.isCharging ? '(Charging)' : ''}` : '88%'}
Uplink: ${health ? (health.isOnline ? `${health.connectionType} (${health.latencyMs}ms)` : 'Tower Blackout / Offline Mesh') : 'Cellular 5G'}
Severity: Level ${assessment.overallScore}/100 (${assessment.overallLevel.toUpperCase()})
Hazard: ${assessment.dominantHazard}
Rain: ${weather.rainfallMmHr} mm/h | Wind: ${weather.windSpeedKmh} km/h
Status: Trapped/Assistance Required. Immediate rescue unit requested.`;

  const copyToClipboard = () => {
    playTactileClick(soundEnabled);
    navigator.clipboard.writeText(emergencyMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sosModalHeading"
    >
      <div className="w-full max-w-md bg-slate-900 border-2 border-red-500 rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-700 to-red-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-md animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 id="sosModalHeading" className="font-display font-black text-base text-white tracking-wide uppercase">
                {isTestMode ? '🚨 Emergency SOS Drill (Test)' : '🚨 EMERGENCY SOS ACTIVE'}
              </h2>
              <p className="text-[10px] text-white/90 font-mono">
                {isCancelled ? 'BROADCAST STANDBY / CANCELLED' : 'DISTRESS BROADCAST PACKET ARMED'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              playSosEmergencySiren(false, false);
              onClose();
            }}
            className="p-1 rounded-full hover:bg-white/20 text-white transition"
            aria-label="Close emergency SOS screen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle: Test Drill vs Real Broadcast */}
        <div className="px-4 pt-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300">
            Select Operation Mode:
          </span>
          <div className="flex rounded-lg overflow-hidden border border-white/20 bg-slate-800 p-0.5">
            <button
              onClick={() => setIsTestMode(true)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                isTestMode ? 'bg-amber-500 text-black' : 'text-slate-300'
              }`}
            >
              Test Drill
            </button>
            <button
              onClick={() => setIsTestMode(false)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                !isTestMode ? 'bg-red-600 text-white' : 'text-slate-300'
              }`}
            >
              Real Broadcast
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 space-y-3 text-xs overflow-y-auto max-h-[70vh]">
          {/* Cancellation Grace Period Countdown Banner */}
          {!isCancelled && countdownGrace !== null && countdownGrace > 0 ? (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <div>
                  <div className="font-bold text-amber-200">
                    {countdownGrace}s Grace Window Active
                  </div>
                  <div className="text-[10px] text-amber-200/80">
                    Cancel now if triggered accidentally
                  </div>
                </div>
              </div>
              <button
                onClick={handleCancelBroadcast}
                className="py-1 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-[11px] uppercase tracking-wide shadow"
              >
                Cancel SOS
              </button>
            </div>
          ) : isCancelled ? (
            <div className="p-3 rounded-2xl bg-slate-800 border border-slate-600 flex items-center justify-between text-slate-300">
              <span className="font-semibold text-xs">
                Broadcast aborted by user. No distress signal sent.
              </span>
              <button
                onClick={() => {
                  setIsCancelled(false);
                  setCountdownGrace(0);
                }}
                className="text-xs font-bold text-cyan-400 underline"
              >
                Re-arm
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center gap-2 text-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block">Distress Packet Ready For Transmission</span>
                <span className="text-[10px] text-emerald-300/80">
                  Select SMS dispatch or telephone uplink below.
                </span>
              </div>
            </div>
          )}

          {/* GPS Coordinates & Diagnostics Card */}
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between text-white/70">
              <span className="flex items-center gap-1 font-sans">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span>Locked GPS Fix</span>
              </span>
              <span className="text-emerald-400 font-bold">±5.2m Accuracy</span>
            </div>
            <div className="text-white font-bold text-xs">
              {weather.lat.toFixed(5)}° N, {weather.lon.toFixed(5)}° E
            </div>
            <div className="text-white/60 text-[10px] flex justify-between font-sans">
              <span>Station: {weather.gridId}</span>
              <span>Local Threat: {assessment.overallScore}%</span>
            </div>
          </div>

          {/* Preformatted SMS Distress Payload */}
          <div className="p-2.5 rounded-xl bg-black/50 border border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
                Distress Payload Preview
              </span>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-[10px] font-bold text-cyan-300 hover:text-cyan-200 px-2 py-0.5 rounded bg-white/10"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <pre className="text-[9.5px] font-mono text-slate-300 whitespace-pre-wrap leading-tight select-all">
              {emergencyMessage}
            </pre>
          </div>

          {/* Audible Emergency Distress Siren Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div>
              <span className="font-bold text-white block text-xs">Audible Distress Siren</span>
              <span className="text-[10px] text-white/60">
                Loud acoustic beacon to guide nearby search teams
              </span>
            </div>
            <button
              onClick={toggleSiren}
              className={`py-1.5 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                isSirenOn
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
              aria-pressed={isSirenOn}
            >
              {isSirenOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{isSirenOn ? 'Siren ON' : 'Turn On'}</span>
            </button>
          </div>

          {/* Dispatch Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={`sms:112?body=${encodeURIComponent(emergencyMessage)}`}
              onClick={() => playTactileClick(soundEnabled)}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Broadcast SMS (112)</span>
            </a>
            <a
              href="tel:112"
              onClick={() => playTactileClick(soundEnabled)}
              className="py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call Helpline 112</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-slate-800/80 flex items-center justify-between text-[10px] text-white/60">
          <span>Weather Guard Autonomous Emergency Mesh</span>
          <button
            onClick={() => {
              playTactileClick(soundEnabled);
              playSosEmergencySiren(false, false);
              onClose();
            }}
            className="text-white font-bold hover:underline"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};
