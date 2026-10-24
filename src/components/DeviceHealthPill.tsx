import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  BatteryWarning,
  Activity,
  Zap,
  ShieldAlert,
  X,
  Radio,
  Sliders,
  Check,
} from 'lucide-react';
import { DeviceHealthState } from '../services/deviceHealth';
import { playTactileClick } from '../services/soundEffects';

interface DeviceHealthPillProps {
  health: DeviceHealthState;
  soundEnabled: boolean;
  onTogglePowerSaving: () => void;
  onToggleOfflineSimulation: () => void;
  onSimulateBattery: (level: number) => void;
}

export const DeviceHealthPill: React.FC<DeviceHealthPillProps> = ({
  health,
  soundEnabled,
  onTogglePowerSaving,
  onToggleOfflineSimulation,
  onSimulateBattery,
}) => {
  const [showDetail, setShowDetail] = useState(false);

  // Battery icon selection
  const BatteryIconComp = health.isCharging
    ? BatteryCharging
    : health.isCriticalBattery || health.isLowBattery
    ? BatteryWarning
    : Battery;

  const batteryColor = health.isCharging
    ? 'text-emerald-400'
    : health.isCriticalBattery
    ? 'text-red-400'
    : health.isLowBattery
    ? 'text-amber-400'
    : 'text-white/90';

  const connectionColor = !health.isOnline
    ? 'text-red-400'
    : health.connectionType === '3G'
    ? 'text-amber-400'
    : 'text-cyan-400';

  return (
    <div className="relative">
      {/* Discreet Compact Header Pill */}
      <button
        onClick={() => {
          playTactileClick(soundEnabled);
          setShowDetail(!showDetail);
        }}
        className={`glass-pill-dark px-2 py-0.5 rounded-full flex items-center space-x-1.5 cursor-pointer active:scale-95 transition-all text-[11px] font-mono border hover:border-white/40 ${
          health.isCriticalBattery || !health.isOnline
            ? 'border-red-400/80 bg-red-950/40 text-red-200'
            : health.isLowBattery
            ? 'border-amber-400/60 bg-amber-950/30 text-amber-200'
            : 'border-white/15 text-white/90'
        }`}
        title="Discreet Device & Connectivity Health. Click for emergency power & network diagnostics."
        aria-expanded={showDetail}
        aria-label={`Device status: ${health.isOnline ? health.connectionType : 'Offline'}, battery ${health.batteryLevel} percent ${health.isCharging ? 'charging' : ''}. Click for emergency system transparency.`}
      >
        {/* Connectivity Indicator */}
        <div className="flex items-center space-x-1">
          {health.isOnline ? (
            <Radio className={`w-3 h-3 ${connectionColor} shrink-0 animate-pulse`} />
          ) : (
            <WifiOff className="w-3 h-3 text-red-400 shrink-0" />
          )}
          <span className="text-[10px] font-bold tracking-tight">
            {health.isOnline ? health.connectionType : 'OFFLINE'}
          </span>
        </div>

        <span className="text-white/30">•</span>

        {/* Battery Indicator */}
        <div className="flex items-center space-x-1">
          <BatteryIconComp className={`w-3.5 h-3.5 ${batteryColor} shrink-0`} />
          <span className="text-[10px] font-bold">
            {health.batteryLevel}%
          </span>
          {health.isCharging && (
            <Zap className="w-2.5 h-2.5 text-yellow-300 fill-current -ml-0.5" />
          )}
        </div>

        {/* Pulse warning pip if battery is critical or device offline */}
        {(health.isCriticalBattery || !health.isOnline) && (
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping -ml-0.5" />
        )}
      </button>

      {/* Interactive Emergency Transparency Popover */}
      {showDetail && (
        <div
          className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-8 w-auto sm:w-72 bg-slate-900/98 border border-white/25 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Emergency Device & Connectivity Diagnostics"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/15 mb-2.5">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-xs font-display text-white">
                Emergency System Diagnostics
              </span>
            </div>
            <button
              onClick={() => setShowDetail(false)}
              className="text-white/60 hover:text-white p-0.5 text-xs"
              aria-label="Close diagnostics"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2.5">
            {/* Network Health Card */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] font-bold text-white/70 uppercase">
                  Uplink & Cellular Health
                </span>
                <span
                  className={`text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    health.isOnline
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : 'bg-red-500/20 text-red-300 border border-red-400/30'
                  }`}
                >
                  {health.isOnline ? 'Online' : 'Tower Blackout'}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-xs font-bold text-white mt-1">
                <span>Network Protocol:</span>
                <span className="font-mono text-cyan-300">{health.connectionType}</span>
              </div>
              <div className="flex justify-between items-baseline text-[10px] text-white/60 mt-0.5">
                <span>Round-Trip Latency:</span>
                <span className="font-mono">{health.isOnline ? `${health.latencyMs} ms` : 'N/A'}</span>
              </div>

              {/* Simulation button for offline drills */}
              <button
                onClick={() => {
                  playTactileClick(soundEnabled);
                  onToggleOfflineSimulation();
                }}
                className="w-full mt-2 py-1 px-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] font-semibold text-white/80 hover:text-white transition flex items-center justify-center gap-1"
              >
                <Radio className="w-3 h-3 text-amber-300" />
                <span>
                  {health.isOnline ? 'Simulate Cellular Grid Failure' : 'Restore Cellular Link'}
                </span>
              </button>
            </div>

            {/* Battery Health & Power Reserve Card */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10.5px] font-bold text-white/70 uppercase">
                  Battery & Energy Reserve
                </span>
                <span
                  className={`text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                    health.isCharging
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : health.isCriticalBattery
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {health.isCharging ? 'Charging' : `${health.batteryLevel}%`}
                </span>
              </div>

              {/* Visual Battery Bar */}
              <div className="w-full bg-slate-700/60 h-2 rounded-full overflow-hidden my-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    health.isCriticalBattery
                      ? 'bg-red-500'
                      : health.isLowBattery
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${health.batteryLevel}%` }}
                />
              </div>

              <div className="flex justify-between items-baseline text-[10.5px] text-white/80 mt-1">
                <span>Est. Emergency Runtime:</span>
                <span className="font-mono font-bold text-emerald-300">
                  ~{Math.floor(health.estimatedRuntimeMinutes / 60)}h{' '}
                  {health.estimatedRuntimeMinutes % 60}m
                </span>
              </div>

              {/* Power Saving Toggle */}
              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/10">
                <div>
                  <div className="font-semibold text-white text-[10.5px]">Emergency Power Saver</div>
                  <div className="text-[9px] text-white/50">Freezes non-vital telemetry polling</div>
                </div>
                <button
                  onClick={() => {
                    playTactileClick(soundEnabled);
                    onTogglePowerSaving();
                  }}
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] transition ${
                    health.emergencyModeActive
                      ? 'bg-emerald-400 text-black'
                      : 'bg-white/20 text-white/80'
                  }`}
                  aria-pressed={health.emergencyModeActive}
                >
                  {health.emergencyModeActive ? 'ACTIVE' : 'OFF'}
                </button>
              </div>

              {/* Quick simulation buttons for testing */}
              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[9.5px] text-white/50">Test Levels:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => onSimulateBattery(12)}
                    className="px-1.5 py-0.5 rounded bg-red-950/80 border border-red-500/40 text-[9px] text-red-200"
                    title="Simulate 12% critical battery"
                  >
                    12%
                  </button>
                  <button
                    onClick={() => onSimulateBattery(24)}
                    className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] text-amber-200"
                    title="Simulate 24% low battery"
                  >
                    24%
                  </button>
                  <button
                    onClick={() => onSimulateBattery(88)}
                    className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] text-emerald-200"
                    title="Reset to 88%"
                  >
                    88%
                  </button>
                </div>
              </div>
            </div>

            {/* Offline Resilience Guarantee */}
            <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-2">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-300 shrink-0 mt-0.5" />
              <p className="text-[9.5px] text-cyan-200 leading-snug">
                <strong>Offline Transparency:</strong> SOS GPS broadcasts, emergency shelters, and survival checklists remain 100% active locally without network connection.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
