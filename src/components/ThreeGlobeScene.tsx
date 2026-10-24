import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RiskAssessment, WeatherData } from '../types/weather';
import {
  createContactShadowTexture,
  createProceduralCloudTexture,
  createProceduralEarthTexture,
  latLonToCartesian,
} from '../services/globeProceduralTextures';
import { playRadarSonar, playTactileClick } from '../services/soundEffects';

interface ThreeGlobeSceneProps {
  weather: WeatherData;
  assessment: RiskAssessment;
  soundEnabled: boolean;
  reducedMotion: boolean;
  size?: number;
  onRadarPing?: () => void;
  onExpandInspector?: () => void;
}

export const ThreeGlobeScene: React.FC<ThreeGlobeSceneProps> = ({
  weather,
  assessment,
  soundEnabled,
  reducedMotion,
  size = 184,
  onRadarPing,
  onExpandInspector,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const isStorm = assessment.overallLevel === 'severe' || assessment.overallLevel === 'high';

  // Refs for animation state & props without remounting WebGL
  const stateRef = useRef({
    isStorm,
    weather,
    assessment,
    reducedMotion,
    isInteracting: false,
    rotationVelocity: { x: 0, y: 0.003 },
    targetRotation: { x: 0.2, y: 0 },
    currentRotation: { x: 0.2, y: 0 },
    lastPointerPos: { x: 0, y: 0 },
    radarPulseScale: 1.0,
    radarPulseOpacity: 0.0,
    lightningTimer: 0,
    lightningVisible: false,
  });

  stateRef.current.isStorm = isStorm;
  stateRef.current.weather = weather;
  stateRef.current.assessment = assessment;
  stateRef.current.reducedMotion = reducedMotion;

  const triggerPing = () => {
    stateRef.current.radarPulseScale = 1.0;
    stateRef.current.radarPulseOpacity = 1.0;
    stateRef.current.lightningVisible = true;
    stateRef.current.lightningTimer = 0.25; // 250ms burst
    playTactileClick(soundEnabled);
    playRadarSonar(soundEnabled);
    onRadarPing?.();
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Setup Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(size, size);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.appendChild(renderer.domElement);

    // 3. Studio PBR Environment Map via RoomEnvironment
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    // 4. Balanced Studio 3-Point Lighting Rig
    const sunLight = new THREE.DirectionalLight(0xfff6ea, 2.2);
    sunLight.position.set(4, 3, 3);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(
      isStorm ? 0xf87171 : 0x38bdf8,
      0x050209,
      isStorm ? 1.4 : 1.1
    );
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(isStorm ? 0xef4444 : 0x10b981, 1.8);
    rimLight.position.set(-3, -2, -2);
    scene.add(rimLight);

    // 5. Composite 3-12 Part Procedural Earth & Atmospheric Model (THREE.Group)
    const masterGlobeGroup = new THREE.Group();
    scene.add(masterGlobeGroup);

    // Part 1: Primary Celestial Core Globe
    const globeRadius = 1.0;
    const earthGeo = new THREE.SphereGeometry(globeRadius, 48, 48);
    const earthTex = createProceduralEarthTexture(isStorm);
    earthTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthTex,
      roughness: 0.65,
      metalness: 0.15,
      bumpScale: 0.04,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    masterGlobeGroup.add(earthMesh);

    // Part 2: Dynamic Atmospheric Cloud & Convective Storm Swirl Layer
    const cloudGeo = new THREE.SphereGeometry(globeRadius * 1.025, 40, 40);
    const cloudTex = createProceduralCloudTexture(isStorm);
    const cloudMat = new THREE.MeshStandardMaterial({
      map: cloudTex,
      transparent: true,
      opacity: isStorm ? 0.65 : 0.45,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
    masterGlobeGroup.add(cloudMesh);

    // Part 3: Atmospheric Rayleigh Scattering Glow Corona (BackSide Fresnel)
    const coronaGeo = new THREE.SphereGeometry(globeRadius * 1.07, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: isStorm ? 0xef4444 : 0x00f2fe,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: isStorm ? 0.38 : 0.28,
    });
    const coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
    masterGlobeGroup.add(coronaMesh);

    // Part 4: Geostationary Orbital Telemetry Ring
    const orbitRingGeo = new THREE.TorusGeometry(globeRadius * 1.28, 0.012, 12, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: isStorm ? 0xf87171 : 0x38bdf8,
      transparent: true,
      opacity: 0.4,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 3;
    orbitRing.rotation.y = Math.PI / 8;
    masterGlobeGroup.add(orbitRing);

    // Part 5: 3-Part Procedural Satellite Assembly
    const satelliteGroup = new THREE.Group();
    // Satellite main chassis bus
    const satBusGeo = new THREE.BoxGeometry(0.06, 0.04, 0.04);
    const satBusMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // gold foil
      metalness: 0.9,
      roughness: 0.2,
    });
    const satBus = new THREE.Mesh(satBusGeo, satBusMat);
    satelliteGroup.add(satBus);

    // Satellite Solar Array Wings
    const solarWingGeo = new THREE.BoxGeometry(0.16, 0.025, 0.005);
    const solarWingMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a, // deep blue photovoltaic cells
      metalness: 0.8,
      roughness: 0.25,
    });
    const solarWing = new THREE.Mesh(solarWingGeo, solarWingMat);
    satelliteGroup.add(solarWing);

    // Satellite Antenna dish
    const antennaDishGeo = new THREE.ConeGeometry(0.025, 0.02, 16);
    const antennaDishMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.7,
      roughness: 0.3,
    });
    const antennaDish = new THREE.Mesh(antennaDishGeo, antennaDishMat);
    antennaDish.rotation.x = -Math.PI / 2;
    antennaDish.position.z = 0.03;
    satelliteGroup.add(antennaDish);

    satelliteGroup.position.set(globeRadius * 1.28, 0, 0);
    orbitRing.add(satelliteGroup);

    // Part 6: Target Geolocation Radar Pin & Concentric Wave Beacon
    const pinGroup = new THREE.Group();
    const targetPos = latLonToCartesian(weather.lat, weather.lon, globeRadius);
    pinGroup.position.copy(targetPos);
    pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetPos.clone().normalize());

    // Vertical pin stalk
    const pinStalkGeo = new THREE.CylinderGeometry(0.008, 0.004, 0.12, 12);
    const pinStalkMat = new THREE.MeshBasicMaterial({
      color: isStorm ? 0xef4444 : 0x10b981,
    });
    const pinStalk = new THREE.Mesh(pinStalkGeo, pinStalkMat);
    pinStalk.position.y = 0.06;
    pinGroup.add(pinStalk);

    // Glowing tip bead
    const pinTipGeo = new THREE.SphereGeometry(0.024, 16, 16);
    const pinTipMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const pinTip = new THREE.Mesh(pinTipGeo, pinTipMat);
    pinTip.position.y = 0.12;
    pinGroup.add(pinTip);

    // Concentric expanding radar wave ring
    const radarWaveGeo = new THREE.RingGeometry(0.02, 0.045, 32);
    const radarWaveMat = new THREE.MeshBasicMaterial({
      color: isStorm ? 0xef4444 : 0x00f2fe,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const radarWave = new THREE.Mesh(radarWaveGeo, radarWaveMat);
    radarWave.rotation.x = Math.PI / 2;
    radarWave.position.y = 0.01;
    pinGroup.add(radarWave);

    masterGlobeGroup.add(pinGroup);

    // Initial orientation: align target latitude and longitude toward camera
    masterGlobeGroup.rotation.y = -((weather.lon + 90) * (Math.PI / 180));
    masterGlobeGroup.rotation.x = (weather.lat * (Math.PI / 180)) * 0.4;
    stateRef.current.currentRotation.x = masterGlobeGroup.rotation.x;
    stateRef.current.currentRotation.y = masterGlobeGroup.rotation.y;
    stateRef.current.targetRotation.x = masterGlobeGroup.rotation.x;
    stateRef.current.targetRotation.y = masterGlobeGroup.rotation.y;

    // Part 7: 3D Procedural Convective Lightning Arcs
    const lightningGroup = new THREE.Group();
    const buildLightningGeometry = () => {
      const points: THREE.Vector3[] = [];
      let cur = targetPos.clone().multiplyScalar(1.02);
      for (let i = 0; i < 7; i++) {
        const next = cur.clone().add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.08,
            0.04 + Math.random() * 0.04,
            (Math.random() - 0.5) * 0.08
          )
        );
        points.push(cur, next);
        cur = next;
      }
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      return geo;
    };

    const lightningMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 2,
    });
    let lightningLines = new THREE.LineSegments(buildLightningGeometry(), lightningMat);
    lightningGroup.add(lightningLines);
    lightningGroup.visible = false;
    masterGlobeGroup.add(lightningGroup);

    // Part 8: Outer Volumetric Optical Acrylic Glass Boundary Shell
    const acrylicGeo = new THREE.SphereGeometry(globeRadius * 1.15, 36, 36);
    const acrylicMat = new THREE.MeshPhysicalMaterial({
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transparent: true,
      opacity: 0.35,
      color: isStorm ? 0xef4444 : 0x38bdf8,
      depthWrite: false,
    });
    const acrylicMesh = new THREE.Mesh(acrylicGeo, acrylicMat);
    scene.add(acrylicMesh);

    // Part 9: Contact Shadow Disc directly underneath
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4);
    const shadowTex = createContactShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.25;
    scene.add(shadowMesh);

    // 6. Interactive Drag & Touch Orbit Handlers
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      stateRef.current.isInteracting = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      prevX = clientX;
      prevY = clientY;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const dx = clientX - prevX;
      const dy = clientY - prevY;

      stateRef.current.targetRotation.y += dx * 0.008;
      stateRef.current.targetRotation.x = Math.max(
        -Math.PI / 3,
        Math.min(Math.PI / 3, stateRef.current.targetRotation.x + dy * 0.008)
      );

      prevX = clientX;
      prevY = clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      setTimeout(() => {
        stateRef.current.isInteracting = false;
      }, 800);
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    domEl.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // 7. Render Loop with Exponential Damping & Software-WebGL Pace Guard
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const glContext = renderer.getContext() as WebGL2RenderingContext;
      const sync = glContext.fenceSync(glContext.SYNC_GPU_COMMANDS_COMPLETE, 0);
      glContext.flush();
      const poll = () => {
        const state = sync && glContext.getSyncParameter(sync, glContext.SYNC_STATUS);
        if (state === glContext.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) glContext.deleteSync(sync);
          frameId = window.setTimeout(cb, 75);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;

      // Silky Smooth Exponential Damping for Camera / Rotation
      const dampFactor = 1 - Math.exp(-12 * dt);
      state.currentRotation.x += (state.targetRotation.x - state.currentRotation.x) * dampFactor;
      state.currentRotation.y += (state.targetRotation.y - state.currentRotation.y) * dampFactor;

      masterGlobeGroup.rotation.x = state.currentRotation.x;
      masterGlobeGroup.rotation.y = state.currentRotation.y;

      // Subtle atmospheric auto-rotation if not actively dragging
      if (!state.isInteracting && !state.reducedMotion) {
        state.targetRotation.y += 0.0015;
        cloudMesh.rotation.y += 0.001; // differential cloud drift
        satelliteGroup.rotation.y += 0.01; // satellite orbit speed
      }

      // Radar Pulse animation
      if (state.radarPulseOpacity > 0) {
        state.radarPulseScale += dt * 3.5;
        state.radarPulseOpacity -= dt * 1.8;
        radarWave.scale.set(state.radarPulseScale, state.radarPulseScale, 1);
        radarWaveMat.opacity = Math.max(0, state.radarPulseOpacity);
      }

      // 3D Lightning flash handling
      if (state.lightningVisible) {
        state.lightningTimer -= dt;
        if (state.lightningTimer <= 0) {
          state.lightningVisible = false;
          lightningGroup.visible = false;
        } else {
          lightningGroup.visible = true;
          lightningLines.geometry.dispose();
          lightningLines.geometry = buildLightningGeometry();
        }
      } else if (state.isStorm && !state.reducedMotion && Math.random() < 0.018) {
        state.lightningVisible = true;
        state.lightningTimer = 0.12;
      }

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    // 8. Clean Resource Disposal on unmount
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);

      domEl.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      domEl.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      earthGeo.dispose();
      earthMat.dispose();
      earthTex.dispose();

      cloudGeo.dispose();
      cloudMat.dispose();
      cloudTex.dispose();

      coronaGeo.dispose();
      coronaMat.dispose();

      orbitRingGeo.dispose();
      orbitRingMat.dispose();

      satBusGeo.dispose();
      satBusMat.dispose();
      solarWingGeo.dispose();
      solarWingMat.dispose();
      antennaDishGeo.dispose();
      antennaDishMat.dispose();

      pinStalkGeo.dispose();
      pinStalkMat.dispose();
      pinTipGeo.dispose();
      pinTipMat.dispose();
      radarWaveGeo.dispose();
      radarWaveMat.dispose();

      lightningMat.dispose();
      acrylicGeo.dispose();
      acrylicMat.dispose();

      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [size, isStorm, weather.lat, weather.lon]);

  return (
    <div
      ref={mountRef}
      onClick={triggerPing}
      className="relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
      style={{ width: `${size}px`, height: `${size}px` }}
      title="Three.js 3D Globe: Drag to orbit earth, click to ping Doppler radar"
      aria-label={`Interactive Three.js 3D Weather Globe for ${weather.locationName} (${weather.lat}°, ${weather.lon}°)`}
    />
  );
};
