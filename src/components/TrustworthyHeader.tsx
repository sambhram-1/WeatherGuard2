import React, { useState } from 'react';
import {
  MapPin,
  RefreshCw,
  Search,
  Sparkles,
  Sliders,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Type,
  Eye,
  Crosshair,
} from 'lucide-react';
import { UserPreferences, WeatherData } from '../types/weather';
import { DeviceHealthState } from '../services/deviceHealth';
import { POPULAR_CITIES, searchCities } from '../services/weatherService';
import { playTactileClick } from '../services/soundEffects';
import { DeviceHealthPill } from './DeviceHealthPill';

interface TrustworthyHeaderProps {
  weather: WeatherData;
  preferences: UserPreferences;
  health: DeviceHealthState;
  onTogglePowerSaving: () => void;
  onToggleOfflineSimulation: () => void;
  onSimulateBattery: (level: number) => void;
  onUpdatePreferences: (pref: Partial<UserPreferences>) => void;
  onSelectCity: (name: string, lat: number, lon: number) => void;
  onRefreshLive: () => void;
  onUseGps: () => void;
  onOpenSimulator: () => void;
  isLoading: boolean;
}

export const TrustworthyHeader: React.FC<TrustworthyHeaderProps> = ({
  weather,
  preferences,
  health,
  onTogglePowerSaving,
  onToggleOfflineSimulation,
  onSimulateBattery,
  onUpdatePreferences,
  onSelectCity,
  onRefreshLive,
  onUseGps,
  onOpenSimulator,
  isLoading,
}) => {
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showA11yPicker, setShowA11yPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ name: string; country: string; lat: number; lon: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchCities(query);
    setSearchResults(results);
    setIsSearching(false);
  };

  return (
    <header className="relative w-full z-40 px-3 pt-3 pb-2 text-white" aria-label="Application header & telemetry status">
      {/* Top Device Bar & Time */}
      <div className="flex items-center justify-between text-xs font-semibold text-white/90 mb-2 gap-1.5">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="font-display font-bold text-sm tracking-tight text-white drop-shadow">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[10px] text-white/60 font-mono hidden xs:inline">UTC+5:30</span>
        </div>

        {/* Discreet System Status Indicator (Battery & Connectivity Health) */}
        <DeviceHealthPill
          health={health}
          soundEnabled={preferences.soundEnabled}
          onTogglePowerSaving={onTogglePowerSaving}
          onToggleOfflineSimulation={onToggleOfflineSimulation}
          onSimulateBattery={onSimulateBattery}
        />

        {/* Dynamic Trust Badge (Live vs Simulation) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {weather.isSimulated ? (
            <button
              onClick={() => {
                playTactileClick(preferences.soundEnabled);
                onRefreshLive();
              }}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-bold shadow-sm hover:bg-amber-500/30 transition focus-visible:ring-2 focus-visible:ring-amber-400"
              title="Click to switch to real live Open-Meteo weather"
              aria-label="Simulation mode active. Click to switch to live production weather."
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>SIMULATION LAB</span>
              <span className="text-[9px] underline opacity-90 ml-0.5">Go Live</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold shadow-sm"
              title="Live Open-Meteo & Air Quality API verified feed"
              aria-label="System status: Live production meteorology verified"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>LIVE TELEMETRY</span>
              <span className="text-[9px] text-emerald-200/80 font-normal ml-0.5">
                {weather.lastUpdated}
              </span>
            </div>
          )}

          {/* Refresh Action */}
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              onRefreshLive();
            }}
            disabled={isLoading}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition text-white/80 hover:text-white disabled:opacity-50"
            title="Refresh current meteorological telemetry"
            aria-label="Refresh telemetry data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Bar: City Selector, Simulator Lab Trigger, and Accessibility Menu */}
      <div className="flex items-center justify-between gap-2">
        {/* City Location Button */}
        <button
          onClick={() => {
            playTactileClick(preferences.soundEnabled);
            setShowCityPicker(!showCityPicker);
            setShowA11yPicker(false);
          }}
          className="flex-1 min-w-0 glass-pill-dark px-3 py-1.5 rounded-full flex items-center justify-between cursor-pointer active:scale-[0.98] transition hover:border-white/40"
          aria-expanded={showCityPicker}
          aria-label={`Current location: ${weather.locationName}. Click to change city or use GPS.`}
        >
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="text-xs font-bold tracking-tight text-white truncate">
              {weather.locationName}
            </span>
            <span className="text-[10px] text-white/60 font-mono shrink-0">
              {weather.gridId}
            </span>
          </div>
          <span className="text-[10px] text-white/70 font-semibold ml-1">Change ▾</span>
        </button>

        {/* What-If Simulator Button */}
        <button
          onClick={() => {
            playTactileClick(preferences.soundEnabled);
            onOpenSimulator();
          }}
          className="px-2.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600/80 to-indigo-600/80 border border-purple-300/40 text-white text-[10.5px] font-bold flex items-center gap-1 shadow hover:from-purple-500 hover:to-indigo-500 transition active:scale-95"
          title="Open What-If Weather Simulator Lab"
          aria-label="Open What-If Storm Simulation Lab"
        >
          <Sliders className="w-3 h-3 text-purple-200" />
          <span>Sim Lab</span>
        </button>

        {/* Accessibility & Preferences Toggle */}
        <button
          onClick={() => {
            playTactileClick(preferences.soundEnabled);
            setShowA11yPicker(!showA11yPicker);
            setShowCityPicker(false);
          }}
          className={`p-1.5 rounded-full border transition active:scale-95 ${
            preferences.highContrast
              ? 'bg-yellow-400 text-black border-yellow-300'
              : 'glass-pill-dark text-white/90 hover:text-white border-white/20'
          }`}
          title="Accessibility & Display settings"
          aria-expanded={showA11yPicker}
          aria-label="Display, contrast, zoom and audio accessibility options"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* City Location Picker Drawer Modal */}
      {showCityPicker && (
        <div
          className="absolute left-3 right-3 top-20 bg-slate-900/98 border border-white/25 rounded-2xl p-3 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
          role="dialog"
          aria-modal="true"
          aria-label="Select location"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/15 mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <MapPin className="w-4 h-4 text-red-400" />
              <span>Select Location or Station</span>
            </div>
            <button
              onClick={() => setShowCityPicker(false)}
              className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded"
              aria-label="Close location picker"
            >
              ✕
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search worldwide city or district..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400"
              aria-label="Search city by name"
            />
          </div>

          {/* GPS Quick Action */}
          <button
            onClick={() => {
              playTactileClick(preferences.soundEnabled);
              setShowCityPicker(false);
              onUseGps();
            }}
            className="w-full mb-2.5 py-1.5 px-3 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/40 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>Use My Exact GPS Geolocation</span>
          </button>

          {/* Search Results list */}
          {searchResults.length > 0 && (
            <div className="mb-2 max-h-36 overflow-y-auto space-y-1">
              <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block px-1">
                Search Matches
              </span>
              {searchResults.map((city, idx) => (
                <button
                  key={`search-${idx}`}
                  onClick={() => {
                    playTactileClick(preferences.soundEnabled);
                    onSelectCity(city.name, city.lat, city.lon);
                    setShowCityPicker(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-white/15 text-xs text-white flex justify-between items-center transition"
                >
                  <span className="font-semibold">{city.name}</span>
                  <span className="text-[10px] text-white/60">{city.country}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Cities Grid */}
          <div>
            <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider block px-1 mb-1.5">
              Popular Monitoring Hubs
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    playTactileClick(preferences.soundEnabled);
                    onSelectCity(c.name, c.lat, c.lon);
                    setShowCityPicker(false);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium text-left truncate transition ${
                    weather.locationName.includes(c.name)
                      ? 'bg-red-600/80 text-white font-bold border border-white/40'
                      : 'bg-white/10 hover:bg-white/20 text-white/90'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Accessibility & Settings Drawer Modal */}
      {showA11yPicker && (
        <div
          className="absolute right-3 top-20 w-72 bg-slate-900/98 border border-white/25 rounded-2xl p-3.5 shadow-2xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Accessibility and display preferences"
        >
          <div className="flex items-center justify-between pb-2 border-b border-white/15 mb-3">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Accessibility & Display</span>
            </span>
            <button
              onClick={() => setShowA11yPicker(false)}
              className="text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded"
              aria-label="Close settings"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* High Contrast Mode */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">High Contrast</div>
                <div className="text-[10px] text-white/60">Crisp solid colors for maximum legibility</div>
              </div>
              <button
                onClick={() => {
                  playTactileClick(preferences.soundEnabled);
                  onUpdatePreferences({ highContrast: !preferences.highContrast });
                }}
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition ${
                  preferences.highContrast
                    ? 'bg-yellow-400 text-black'
                    : 'bg-white/20 text-white/80'
                }`}
                aria-pressed={preferences.highContrast}
              >
                {preferences.highContrast ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Reduced Motion Mode */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Reduced Motion</div>
                <div className="text-[10px] text-white/60">Freeze lightning strobes & rotating rings</div>
              </div>
              <button
                onClick={() => {
                  playTactileClick(preferences.soundEnabled);
                  onUpdatePreferences({ reducedMotion: !preferences.reducedMotion });
                }}
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition ${
                  preferences.reducedMotion
                    ? 'bg-cyan-400 text-black'
                    : 'bg-white/20 text-white/80'
                }`}
                aria-pressed={preferences.reducedMotion}
              >
                {preferences.reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Audio Feedback */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-white">Tactile & Alert Audio</div>
                <div className="text-[10px] text-white/60">Synthesized radar & SOS countdown tones</div>
              </div>
              <button
                onClick={() => {
                  const next = !preferences.soundEnabled;
                  onUpdatePreferences({ soundEnabled: next });
                  if (next) playTactileClick(true);
                }}
                className={`px-2.5 py-1 rounded-full font-bold text-[11px] transition ${
                  preferences.soundEnabled
                    ? 'bg-emerald-400 text-black'
                    : 'bg-white/20 text-white/80'
                }`}
                aria-pressed={preferences.soundEnabled}
              >
                {preferences.soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Unit Toggle */}
            <div className="flex items-center justify-between pt-1 border-t border-white/10">
              <span className="font-semibold text-white">Temperature Unit</span>
              <div className="flex rounded-lg overflow-hidden border border-white/20">
                <button
                  onClick={() => onUpdatePreferences({ tempUnit: 'C' })}
                  className={`px-2 py-0.5 text-[11px] font-bold ${
                    preferences.tempUnit === 'C' ? 'bg-white text-black' : 'text-white/70'
                  }`}
                >
                  °C
                </button>
                <button
                  onClick={() => onUpdatePreferences({ tempUnit: 'F' })}
                  className={`px-2 py-0.5 text-[11px] font-bold ${
                    preferences.tempUnit === 'F' ? 'bg-white text-black' : 'text-white/70'
                  }`}
                >
                  °F
                </button>
              </div>
            </div>

            {/* Text Zoom */}
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Font Size Scaling</span>
              <div className="flex rounded-lg overflow-hidden border border-white/20">
                {(['standard', 'large', 'xlarge'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdatePreferences({ fontSize: s })}
                    className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                      preferences.fontSize === s ? 'bg-white text-black' : 'text-white/70'
                    }`}
                  >
                    {s === 'standard' ? '100%' : s === 'large' ? '115%' : '130%'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
