import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Compass,
  ShieldAlert,
  Sliders,
  CheckCircle,
  Activity,
  AlertOctagon,
} from 'lucide-react';

import {
  MicroGridSector,
  RiskAssessment,
  UserPreferences,
  WeatherData,
} from './types/weather';
import { calculateMultiHazardRisk } from './services/riskEngine';
import {
  fetchLiveWeather,
  generateMicroGridSectors,
  getSimulatedWeather,
} from './services/weatherService';
import { playRadarSonar, playTactileClick } from './services/soundEffects';

import { TrustworthyHeader } from './components/TrustworthyHeader';
import { ThreatBanner } from './components/ThreatBanner';
import { SphereArtifact } from './components/SphereArtifact';
import { TelemetryGrid } from './components/TelemetryGrid';
import { MicroGridScanner } from './components/MicroGridScanner';
import { TrendForecast } from './components/TrendForecast';
import { SafetyGuidanceModal } from './components/SafetyGuidanceModal';
import { PersonalizationModal } from './components/PersonalizationModal';
import { StormSimulatorLab } from './components/StormSimulatorLab';
import { SosButton } from './components/SosButton';
import { SosModal } from './components/SosModal';
import { VoiceBriefing } from './components/VoiceBriefing';
import { GlobeInspectorModal } from './components/GlobeInspectorModal';
import { useDeviceHealth } from './hooks/useDeviceHealth';

