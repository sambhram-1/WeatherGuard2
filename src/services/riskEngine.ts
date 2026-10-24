import {
  RiskAdvisory,
  RiskAssessment,
  RiskLevel,
  UserRole,
  VulnerabilityFactorId,
  WeatherData,
} from '../types/weather';

export function clamp(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, val));
}

export function scoreToLevel(score: number): RiskLevel {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'severe';
}

export function calculateMultiHazardRisk(
  weather: WeatherData,
  role: UserRole = 'citizen',
  factors: VulnerabilityFactorId[] = []
): RiskAssessment {
  const rainRisk = clamp(
    Math.round(
      weather.rainfallMmHr * 1.55 +
        (weather.humidityPct - 50) * 0.48 +
        (1013 - weather.pressureHpa) * 0.82
    )
  );

  const lightningRisk = clamp(
    Math.round(
      weather.lightningStrikesMin * 3.4 +
        weather.rainfallMmHr * 0.75 +
        (1013 - weather.pressureHpa) * 0.65
    )
  );

  const stormRisk = clamp(
    Math.round(
      weather.windSpeedKmh * 1.12 +
        (1013 - weather.pressureHpa) * 1.28 +
        weather.rainfallMmHr * 0.58
    )
  );

  const floodRisk = clamp(
    Math.round(
      weather.rainfallMmHr * 1.75 +
        Math.max(0, weather.humidityPct - 70) * 0.65 +
        Math.max(0, 1008 - weather.pressureHpa) * 0.70
    )
  );

  const hazardList = [
    { name: 'Urban Flood', value: floodRisk },
    { name: 'Rainfall Deluge', value: rainRisk },
    { name: 'Severe Storm', value: stormRisk },
    { name: 'Lightning Strikes', value: lightningRisk },
  ];

  const avgHazard = (rainRisk + lightningRisk + stormRisk + floodRisk) / 4;
  const maxHazard = Math.max(...hazardList.map((h) => h.value));

  // Overall composite formula matching Weather Guard ML Random Forest output
  const overallScore = clamp(Math.round(0.6 * avgHazard + 0.4 * maxHazard));
  const overallLevel = scoreToLevel(overallScore);

  // Dominant Hazard identification
  hazardList.sort((a, b) => b.value - a.value);
  const dominantHazard = overallScore < 25 ? 'Fair Weather' : hazardList[0].name;

  // Vulnerability weighting
  const factorWeights: Record<VulnerabilityFactorId, number> = {
    elderly: 6,
    medical_dependency: 8,
    low_lying_home: floodRisk >= 30 ? 9 : 5,
    family_members: 4,
    two_wheeler_commute: rainRisk >= 30 || stormRisk >= 30 ? 7 : 4,
    outdoor_worker: 7,
  };

  const vulnBoost = factors.reduce((acc, f) => acc + (factorWeights[f] || 4), 0);
  const personalizedScore = clamp(overallScore + vulnBoost);
  const personalizedLevel = scoreToLevel(personalizedScore);

  // Build actionable advisories
  const advisories: RiskAdvisory[] = [];

  if (floodRisk >= 55 || weather.rainfallMmHr >= 20) {
    advisories.push({
      id: 'adv-flood',
      priority: 'high',
      category: 'Flood & Inundation',
      title: 'Flash Flood Warning — Low-Lying Corridors',
      actionText:
        'Avoid underpasses and low-lying transit corridors. Water levels exceed safe clearance. Move to higher ground.',
      recommendedAction: 'Relocate above ground level; avoid stormwater drains.',
    });
  }

  if (lightningRisk >= 50 || weather.lightningStrikesMin >= 5) {
    advisories.push({
      id: 'adv-lightning',
      priority: 'high',
      category: 'Electrical Storm',
      title: 'Active Lightning Danger Within Sensor Radius',
      actionText:
        'Seek enclosed grounded building immediately. Avoid open fields, metal fences, and tall isolated trees.',
      recommendedAction: 'Stay indoors until 30 minutes after last thunder roll.',
    });
  }

  if (stormRisk >= 50 || weather.windSpeedKmh >= 40) {
    advisories.push({
      id: 'adv-storm',
      priority: stormRisk >= 70 ? 'high' : 'moderate',
      category: 'Gale & Convective Wind',
      title: `High Wind Gusts (${weather.windGustsKmh || weather.windSpeedKmh} km/h)`,
      actionText:
        'Secure exterior furnishings and balcony items. Watch for falling tree branches and unsecured signage.',
      recommendedAction: 'Anchor loose outdoor equipment and stay clear of glass facades.',
    });
  }

  if (weather.temperatureC >= 38 || weather.uvIndex >= 9) {
    advisories.push({
      id: 'adv-heat',
      priority: 'moderate',
      category: 'Thermal Stress & Solar Flux',
      title: `Extreme Heat / UV Index ${weather.uvIndex}`,
      actionText:
        'High thermal stress. Drink water every 20-30 minutes and stay out of direct sunlight during peak noon hours.',
      recommendedAction: 'Use protective sunscreen and access air-conditioned cooling spaces.',
    });
  }

  // Profile-specific actionable instructions
  const roleAdvice: Record<UserRole, { title: string; text: string; action: string }> = {
    citizen: {
      title: 'Resident Safety Protocol',
      text: 'Keep battery power banks charged and store 72 hours of clean water. Keep battery radios or emergency alerts active.',
      action: 'Confirm family emergency meeting location and charge emergency flashlights.',
    },
    commuter: {
      title: 'Transit & Mobility Guidance',
      text: 'Major waterlogging reported in low-lying junctions. Metro services prioritized over surface arterial roads.',
      action: 'Check live road closure alerts before departure; delay non-essential travel.',
    },
    student: {
      title: 'Campus & School Advisory',
      text: 'Verify school or university weather notifications before commuting. Stay inside campus sheltered pavilions.',
      action: 'Share live trip status with family guardians.',
    },
    responder: {
      title: 'Emergency Responder Operational Protocol',
      text: 'HIGH ALERT: Pre-position dewatering pumps and rapid-rescue dinghies near designated inundation choke-points.',
      action: 'Verify satellite transceiver signal and dispatch frequency on 112 backup channels.',
    },
    farmer: {
      title: 'Agricultural & Livestock Protection',
      text: 'Move harvested produce into waterproof storage sheds. Trench agricultural runoff ditches to avoid root drown.',
      action: 'Shelter farm livestock away from tin-roof structures prone to wind lift.',
    },
  };

  const roleInfo = roleAdvice[role] || roleAdvice.citizen;
  advisories.push({
    id: `adv-role-${role}`,
    priority: role === 'responder' ? 'high' : 'info',
    category: `${role.toUpperCase()} Protocol`,
    title: roleInfo.title,
    actionText: roleInfo.text,
    recommendedAction: roleInfo.action,
  });

  if (factors.includes('medical_dependency')) {
    advisories.push({
      id: 'adv-vuln-medical',
      priority: 'high',
      category: 'Critical Medical Needs',
      title: 'Medical Life-Support & Power Reliability',
      actionText:
        'Ensure uninterruptible power supply (UPS) batteries for medical equipment are fully charged with spare oxygen/meds ready.',
      recommendedAction: 'Confirm location of nearest operational hospital emergency generator bay.',
    });
  }

  if (factors.includes('low_lying_home') && floodRisk >= 35) {
    advisories.push({
      id: 'adv-vuln-flood',
      priority: 'high',
      category: 'Basement & Ground Level Threat',
      title: 'Ground-Floor Water Entry Risk',
      actionText:
        'Deploy flood barriers or sandbags at entry thresholds. Turn off main circuit breaker if floodwaters rise near electrical outlets.',
      recommendedAction: 'Elevate computers, appliances, and legal documents to upper shelves.',
    });
  }

  return {
    gridId: weather.gridId,
    rainRisk,
    lightningRisk,
    stormRisk,
    floodRisk,
    overallScore,
    overallLevel,
    personalizedScore,
    personalizedLevel,
    dominantHazard,
    confidencePct: Math.round(91 - Math.abs(weather.pressureHpa - 1013) * 0.15),
    advisories,
    evaluatedAt: new Date().toISOString(),
  };
}
