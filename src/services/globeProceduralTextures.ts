import * as THREE from 'three';

/**
 * Converts Latitude and Longitude (degrees) to 3D Cartesian coordinates on a sphere of radius R
 */
export function latLonToCartesian(lat: number, lon: number, radius = 1.0): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Generates a procedural Earth Landmass & Oceanic Albedo Canvas Texture
 * Zero external image dependencies (100% offline & immune to 404s)
 */
export function createProceduralEarthTexture(isStorm = false): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Deep Ocean Base Gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  if (isStorm) {
    oceanGrad.addColorStop(0, '#0a0d18');
    oceanGrad.addColorStop(0.5, '#070a14');
    oceanGrad.addColorStop(1, '#05070f');
  } else {
    oceanGrad.addColorStop(0, '#081726');
    oceanGrad.addColorStop(0.5, '#061320');
    oceanGrad.addColorStop(1, '#040d16');
  }
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Graticule Lines (Parallels & Meridians)
  ctx.strokeStyle = isStorm ? 'rgba(239, 68, 68, 0.12)' : 'rgba(56, 189, 248, 0.12)';
  ctx.lineWidth = 1;
  // Parallels (Latitude lines)
  for (let lat = -80; lat <= 80; lat += 20) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  // Meridians (Longitude lines)
  for (let lon = -180; lon <= 180; lon += 30) {
    const x = ((lon + 180) / 360) * width;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // 3. Procedural Landmass Outlines (Simplified World Continents: Eurasia, Africa, Americas, Australia, Antarctica)
  ctx.fillStyle = isStorm ? '#1e1b2e' : '#142a36';
  ctx.strokeStyle = isStorm ? 'rgba(244, 63, 94, 0.45)' : 'rgba(20, 184, 166, 0.55)';
  ctx.lineWidth = 2;

  const drawLandBlob = (points: Array<[number, number]>) => {
    ctx.beginPath();
    points.forEach(([lon, lat], i) => {
      const x = ((lon + 180) / 360) * width;
      const y = ((90 - lat) / 180) * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  // Indian Subcontinent & South Asia
  drawLandBlob([
    [68, 25], [74, 32], [80, 31], [88, 26], [85, 20],
    [80, 13], [77, 8], [73, 15], [70, 20], [68, 25]
  ]);
  // Eurasia Mainland
  drawLandBlob([
    [-10, 36], [10, 45], [30, 48], [60, 55], [100, 60], [130, 55],
    [120, 30], [105, 22], [90, 23], [70, 35], [45, 38], [25, 36], [0, 42], [-10, 36]
  ]);
  // Africa
  drawLandBlob([
    [-17, 15], [10, 36], [32, 31], [51, 12], [42, -5],
    [32, -28], [20, -34], [12, -18], [-5, 5], [-17, 15]
  ]);
  // North America
  drawLandBlob([
    [-160, 65], [-130, 58], [-95, 48], [-75, 44], [-80, 25],
    [-98, 20], [-105, 32], [-124, 40], [-140, 55], [-160, 65]
  ]);
  // South America
  drawLandBlob([
    [-78, 10], [-52, 4], [-35, -5], [-42, -22], [-60, -38],
    [-70, -52], [-74, -40], [-79, -15], [-81, -2], [-78, 10]
  ]);
  // Australia
  drawLandBlob([
    [114, -22], [130, -12], [148, -19], [153, -28],
    [142, -38], [128, -34], [115, -30], [114, -22]
  ]);

  // 4. Convective Radar Hotspot Rings around India/Bengaluru coords (Lat ~13, Lon ~77)
  const focalX = ((77.59 + 180) / 360) * width;
  const focalY = ((90 - 12.97) / 180) * height;

  const radGrad = ctx.createRadialGradient(focalX, focalY, 2, focalX, focalY, isStorm ? 48 : 28);
  radGrad.addColorStop(0, isStorm ? 'rgba(239, 68, 68, 0.9)' : 'rgba(16, 185, 129, 0.8)');
  radGrad.addColorStop(0.5, isStorm ? 'rgba(249, 115, 22, 0.4)' : 'rgba(56, 189, 248, 0.35)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = radGrad;
  ctx.beginPath();
  ctx.arc(focalX, focalY, isStorm ? 48 : 28, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Generates procedural atmospheric clouds & spiral storm swirl texture
 */
export function createProceduralCloudTexture(isStorm = false): THREE.CanvasTexture {
  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, width, height);

  // Cloud bands
  ctx.fillStyle = isStorm ? 'rgba(255, 220, 220, 0.35)' : 'rgba(255, 255, 255, 0.32)';

  for (let i = 0; i < 45; i++) {
    const cx = Math.random() * width;
    const cy = height * 0.2 + Math.random() * height * 0.6;
    const rx = 40 + Math.random() * 85;
    const ry = 15 + Math.random() * 30;

    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, (Math.random() - 0.5) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Active Convective Storm Cyclonic Spiral over target region
  const stormX = ((77.59 + 180) / 360) * width;
  const stormY = ((90 - 12.97) / 180) * height;

  ctx.fillStyle = isStorm ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.45)';
  for (let angle = 0; angle < Math.PI * 5; angle += 0.35) {
    const r = 4 + angle * 7;
    const px = stormX + Math.cos(angle) * r;
    const py = stormY + Math.sin(angle) * (r * 0.7);
    ctx.beginPath();
    ctx.arc(px, py, 5 + angle * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Procedural Soft Radial Contact Shadow Texture
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const radGrad = ctx.createRadialGradient(128, 128, 10, 128, 128, 120);
  radGrad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
  radGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.45)');
  radGrad.addColorStop(0.8, 'rgba(0, 0, 0, 0.1)');
  radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = radGrad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
