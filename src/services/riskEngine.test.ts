import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMultiHazardRisk,
  clamp,
  scoreToLevel,
} from './riskEngine';
import { WeatherData } from '../types/weather';

const mockCalmWeather: WeatherData = {
  gridId: 'WG-TEST-CALM',
  locationName: 'Bengaluru Central',
  lat: 12.9716,
  lon: 77.5946,
  isSimulated: false,
  lastUpdated: '2026-10-23T23:00:00Z',
  temperatureC: 27.5,
  feelsLikeC: 28.0,
  dewPointC: 19.5,
  rainfallMmHr: 0.2,
  humidityPct: 60,
  windSpeedKmh: 10.0,
  windGustsKmh: 14.0,
  windDirectionDeg: 120,
  pressureHpa: 1013.2,
  lightningStrikesMin: 0,
  uvIndex: 5.5,
  visibilityKm: 10.0,
  usAqi: 35,
  pm25: 8.5,
  weatherCode: 1,
};

const mockStormWeather: WeatherData = {
  gridId: 'WG-TEST-STORM',
  locationName: 'Bengaluru Flood Corridor',
  lat: 12.9716,
  lon: 77.5946,
  isSimulated: true,
  lastUpdated: '2026-10-23T23:00:00Z',
  temperatureC: 22.0,
  feelsLikeC: 23.5,
  dewPointC: 21.0,
  rainfallMmHr: 65.0,
  humidityPct: 95,
  windSpeedKmh: 48.5,
  windGustsKmh: 70.0,
  windDirectionDeg: 260,
  pressureHpa: 994.0,
  lightningStrikesMin: 22,
  uvIndex: 1.0,
  visibilityKm: 1.2,
  usAqi: 28,
  pm25: 6.0,
  weatherCode: 96,
};

test('clamp utility constrains values strictly within bounds', () => {
  assert.equal(clamp(150, 0, 100), 100);
  assert.equal(clamp(-25, 0, 100), 0);
  assert.equal(clamp(42, 0, 100), 42);
});

test('scoreToLevel correctly classifies risk buckets', () => {
  assert.equal(scoreToLevel(12), 'low');
  assert.equal(scoreToLevel(35), 'moderate');
  assert.equal(scoreToLevel(65), 'high');
  assert.equal(scoreToLevel(88), 'severe');
});

test('calm weather produces low hazard levels and safe baseline', () => {
  const result = calculateMultiHazardRisk(mockCalmWeather, 'citizen', []);
  assert.ok(result.overallScore < 25, `Expected score < 25, got ${result.overallScore}`);
  assert.equal(result.overallLevel, 'low');
  assert.equal(result.lightningRisk, 0);
});

test('severe thunderstorm triggers high/severe composite score and relevant advisories', () => {
  const result = calculateMultiHazardRisk(mockStormWeather, 'citizen', []);
  assert.ok(result.overallScore >= 70, `Expected severe/high score >= 70, got ${result.overallScore}`);
  assert.ok(result.overallLevel === 'high' || result.overallLevel === 'severe');
  assert.ok(result.floodRisk >= 70, `Expected flood risk >= 70, got ${result.floodRisk}`);
  assert.ok(result.lightningRisk >= 70, `Expected lightning risk >= 70, got ${result.lightningRisk}`);

  // Advisories must include flood and lightning warnings
  const advisoryCategories = result.advisories.map((a) => a.category);
  assert.ok(advisoryCategories.some((c) => c.includes('Flood')));
  assert.ok(advisoryCategories.some((c) => c.includes('Electrical')));
});

test('vulnerability factors increase personalized score over base overall score', () => {
  const baseResult = calculateMultiHazardRisk(mockStormWeather, 'citizen', []);
  const vulnResult = calculateMultiHazardRisk(mockStormWeather, 'citizen', [
    'elderly',
    'medical_dependency',
    'low_lying_home',
  ]);

  assert.ok(
    vulnResult.personalizedScore >= baseResult.overallScore,
    `Personalized score (${vulnResult.personalizedScore}) should be >= base (${baseResult.overallScore})`
  );
  assert.ok(vulnResult.advisories.some((a) => a.category.includes('Medical')));
  assert.ok(vulnResult.advisories.some((a) => a.category.includes('Ground Level')));
});

test('responder profile receives high priority protocol', () => {
  const responderResult = calculateMultiHazardRisk(mockStormWeather, 'responder', []);
  const responderAdv = responderResult.advisories.find((a) => a.category.includes('RESPONDER'));
  assert.ok(responderAdv, 'Expected responder advisory');
  assert.equal(responderAdv?.priority, 'high');
});
