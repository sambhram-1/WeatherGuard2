export interface DeviceHealthState {
  isOnline: boolean;
  connectionType: '5G' | '4G' | 'WiFi' | '3G' | 'Offline';
  latencyMs: number;
  batteryLevel: number; // 0 - 100
  isCharging: boolean;
  isLowBattery: boolean;
  isCriticalBattery: boolean;
  estimatedRuntimeMinutes: number;
  emergencyModeActive: boolean;
}

export function evaluateBatteryStatus(level: number, isCharging: boolean): {
  isLowBattery: boolean;
  isCriticalBattery: boolean;
  estimatedRuntimeMinutes: number;
} {
  const clamped = Math.max(0, Math.min(100, Math.round(level)));
  const isCritical = clamped <= 15 && !isCharging;
  const isLow = clamped <= 25 && !isCharging;

  // Estimate remaining emergency runtime based on ~4.5 minutes per 1% battery under active GPS/telemetry
  const runtimePerPercent = 4.5;
  const estimatedRuntimeMinutes = Math.round(clamped * runtimePerPercent);

  return {
    isLowBattery: isLow,
    isCriticalBattery: isCritical,
    estimatedRuntimeMinutes,
  };
}

export function formatConnectionLabel(
  isOnline: boolean,
  effectiveType?: string
): '5G' | '4G' | 'WiFi' | '3G' | 'Offline' {
  if (!isOnline) return 'Offline';
  if (!effectiveType) return '4G';
  if (effectiveType === '4g') return '5G';
  if (effectiveType === '3g') return '3G';
  return '4G';
}