export default function App() {
  const {
    health,
    toggleEmergencyPowerSaving,
    simulateOfflineToggle,
    simulateBatteryLevel,
  } = useDeviceHealth();

  // User Preferences & Accessibility state
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    return {
      role: 'citizen',
      factors: ['low_lying_home'],
      tempUnit: 'C',
      speedUnit: 'kmh',
      highContrast: false,
      reducedMotion: false,
      soundEnabled: true,
      fontSize: 'standard',
    };
  });

  // Meteorological & Risk Assessment State
  const [weather, setWeather] = useState<WeatherData>(() =>
    getSimulatedWeather('thunderstorm', 12.9716, 77.5946, 'Bengaluru')
  );
  const [assessment, setAssessment] = useState<RiskAssessment>(() =>
    calculateMultiHazardRisk(weather, preferences.role, preferences.factors)
  );
  const [microGrids, setMicroGrids] = useState<MicroGridSector[]>(() =>
    generateMicroGridSectors(weather)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'grids' | 'guidance' | 'sim'>('dashboard');

  // Modals
  const [isGuidanceOpen, setIsGuidanceOpen] = useState(false);
  const [isPersonalizationOpen, setIsPersonalizationOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isGlobeInspectorOpen, setIsGlobeInspectorOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 2400);
  }, []);

  // Update assessment whenever weather, role, or factors change
  useEffect(() => {
    const nextRisk = calculateMultiHazardRisk(weather, preferences.role, preferences.factors);
    setAssessment(nextRisk);
    setMicroGrids(generateMicroGridSectors(weather));
  }, [weather, preferences.role, preferences.factors]);

  // Load real weather on initial mount
  useEffect(() => {
    loadLiveWeather(weather.lat, weather.lon, weather.locationName);
  }, []);

  const loadLiveWeather = async (lat: number, lon: number, name: string) => {
    setIsLoading(true);
    try {
      const liveData = await fetchLiveWeather(lat, lon, name);
      setWeather(liveData);
      showToast(`🟢 Telemetry active for ${name}`);
    } catch {
      showToast('⚠️ Using backup simulated node');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCity = (name: string, lat: number, lon: number) => {
    loadLiveWeather(lat, lon, name);
  };

  const handleUseGps = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      showToast('🛰️ Querying satellite GPS fix...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          loadLiveWeather(pos.coords.latitude, pos.coords.longitude, 'My GPS Station');
        },
        () => {
          showToast('GPS permission denied; using Bengaluru node');
          loadLiveWeather(12.9716, 77.5946, 'Bengaluru');
        },
        { timeout: 8000 }
      );
    } else {
      showToast('Geolocation unavailable in browser');
    }
  };

  const handleRadarPing = () => {
    showToast(
      assessment.overallLevel === 'severe' || assessment.overallLevel === 'high'
        ? `⚡ Doppler Echo: Convective Cell detected. Threat: ${assessment.overallScore}%`
        : `☀️ Optical Scan: Solar Flux nominal. Risk: ${assessment.overallScore}%`
    );
  };

  const handleUpdatePreferences = (updated: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...updated }));
  };

  // Font Scaling Class
  const fontSizeClass =
    preferences.fontSize === 'large'
      ? 'text-scale-large'
      : preferences.fontSize === 'xlarge'
      ? 'text-scale-xlarge'
      : '';

  const isStormMode = assessment.overallLevel === 'severe' || assessment.overallLevel === 'high';

  return (
    <div
      className={`min-h-screen w-full flex justify-center items-center p-0 sm:p-4 transition-colors ${
        preferences.highContrast ? 'high-contrast-mode bg-black' : 'bg-[#050209]'
      } ${preferences.reducedMotion ? 'reduced-motion-mode' : ''} ${fontSizeClass}`}
    >
      {/* Dynamic Toast Feedback Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 z-50 glass-pill-dark px-4 py-2 rounded-2xl text-xs font-bold text-white border border-white/30 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200"
        >
          {toastMessage}
        </div>
      )}

      {/* Main Container (Mobile-first frame that comfortably scales up to desktop) */}
      <main
        className="relative w-full max-w-[430px] sm:rounded-[44px] sm:border-[6px] sm:border-white/10 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col justify-start overflow-hidden bg-[#0b0612] min-h-[100dvh] sm:min-h-[900px] sm:max-h-[920px]"
        id="main-applet-frame"
      >
        {/* Seamless Glow Blobs Background Layer (zero harsh cuts) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-[80px] opacity-75 transition-all duration-700"
            style={{
              background: isStormMode
                ? 'radial-gradient(circle, rgba(239, 68, 68, 0.75) 0%, rgba(220, 38, 38, 0.35) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(16, 185, 129, 0.75) 0%, rgba(5, 150, 105, 0.35) 60%, transparent 80%)',
            }}
          />
          <div
            className="absolute top-44 -right-16 w-64 h-64 rounded-full blur-[70px] opacity-65 transition-all duration-700"
            style={{
              background: isStormMode
                ? 'radial-gradient(circle, rgba(249, 115, 22, 0.6) 0%, transparent 75%)'
                : 'radial-gradient(circle, rgba(56, 189, 248, 0.6) 0%, transparent 75%)',
            }}
          />
          <div
            className="absolute top-52 -left-16 w-64 h-64 rounded-full blur-[70px] opacity-55 transition-all duration-700"
            style={{
              background: isStormMode
                ? 'radial-gradient(circle, rgba(37, 99, 235, 0.5) 0%, transparent 75%)'
                : 'radial-gradient(circle, rgba(20, 184, 166, 0.5) 0%, transparent 75%)',
            }}
          />
        </div>

        {/* Scrollable Main Viewport */}
        <div className="relative z-10 flex-1 flex flex-col overflow-y-auto pb-24 scroll-smooth">
          {/* 1. Trustworthy Header with Live/Simulation status and location search */}
          <TrustworthyHeader
            weather={weather}
            preferences={preferences}
            health={health}
            onTogglePowerSaving={toggleEmergencyPowerSaving}
            onToggleOfflineSimulation={simulateOfflineToggle}
            onSimulateBattery={simulateBatteryLevel}
            onUpdatePreferences={handleUpdatePreferences}
            onSelectCity={handleSelectCity}
            onRefreshLive={() => loadLiveWeather(weather.lat, weather.lon, weather.locationName)}
            onUseGps={handleUseGps}
            onOpenSimulator={() => setIsSimulatorOpen(true)}
            isLoading={isLoading}
          />

          {/* 2. Redesigned Information Hierarchy: Trustworthy Threat & Guidance FRONT AND CENTER */}
          <ThreatBanner
            assessment={assessment}
            preferences={preferences}
            onOpenGuidance={() => setIsGuidanceOpen(true)}
            onOpenVoiceBriefing={() => setIsVoiceOpen(true)}
            onOpenPersonalization={() => setIsPersonalizationOpen(true)}
          />

          {/* 3. Signature 3D Liquid Acrylic Volumetric Sphere (Secondary Centerpiece) */}
          <SphereArtifact
            weather={weather}
            assessment={assessment}
            preferences={preferences}
            onRadarPing={handleRadarPing}
            onOpenGlobeInspector={() => setIsGlobeInspectorOpen(true)}
          />

          {/* 4. Organic S-Curve SVG Edge */}
          <div className="w-full -mb-[1px] mt-2 pointer-events-none select-none">
            <svg
              className="w-full h-12 block drop-shadow-[0_-4px_12px_rgba(0,0,0,0.3)]"
              preserveAspectRatio="none"
              viewBox="0 0 390 56"
            >
              <path
                d="M 0,14 C 110,14 130,46 195,46 C 260,46 280,14 390,14 L 390,56 L 0,56 Z"
                fill="#EEF0FA"
              />
              <path
                d="M 0,14 C 110,14 130,46 195,46 C 260,46 280,14 390,14"
                fill="none"
                stroke="rgba(255,255,255,0.9)"
                strokeWidth="1.8"
              />
            </svg>
          </div>

          {/* 5. Light Lavender-Slate Sheet with Bento Matrix, 3x3 Micro-Grids, & Nowcast */}
          <div className="light-sheet-body bg-[#EEF0FA] flex-1 pb-6 pt-1">
            {activeTab === 'dashboard' && (
              <>
                <TelemetryGrid
                  weather={weather}
                  assessment={assessment}
                  preferences={preferences}
                  onCardClick={(title, desc) => showToast(`${title}: ${desc}`)}
                />
                <TrendForecast weather={weather} preferences={preferences} />
                <MicroGridScanner
                  sectors={microGrids}
                  preferences={preferences}
                  onSelectSector={(s) =>
                    showToast(`${s.sectorName}: Risk ${s.riskScore}%, Rain ${s.rainfallMmHr} mm/h`)
                  }
                />
              </>
            )}

            {activeTab === 'grids' && (
              <div className="py-2">
                <MicroGridScanner
                  sectors={microGrids}
                  preferences={preferences}
                  onSelectSector={(s) =>
                    showToast(`${s.sectorName}: Rain ${s.rainfallMmHr} mm/h, Wind ${s.windSpeedKmh} km/h`)
                  }
                />
                <TrendForecast weather={weather} preferences={preferences} />
              </div>
            )}
          </div>
        </div>

        {/* 6. Integrated Bottom Navigation Dock & Elevated SOS Button */}
        <nav
          className="absolute inset-x-3 bottom-3 z-40 light-floating-dock p-1.5 flex items-center justify-between gap-2.5 bg-white/85 backdrop-blur-xl border border-white/90 shadow-2xl rounded-full"
          role="navigation"
          aria-label="Applet primary navigation"
        >
          {/* Navigation Tab Buttons */}
          <div className="flex-1 flex items-center justify-around">
            {/* Dashboard */}
            <button
              onClick={() => {
                playTactileClick(preferences.soundEnabled);
                setActiveTab('dashboard');
              }}
              className={`flex-1 py-1.5 rounded-full flex flex-col items-center justify-center transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-slate-950 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
              aria-label="View Telemetry Dashboard"
              aria-pressed={activeTab === 'dashboard'}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="text-[10px] mt-0.5">Dashboard</span>
            </button>

            {/* 3x3 Micro-Grids */}
            <button
              onClick={() => {
                playTactileClick(preferences.soundEnabled);
                setActiveTab('grids');
              }}
              className={`flex-1 py-1.5 rounded-full flex flex-col items-center justify-center transition-all ${
                activeTab === 'grids'
                  ? 'bg-slate-950 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
              aria-label="View 3x3 Micro-Grid Spatial Scanner"
              aria-pressed={activeTab === 'grids'}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="text-[10px] mt-0.5">Micro-Grids</span>
            </button>

            {/* Action Guidance & Shelters Modal */}
            <button
              onClick={() => {
                playTactileClick(preferences.soundEnabled);
                setIsGuidanceOpen(true);
              }}
              className="flex-1 py-1.5 rounded-full flex flex-col items-center justify-center text-slate-600 hover:text-slate-900 font-semibold transition-all relative"
              aria-label="Open Actionable Safety Guidance & Evacuation Shelters"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
              <span className="text-[10px] mt-0.5">Guidance</span>
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>
          </div>

          {/* Elevated SOS Trigger Button with 3-second hold countdown and keyboard support */}
          <SosButton
            onTriggerSos={() => setIsSosOpen(true)}
            soundEnabled={preferences.soundEnabled}
            reducedMotion={preferences.reducedMotion}
          />
        </nav>
      </main>

      {/* Modals & Drawers */}
      <SafetyGuidanceModal
        isOpen={isGuidanceOpen}
        onClose={() => setIsGuidanceOpen(false)}
        assessment={assessment}
        weather={weather}
        soundEnabled={preferences.soundEnabled}
      />

      <PersonalizationModal
        isOpen={isPersonalizationOpen}
        onClose={() => setIsPersonalizationOpen(false)}
        preferences={preferences}
        onUpdatePreferences={handleUpdatePreferences}
        baseScore={assessment.overallScore}
        personalizedScore={assessment.personalizedScore}
      />

      <StormSimulatorLab
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        currentWeather={weather}
        onApplyCustomWeather={(custom) => {
          setWeather(custom);
          showToast(`⚡ Simulation Active: ${custom.rainfallMmHr} mm/h Rain, ${custom.windSpeedKmh} km/h Wind`);
        }}
        onResetToLive={() => loadLiveWeather(weather.lat, weather.lon, weather.locationName)}
        soundEnabled={preferences.soundEnabled}
      />

      <SosModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        weather={weather}
        assessment={assessment}
        health={health}
        soundEnabled={preferences.soundEnabled}
      />

      <VoiceBriefing
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        weather={weather}
        assessment={assessment}
      />

      <GlobeInspectorModal
        isOpen={isGlobeInspectorOpen}
        onClose={() => setIsGlobeInspectorOpen(false)}
        weather={weather}
        assessment={assessment}
        sectors={microGrids}
        soundEnabled={preferences.soundEnabled}
        reducedMotion={preferences.reducedMotion}
        onRadarPing={handleRadarPing}
      />
    </div>
  );
}
