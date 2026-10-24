import { useState, useEffect, useCallback } from 'react';
import {
  DeviceHealthState,
  evaluateBatteryStatus,
  formatConnectionLabel,
} from '../services/deviceHealth';

export function useDeviceHealth() {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [connectionType, setConnectionType] = useState<'5G' | '4G' | 'WiFi' | '3G' | 'Offline'>('5G');
  const [latencyMs, setLatencyMs] = useState<number>(38);
  const [emergencyModeActive, setEmergencyModeActive] = useState<boolean>(false);

  // Connectivity Listener
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      const conn = (navigator as any).connection;
      setConnectionType(formatConnectionLabel(true, conn?.effectiveType));
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionType('Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any).connection;
    if (conn) {
      setConnectionType(formatConnectionLabel(navigator.onLine, conn.effectiveType));
      if (conn.rtt) setLatencyMs(conn.rtt);
      const handleConnChange = () => {
        setConnectionType(formatConnectionLabel(navigator.onLine, conn.effectiveType));
        if (conn.rtt) setLatencyMs(conn.rtt);
      };
      conn.addEventListener?.('change', handleConnChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Battery Status Listener
  useEffect(() => {
    if (typeof navigator === 'undefined' || !(navigator as any).getBattery) return;

    let batteryInstance: any = null;

    (navigator as any)
      .getBattery()
      .then((battery: any) => {
        batteryInstance = battery;
        setBatteryLevel(Math.round(battery.level * 100));
        setIsCharging(battery.charging);

        const onLevelChange = () => setBatteryLevel(Math.round(battery.level * 100));
        const onChargingChange = () => setIsCharging(battery.charging);

        battery.addEventListener('levelchange', onLevelChange);
        battery.addEventListener('chargingchange', onChargingChange);
      })
      .catch(() => {
        // Fallback default retained
      });

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener?.('levelchange', () => {});
        batteryInstance.removeEventListener?.('chargingchange', () => {});
      }
    };
  }, []);

  const toggleEmergencyPowerSaving = useCallback(() => {
    setEmergencyModeActive((prev) => !prev);
  }, []);

  const simulateOfflineToggle = useCallback(() => {
    setIsOnline((prev) => {
      const next = !prev;
      setConnectionType(next ? '5G' : 'Offline');
      return next;
    });
  }, []);

  const simulateBatteryLevel = useCallback((level: number) => {
    setBatteryLevel(Math.max(5, Math.min(100, Math.round(level))));
  }, []);

  const batteryMetrics = evaluateBatteryStatus(batteryLevel, isCharging);

  const healthState: DeviceHealthState = {
    isOnline,
    connectionType,
    latencyMs,
    batteryLevel,
    isCharging,
    isLowBattery: batteryMetrics.isLowBattery,
    isCriticalBattery: batteryMetrics.isCriticalBattery,
    estimatedRuntimeMinutes: batteryMetrics.estimatedRuntimeMinutes,
    emergencyModeActive,
  };

  return {
    health: healthState,
    toggleEmergencyPowerSaving,
    simulateOfflineToggle,
    simulateBatteryLevel,
  };
}
