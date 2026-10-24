export type RiskLevel = 'low' | 'moderate' | 'high' | 'severe';

export type UserRole = 'citizen' | 'commuter' | 'student' | 'responder' | 'farmer';

export type VulnerabilityFactorId =
  | 'elderly'
  | 'medical_dependency'
  | 'low_lying_home'
  | 'family_members'
  | 'two_wheeler_commute'
  | 'outdoor_worker';

export interface WeatherData {
  gridId: string;
  locationName: string;
  lat: number;
  lon: number;
  isSimulated: boolean;
  simulationPreset?: string;
  lastUpdated: string;
  temperatureC: number;
  feelsLikeC: number;
  dewPointC: number;
  rainfallMmHr: number;
  humidityPct: number;
  windSpeedKmh: number;
  windGustsKmh: number;
  windDirectionDeg: number;
  pressureHpa: number;
  lightningStrikesMin: number;
  uvIndex: number;
  visibilityKm: number;
  usAqi: number;
  pm25: number;
  weatherCode: number;
  hourly?: {
    time: string[];
    temperature: number[];
    precipitationProbability: number[];
    rain: number[];
    windSpeed: number[];
  };
}

export interface RiskAdvisory {
  id: string;
  priority: 'high' | 'moderate' | 'info';
  category: string;
  title: string;
  actionText: string;
  recommendedAction: string;
}

export interface RiskAssessment {
  gridId: string;
  rainRisk: number;
  lightningRisk: number;
  stormRisk: number;
  floodRisk: number;
  overallScore: number;
  overallLevel: RiskLevel;
  personalizedScore: number;
  personalizedLevel: RiskLevel;
  dominantHazard: string;
  confidencePct: number;
  advisories: RiskAdvisory[];
  evaluatedAt: string;
}

export interface MicroGridSector {
  id: string;
  sectorName: string;
  lat: number;
  lon: number;
  temperatureC: number;
  rainfallMmHr: number;
  windSpeedKmh: number;
  pressureHpa: number;
  lightningStrikesMin: number;
  riskScore: number;
  riskLevel: RiskLevel;
  dominantHazard: string;
  elevationTrend: 'low-lying' | 'elevated' | 'standard';
}

export interface UserPreferences {
  role: UserRole;
  factors: VulnerabilityFactorId[];
  tempUnit: 'C' | 'F';
  speedUnit: 'kmh' | 'mph';
  highContrast: boolean;
  reducedMotion: boolean;
  soundEnabled: boolean;
  fontSize: 'standard' | 'large' | 'xlarge';
}

export interface SosEvent {
  id: string;
  timestamp: string;
  isTestMode: boolean;
  lat: number;
  lon: number;
  riskLevel: RiskLevel;
  dominantHazard: string;
  status: 'transmitting' | 'broadcast_active' | 'cancelled';
  dispatchedTo: string[];
}
