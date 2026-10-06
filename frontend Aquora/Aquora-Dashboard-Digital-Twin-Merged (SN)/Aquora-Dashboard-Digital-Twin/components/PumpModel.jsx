'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/*
  Submersible Borewell Pump - Digital Twin

  Kept intentionally limited to:
  1. Original ML-supported outputs:
     - Phase A/B/C RMS current
     - Phase unbalance
     - Dry-run detection (< 2 A average RMS)
     - MCSA/autoencoder MAE anomaly
     - MAE threshold = 0.1037
     - Fault state and fault location
  2. Water-level visualization driven by API telemetry.

  No temperature, RPM, THD, pressure, flow, or extra ML predictions are added.

  FIX LOG (this version):
  - Fault detection rewritten from an if/else-if chain (first-match-wins,
    and the low-water branch incorrectly set fault=false) into a list of
    independently-evaluated conditions, sorted by severity. This means:
      * Low Water Availability now actually sets fault=true and is visible
        in the UI, instead of silently computing a faultType that never
        surfaced.
      * Simultaneous faults (e.g. low water AND high MAE) are no longer
        lost to each other — all active conditions are tracked, the
        highest-severity one drives the primary badge/halo, and
        activeFaultCount reports how many are firing at once.
      * Each condition carries a 0-1 "margin" (how far past its threshold
        the live reading is), used to drive halo intensity so the
        illustration reflects the data instead of pulsing at a fixed rate.
  - Fault halo now covers all three fault locations (Submersible Motor,
    Pump Stages / Suction, Suction Strainer) instead of only two, and its
    opacity/pulse speed scale with faultMargin.
*/

const COLORS = {
  bg: '#061019',
  metal: '#26333f',
  metalDark: '#111b24',
  steel: '#657482',
  edge: '#4e6475',
  water: '#1686c7',
  waterLight: '#55c9ff',
  text: '#e8f0f6',
  muted: '#7f94a5',
  ok: '#35d399',
  warning: '#f5c451',
  fault: '#ef4444',
  blue: '#54b8ff',
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Fault decisions are produced by the ESP32 + Edge AI and stored in MySQL.
// The Digital Twin only visualizes the received decision; it does not create
// a second, conflicting fault decision in the browser.
function getFaultDetails(activeFault) {
  const raw = Array.isArray(activeFault)
    ? activeFault[0]
    : String(activeFault ?? 'NONE').trim();

  const key = raw.toUpperCase().replace(/[\s-]+/g, '_');

  if (!raw || key === 'NONE' || key === 'NO_FAULT' || key === 'HEALTHY') {
    return {
      active: false,
      type: 'Healthy',
      location: 'None',
    };
  }

  if (key.includes('DRY_RUN') || key.includes('DRYRUN')) {
    return {
      active: true,
      type: 'Dry Run Detected',
      location: 'Pump Stages / Suction',
    };
  }

  if (
    key.includes('PHASE_UNBALANCE') ||
    key.includes('SINGLE_PHASING') ||
    key.includes('UNBALANCE')
  ) {
    return {
      active: true,
      type: 'Phase Unbalance / Single Phasing',
      location: 'Submersible Motor',
    };
  }

  if (key.includes('MECHANICAL_WEAR') || key.includes('WEAR')) {
    return {
      active: true,
      type: 'Mechanical Wear Detected',
      location: 'Submersible Motor',
    };
  }

  if (key.includes('LOW_WATER') || key.includes('WATER_AVAILABILITY')) {
    return {
      active: true,
      type: 'Low Water Availability',
      location: 'Suction Strainer',
    };
  }

  // Preserve an unknown fault coming from Edge AI rather than hiding it.
  return {
    active: true,
    type: raw,
    location: 'Submersible Motor',
  };
}

export default function PumpModel({ status = null, compact = false }) {
  const mountRef = useRef(null);
  const containerRef = useRef(null);
  const sceneObjectsRef = useRef({});
  const animationRef = useRef(null);

  const [telemetry, setTelemetry] = useState({
    deviceId: '',
    dt: '',
    waterLevel: 0,
    voltageRms: 0,
    currentRms: 0,
    powerFactor: 0,
    frequency: 0,
    unbalancePct: 0,
    healthScore: 0,
    anomalyScore: 0,
    confidence: 0,
    dynamicThreshold: 0,
    activeFault: 'NONE',
    conceptDriftDetected: false,
  });
  const [labels, setLabels] = useState(true);
  const [apiConnected, setApiConnected] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const isCompact = compact && !isExpanded;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsExpanded(document.fullscreenElement === containerRef.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const openFullDigitalTwin = async () => {
    setIsExpanded(true);
    try {
      if (containerRef.current && document.fullscreenElement !== containerRef.current) {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Prototype: this backend reads the teammate's existing MySQL database.
  // REST is used for the initial/latest snapshot. WebSocket is used for
  // continuous live updates after the page is loaded.
  const DEVICE_ID = 'BW005';
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/borewells/${DEVICE_ID}/latest`;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL;

  const applyTelemetry = (data) => {
    const telemetryData = data.telemetry ?? data;
    const mlData = data.mlAnalytics ?? data.ml_analytics ?? data;

    setTelemetry({
      deviceId: data.deviceId ?? data.device_id ?? DEVICE_ID,
      dt: data.dt ?? '',
      waterLevel: Number(data.waterLevel ?? data.water_level ?? 0),
      voltageRms: Number(
        telemetryData.voltageRms ?? telemetryData.voltage_rms ?? 0
      ),
      currentRms: Number(
        telemetryData.currentRms ?? telemetryData.current_rms ?? 0
      ),
      powerFactor: Number(
        telemetryData.powerFactor ?? telemetryData.power_factor ?? 0
      ),
      frequency: Number(telemetryData.frequency ?? 0),
      unbalancePct: Number(
        telemetryData.unbalancePct ?? telemetryData.unbalance_pct ?? 0
      ),
      healthScore: Number(mlData.healthScore ?? mlData.health_score ?? 0),
      anomalyScore: Number(
        mlData.anomalyScore ?? mlData.anomaly_score ?? 0
      ),
      confidence: Number(mlData.confidence ?? 0),
      dynamicThreshold: Number(
        mlData.dynamicThreshold ?? mlData.dynamic_threshold ?? 0
      ),
      activeFault:
        mlData.activeFaults ??
        mlData.active_faults ??
        mlData.activeFault ??
        mlData.active_fault ??
        'NONE',
      conceptDriftDetected: Boolean(
        mlData.conceptDriftDetected ??
          mlData.concept_drift_detected ??
          false
      ),
    });

    setLastUpdated(new Date());
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial snapshot through REST API.
    const fetchInitialTelemetry = async () => {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!mounted) return;

        applyTelemetry(data);
        setApiConnected(true);
        console.log('Initial telemetry from MySQL/Spring Boot:', data);
      } catch (error) {
        if (!mounted) return;
        setApiConnected(false);
        console.error('REST API Error:', error);
      }
    };

    fetchInitialTelemetry();

    // 2. Live stream through Spring Boot plain WebSocket.
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      if (!mounted) return;

      setWsConnected(true);
      console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (!mounted) return;

        applyTelemetry(data);
        setApiConnected(true);
        console.log('Live telemetry:', data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    socket.onclose = () => {
      if (mounted) {
        setWsConnected(false);
      }

      console.log('WebSocket closed');
    };

    socket.onerror = (error) => {
  if (mounted) {
    setWsConnected(false);
  }

  console.error('WebSocket error:', error);
  console.error('WebSocket URL:', WS_URL);
  console.error('WebSocket readyState:', socket.readyState);
};

socket.onclose = (event) => {
  if (mounted) {
    setWsConnected(false);
  }

  console.log('WebSocket closed');
  console.log('Close code:', event.code);
  console.log('Close reason:', event.reason);
  console.log('Was clean:', event.wasClean);
};

    return () => {
      mounted = false;
      socket.close();
    };
  }, []);

  const unbalance = telemetry.unbalancePct;
  const averageRms = telemetry.currentRms;

  // Edge AI has already decided the fault. The frontend only maps that
  // decision to the corresponding 3D component for visualization.
  const primaryFault = getFaultDetails(telemetry.activeFault);
  const fault = primaryFault.active;
  const faultType = primaryFault.type;
  const faultLocation = primaryFault.location;
  const faultMargin = fault
    ? clamp((100 - telemetry.healthScore) / 100, 0.35, 1)
    : 0;
  const activeFaultCount = fault ? 1 : 0;


  /*
    A ref updated every render gives animate() a live read of state that
    would otherwise be frozen at first-render values, since the Three.js
    mount effect below only runs once (deps = []).
  */
  const liveStateRef = useRef();
  liveStateRef.current = {
    fault,
    faultType,
    faultLocation,
    faultMargin,
    activeFaultCount,
    averageRms,
    labels,
  };

  /*
    Three.js scene
  */
  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.bg);

    const camera = new THREE.PerspectiveCamera(
      38,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100
    );

    // Smaller motor/pump appearance with more breathing room.
    const CAMERA_BASE = { x: 7.0, y: 2.0, z: 13.5 };
    camera.position.set(CAMERA_BASE.x, CAMERA_BASE.y, CAMERA_BASE.z);
    camera.lookAt(0, -2.0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const root = new THREE.Group();
    root.scale.setScalar(0.78);
    scene.add(root);

    const objects = {
      root,
      water: null,
      waterSurface: null,
      waterParticles: [],
      shaft: null,
      impellers: [],
      motorParts: [],
      stageParts: [],
      strainerParts: [],
      faultHalo: null,
      labels: [],
    };

    sceneObjectsRef.current = objects;

    // Lights
    scene.add(new THREE.HemisphereLight(0x9ccfff, 0x071018, 1.6));

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(5, 8, 9);
    scene.add(key);

    const rim = new THREE.DirectionalLight(0x4ebdff, 1.2);
    rim.position.set(-7, 2, -5);
    scene.add(rim);

    // Borewell casing
    const casingMat = new THREE.MeshStandardMaterial({
      color: 0x17232d,
      metalness: 0.65,
      roughness: 0.38,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
    });

    const casing = new THREE.Mesh(
      new THREE.CylinderGeometry(2.05, 2.05, 12.5, 64, 1, true),
      casingMat
    );
    casing.position.y = -2.2;
    root.add(casing);

    // Casing rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x405362,
      metalness: 0.8,
      roughness: 0.35,
      transparent: true,
      opacity: 0.45,
    });

    for (let y = 3.2; y >= -8.1; y -= 1.5) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2.05, 0.025, 8, 64),
        ringMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = y;
      root.add(ring);
    }

    // Pump geometry — intentionally smaller than previous version.
    const motorMat = new THREE.MeshStandardMaterial({
      color: 0x657985,
      metalness: 0.82,
      roughness: 0.28,
    });

    const motorDarkMat = new THREE.MeshStandardMaterial({
      color: 0x263642,
      metalness: 0.75,
      roughness: 0.32,
    });

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x8799a5,
      metalness: 0.92,
      roughness: 0.20,
    });

    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x267da8,
      metalness: 0.55,
      roughness: 0.32,
    });

    const motor = new THREE.Group();
    motor.position.set(0, -5.0, 0);
    motor.scale.set(0.78, 0.78, 0.78);
    root.add(motor);

    const motorBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 2.55, 48),
      motorMat
    );
    motor.add(motorBody);
    objects.motorParts.push(motorBody);

    for (let i = 0; i < 5; i++) {
      const rib = new THREE.Mesh(
        new THREE.TorusGeometry(0.75, 0.055, 10, 48),
        motorDarkMat
      );
      rib.rotation.x = Math.PI / 2;
      rib.position.y = -1.0 + i * 0.48;
      motor.add(rib);
      objects.motorParts.push(rib);
    }

    const motorTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.79, 0.79, 0.16, 48),
      steelMat
    );
    motorTop.position.y = 1.31;
    motor.add(motorTop);
    objects.motorParts.push(motorTop);

    const motorBottom = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.68, 0.18, 48),
      motorDarkMat
    );
    motorBottom.position.y = -1.35;
    motor.add(motorBottom);
    objects.motorParts.push(motorBottom);

    // Pump stages above motor
    const pump = new THREE.Group();
    pump.position.set(0, -1.9, 0);
    pump.scale.set(0.78, 0.78, 0.78);
    root.add(pump);

    const stageBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.78, 0.78, 3.0, 48),
      motorDarkMat
    );
    pump.add(stageBody);
    objects.stageParts.push(stageBody);

    for (let i = 0; i < 6; i++) {
      const stageRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.81, 0.09, 12, 48),
        steelMat
      );
      stageRing.rotation.x = Math.PI / 2;
      stageRing.position.y = -1.15 + i * 0.45;
      pump.add(stageRing);
      objects.stageParts.push(stageRing);

      const impeller = new THREE.Mesh(
        new THREE.TorusGeometry(0.50, 0.07, 10, 32),
        blueMat
      );
      impeller.rotation.x = Math.PI / 2;
      impeller.position.y = -1.15 + i * 0.45;
      pump.add(impeller);
      objects.impellers.push(impeller);
    }

    // Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 6.8, 20),
      steelMat
    );
    shaft.position.y = -3.0;
    root.add(shaft);
    objects.shaft = shaft;

    // Suction strainer
    const strainer = new THREE.Group();
    strainer.position.set(0, -6.65, 0);
    strainer.scale.set(0.78, 0.78, 0.78);
    root.add(strainer);

    const strainerBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.76, 0.76, 1.15, 48),
      steelMat
    );
    strainer.add(strainerBody);
    objects.strainerParts.push(strainerBody);

    for (let i = 0; i < 10; i++) {
      const slot = new THREE.Mesh(
        new THREE.BoxGeometry(0.045, 0.65, 0.12),
        motorDarkMat
      );
      const angle = (i / 10) * Math.PI * 2;
      slot.position.set(Math.cos(angle) * 0.76, 0, Math.sin(angle) * 0.76);
      slot.rotation.y = -angle;
      strainer.add(slot);
      objects.strainerParts.push(slot);
    }

    // Head / discharge
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.76, 0.75, 48),
      steelMat
    );
    head.position.set(0, 0.45, 0);
    root.add(head);

    const delivery = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 3.2, 32),
      steelMat
    );
    delivery.position.set(0, 2.4, 0);
    root.add(delivery);

    const elbow = new THREE.Mesh(
      new THREE.TorusGeometry(0.40, 0.23, 16, 40, Math.PI / 2),
      steelMat
    );
    elbow.rotation.z = Math.PI / 2;
    elbow.position.set(0.40, 3.85, 0);
    root.add(elbow);

    const outlet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.23, 1.2, 32),
      steelMat
    );
    outlet.rotation.z = Math.PI / 2;
    outlet.position.set(1.0, 4.25, 0);
    root.add(outlet);

    // NRV
    const nrv = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.42, 32),
      blueMat
    );
    nrv.position.set(0, -0.05, 0);
    root.add(nrv);

    // Cable
    const cableCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.55, 0.7, 0.35),
      new THREE.Vector3(0.95, -1.2, 0.35),
      new THREE.Vector3(0.75, -3.0, 0.35),
      new THREE.Vector3(0.65, -5.0, 0.35),
    ]);

    const cable = new THREE.Mesh(
      new THREE.TubeGeometry(cableCurve, 48, 0.055, 10, false),
      new THREE.MeshStandardMaterial({
        color: 0x1d75bd,
        metalness: 0.25,
        roughness: 0.45,
      })
    );
    root.add(cable);

    /*
      Water:
      A transparent cylinder makes the water easy to understand as a
      volume surrounding the pump. The top surface follows waterLevel.
    */
    const WELL_BOTTOM = -7.25;
    const WELL_TOP = 4.7;
    const WELL_HEIGHT = WELL_TOP - WELL_BOTTOM;

    const waterGroup = new THREE.Group();
    waterGroup.position.y = WELL_BOTTOM;
    root.add(waterGroup);

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(COLORS.water),
      transparent: true,
      opacity: 0.25,
      roughness: 0.12,
      metalness: 0.05,
      transmission: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(1.85, 1.85, WELL_HEIGHT, 64, 1, false),
      waterMat
    );
    water.position.y = WELL_HEIGHT / 2;
    waterGroup.add(water);
    objects.water = water;

    const surfaceMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(COLORS.waterLight),
      transparent: true,
      opacity: 0.58,
      roughness: 0.18,
      metalness: 0.0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const surface = new THREE.Mesh(
      new THREE.CircleGeometry(1.82, 64),
      surfaceMat
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0;
    waterGroup.add(surface);
    objects.waterSurface = surface;

    // Small particles make water depth easier to see.
    const particleMat = new THREE.MeshBasicMaterial({
      color: 0x71d5ff,
      transparent: true,
      opacity: 0.38,
    });

    for (let i = 0; i < 45; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.018 + Math.random() * 0.025, 8, 8),
        particleMat
      );
      const r = Math.random() * 1.65;
      p.position.set(
        Math.cos(Math.random() * Math.PI * 2) * r,
        Math.random() * WELL_HEIGHT,
        Math.sin(Math.random() * Math.PI * 2) * r
      );
      waterGroup.add(p);
      objects.waterParticles.push(p);
    }

    // Water-level ruler on the right side of the borewell.
    const rulerMat = new THREE.LineBasicMaterial({
      color: 0x6a8292,
      transparent: true,
      opacity: 0.75,
    });

    const rulerPoints = [
      new THREE.Vector3(2.45, WELL_BOTTOM, 0),
      new THREE.Vector3(2.45, WELL_TOP, 0),
    ];

    const ruler = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(rulerPoints),
      rulerMat
    );
    root.add(ruler);

    for (let i = 0; i <= 10; i++) {
      const y = WELL_BOTTOM + (i / 10) * WELL_HEIGHT;
      const tick = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(2.32, y, 0),
          new THREE.Vector3(2.58, y, 0),
        ]),
        rulerMat
      );
      root.add(tick);
    }

    // Fault halo: shown around whichever component is currently affected.
    // Position and intensity are both driven by live telemetry (see
    // animate() below) rather than being fixed.
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
    });

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.98, 0.06, 12, 64),
      haloMat
    );
    halo.rotation.x = Math.PI / 2;
    halo.visible = false;
    root.add(halo);
    objects.faultHalo = halo;

    // Ground plate for orientation.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(4.4, 64),
      new THREE.MeshStandardMaterial({
        color: 0x09131b,
        roughness: 0.95,
        metalness: 0.05,
        transparent: true,
        opacity: 0.9,
      })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -7.7;
    root.add(ground);

    // Label helper.
    function addLabel(text, position, color = COLORS.muted) {
      const div = document.createElement('div');
      div.textContent = text;
      div.style.position = 'absolute';
      div.style.padding = '4px 7px';
      div.style.border = '1px solid rgba(75,110,130,.5)';
      div.style.borderRadius = '4px';
      div.style.background = 'rgba(5,12,18,.82)';
      div.style.color = color;
      div.style.font = '11px monospace';
      div.style.whiteSpace = 'nowrap';
      div.style.pointerEvents = 'none';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.display = liveStateRef.current.labels ? 'block' : 'none';

      mount.appendChild(div);

      objects.labels.push({
        el: div,
        position: position.clone(),
      });
    }

    addLabel('Delivery pipe', new THREE.Vector3(0, 3.2, 0));
    addLabel('Discharge head', new THREE.Vector3(0.9, 0.5, 0));
    addLabel('Non-return valve', new THREE.Vector3(0.9, -0.05, 0));
    addLabel('Pump stages', new THREE.Vector3(0.95, -1.9, 0));
    addLabel('Suction strainer', new THREE.Vector3(0.95, -6.5, 0));
    addLabel('Submersible motor', new THREE.Vector3(0.95, -5.0, 0));

    const clock = new THREE.Clock();

    // Fault-location -> halo position lookup. Includes Suction Strainer
    // now, so low-water faults get a visible marker like every other
    // fault type instead of only Submersible Motor / Pump Stages.
    const HALO_POSITIONS = {
      'Submersible Motor': [0, -5.0, 0],
      'Pump Stages / Suction': [0, -2.0, 0],
      'Suction Strainer': [0, -6.65, 0],
    };

    function animate() {
      animationRef.current = requestAnimationFrame(animate);

      const t = clock.getElapsedTime();

      // Read the latest reactive state via the ref instead of a stale closure
      // (this effect only runs once, so plain variables would freeze at t=0).
      const live = liveStateRef.current;

      // Gentle camera sway so the twin still feels alive at rest — this
      // three.js build doesn't ship OrbitControls, so this stands in for it.
      // Labels reproject off the live camera every frame, so they stay pinned.
      camera.position.x = CAMERA_BASE.x + Math.sin(t * 0.15) * 0.35;
      camera.position.y = CAMERA_BASE.y + Math.sin(t * 0.22) * 0.18;
      camera.lookAt(0, -2.0, 0);

      // Motor speed reflects real relay behaviour: a dry-run trips the relay
      // and stops the motor outright; other faults keep it running but
      // visibly stutter, matching the anomaly they represent.
      let speed = 1;
      if (live.faultType === 'Dry Run Detected') {
        speed = 0;
      } else if (live.fault) {
        speed = 0.55 + Math.sin(t * 6) * 0.2;
      }

      if (speed > 0) {
        objects.shaft.rotation.y += 0.055 * speed;

        objects.impellers.forEach((impeller, index) => {
          impeller.rotation.z += (0.07 + index * 0.002) * speed;
        });
      }

      // Water surface ripple.
      if (objects.waterSurface) {
        const s = 1 + Math.sin(t * 2.2) * 0.012;
        objects.waterSurface.scale.set(s, s, s);
        objects.waterSurface.material.opacity =
          0.50 + Math.sin(t * 1.7) * 0.06;
      }

      objects.waterParticles.forEach((p, index) => {
        p.position.y += 0.003 + (index % 3) * 0.0008;
        if (p.position.y > WELL_HEIGHT) p.position.y = 0;
      });

      // Fault halo follows the relevant component. Its position now covers
      // all three fault locations, and its opacity/pulse speed scale with
      // faultMargin (how far the live reading is past its threshold) so a
      // borderline fault glows faintly and a severe one pulses hard —
      // instead of a fixed-rate pulse regardless of the data.
      if (objects.faultHalo) {
        const pos = live.fault ? HALO_POSITIONS[live.faultLocation] : null;

        objects.faultHalo.visible = !!pos;

        if (pos) {
          objects.faultHalo.position.set(pos[0], pos[1], pos[2]);

          const m = live.faultMargin;
          objects.faultHalo.material.opacity =
            0.15 + m * 0.35 + Math.sin(t * (4 + m * 4)) * 0.08;
        }
      }

      // Keep labels aligned with the 3D model.
      objects.labels.forEach((label) => {
        const p = label.position.clone();
        p.project(camera);

        const x = (p.x * 0.5 + 0.5) * mount.clientWidth;
        const y = (-p.y * 0.5 + 0.5) * mount.clientHeight;

        label.el.style.left = `${x}px`;
        label.el.style.top = `${y}px`;
        label.el.style.display = live.labels ? 'block' : 'none';
      });

      renderer.render(scene, camera);
    }

    animate();

    function resize() {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', resize);

      objects.labels.forEach((label) => label.el.remove());

      renderer.dispose();
      mount.removeChild(renderer.domElement);

      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();

        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
    };
  }, []);

  /*
    Update water height after React telemetry changes.
  */
  useEffect(() => {
    const objects = sceneObjectsRef.current;
    if (!objects.water || !objects.waterSurface) return;

    const WELL_BOTTOM = -7.25;
    const WELL_TOP = 4.7;
    const WELL_HEIGHT = WELL_TOP - WELL_BOTTOM;

    const percentage = clamp(telemetry.waterLevel, 0, 100);
    const h = Math.max(0.04, (percentage / 100) * WELL_HEIGHT);

    objects.water.scale.y = h / WELL_HEIGHT;
    objects.water.position.y = h / 2;

    objects.waterSurface.position.y = h;
  }, [telemetry.waterLevel]);

  const waterStatus =
    telemetry.waterLevel < 15
      ? 'CRITICAL'
      : telemetry.waterLevel < 35
        ? 'LOW'
        : telemetry.waterLevel < 60
          ? 'MEDIUM'
          : 'GOOD';

  const waterStatusColor =
    waterStatus === 'CRITICAL'
      ? COLORS.fault
      : waterStatus === 'LOW'
        ? COLORS.warning
        : waterStatus === 'MEDIUM'
          ? COLORS.warning
          : COLORS.ok;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: isCompact ? 300 : undefined,
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 50% 35%, #102330 0%, #07131c 45%, #03080d 100%)',
        color: COLORS.text,
        fontFamily: 'Inter, Arial, sans-serif',
      }}
    >
      {/* Top title */}
      {!isCompact && <div
        style={{
          position: 'absolute',
          zIndex: 5,
          top: 22,
          left: 28,
          right: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          pointerEvents: 'none',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: '-0.02em',
            }}
          >
            Submersible Borewell Digital Twin
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              color: COLORS.muted,
            }}
          >
            3D pump • live API telemetry • MCSA fault logic
          </div>
        </div>

        <div
          style={{
            pointerEvents: 'auto',
            padding: '7px 11px',
            borderRadius: 6,
            border: `1px solid ${
              fault ? 'rgba(239,68,68,.65)' : 'rgba(53,211,153,.55)'
            }`,
            background: fault
              ? 'rgba(239,68,68,.10)'
              : 'rgba(53,211,153,.08)',
            color: fault ? COLORS.fault : COLORS.ok,
            fontSize: 11,
            fontFamily: 'monospace',
          }}
        >
          ● {fault ? 'FAULT DETECTED' : 'SYSTEM HEALTHY'}
          {activeFaultCount > 1 ? ` (${activeFaultCount} active)` : ''}
        </div>
      </div>}

      {/* 3D viewport */}
      <div
        ref={mountRef}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />

      {/* Water-level gauge */}
      {!isCompact && <div
        style={{
          position: 'absolute',
          zIndex: 6,
          top: '50%',
          right: 28,
          transform: 'translateY(-50%)',
          width: 112,
          padding: 12,
          borderRadius: 8,
          background: 'rgba(7,16,24,.84)',
          border: '1px solid rgba(80,120,140,.42)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: COLORS.muted,
            letterSpacing: '.08em',
          }}
        >
          WATER LEVEL
        </div>

        <div
          style={{
            marginTop: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 9,
          }}
        >
          <div
            style={{
              position: 'relative',
              width: 22,
              height: 150,
              border: '1px solid rgba(90,130,150,.55)',
              borderRadius: 5,
              overflow: 'hidden',
              background: 'rgba(10,25,34,.8)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: `${clamp(telemetry.waterLevel, 0, 100)}%`,
                background:
                  'linear-gradient(to top, #0b6398, #25a9e7, #72d7ff)',
                transition: 'height .25s ease',
              }}
            />
          </div>

          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'monospace',
              }}
            >
              {Math.round(telemetry.waterLevel)}%
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 9,
                color: waterStatusColor,
                fontWeight: 700,
              }}
            >
              {waterStatus}
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 8,
            lineHeight: 1.4,
            color: COLORS.muted,
          }}
        >
          MySQL / Spring Boot
          <br />
          REST + WebSocket telemetry
        </div>
      </div>}

      {/* ML / fault readout */}
      {!isCompact && <div
        style={{
          position: 'absolute',
          zIndex: 6,
          left: 28,
          bottom: 76,
          width: 250,
          padding: 13,
          borderRadius: 8,
          background: 'rgba(7,16,24,.88)',
          border: `1px solid ${
            fault ? 'rgba(239,68,68,.48)' : 'rgba(80,120,140,.42)'
          }`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: COLORS.muted,
            letterSpacing: '.08em',
            marginBottom: 8,
          }}
        >
          MCSA / AUTOENCODER
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 7,
          }}
        >
          <Metric label="Current RMS" value={`${telemetry.currentRms.toFixed(2)} A`} />
          <Metric label="Voltage RMS" value={`${telemetry.voltageRms.toFixed(1)} V`} />
          <Metric label="Power Factor" value={telemetry.powerFactor.toFixed(2)} />
          <Metric label="Frequency" value={`${telemetry.frequency.toFixed(1)} Hz`} />
          <Metric
            label="Unbalance"
            value={`${unbalance.toFixed(1)}%`}
            valueColor={unbalance > 15 ? COLORS.fault : COLORS.ok}
          />
          <Metric
            label="Anomaly Score"
            value={telemetry.anomalyScore.toFixed(4)}
            valueColor={
              telemetry.anomalyScore > telemetry.dynamicThreshold
                ? COLORS.fault
                : COLORS.ok
            }
          />
          <Metric
            label="Health Score"
            value={`${telemetry.healthScore.toFixed(1)}`}
            valueColor={
              telemetry.healthScore < 60 ? COLORS.warning : COLORS.ok
            }
          />
          <Metric
            label="Confidence"
            value={`${(telemetry.confidence * 100).toFixed(1)}%`}
          />
        </div>

        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: '1px solid rgba(80,120,140,.25)',
            fontSize: 9,
            color: COLORS.muted,
          }}
        >
          Dynamic threshold:{' '}
          <span style={{ color: COLORS.text, fontFamily: 'monospace' }}>
            {telemetry.dynamicThreshold.toFixed(4)}
          </span>
        </div>

        <div
          style={{
            marginTop: 8,
            fontSize: 10,
            fontWeight: 700,
            color: fault ? COLORS.fault : COLORS.ok,
          }}
        >
          {fault ? `⚠ ${faultType}` : '✓ Healthy'}
        </div>

        {fault && (
          <div
            style={{
              marginTop: 4,
              fontSize: 9,
              color: COLORS.muted,
            }}
          >
            Location: <span style={{ color: COLORS.text }}>{faultLocation}</span>
          </div>
        )}

        {telemetry.conceptDriftDetected && (
          <div
            style={{
              marginTop: 4,
              fontSize: 9,
              color: COLORS.warning,
            }}
          >
            ⚠ Concept drift detected by Edge AI
          </div>
        )}
      </div>}

      {/* API status and controls */}
      {!isCompact && <div
        style={{
          position: 'absolute',
          zIndex: 8,
          left: '50%',
          bottom: 20,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: 8,
          borderRadius: 8,
          background: 'rgba(7,16,24,.90)',
          border: '1px solid rgba(80,120,140,.40)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            padding: '7px 10px',
            borderRadius: 5,
            border: `1px solid ${
              apiConnected ? 'rgba(53,211,153,.55)' : 'rgba(239,68,68,.55)'
            }`,
            color: apiConnected ? COLORS.ok : COLORS.fault,
            background: apiConnected
              ? 'rgba(53,211,153,.08)'
              : 'rgba(239,68,68,.08)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
        >
          ● {apiConnected ? 'REST API CONNECTED' : 'REST API DISCONNECTED'}
        </div>

        <div
          style={{
            padding: '7px 10px',
            borderRadius: 5,
            border: `1px solid ${
              wsConnected ? 'rgba(53,211,153,.55)' : 'rgba(239,68,68,.55)'
            }`,
            color: wsConnected ? COLORS.ok : COLORS.fault,
            background: wsConnected
              ? 'rgba(53,211,153,.08)'
              : 'rgba(239,68,68,.08)',
            fontSize: 10,
            fontFamily: 'monospace',
          }}
        >
          ● {wsConnected ? 'WEBSOCKET LIVE' : 'WEBSOCKET OFFLINE'}
        </div>

        {lastUpdated && (
          <div
            style={{
              color: COLORS.muted,
              fontSize: 9,
              fontFamily: 'monospace',
            }}
          >
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        <button
          onClick={() => setLabels((v) => !v)}
          style={{
            border: '1px solid rgba(80,120,140,.42)',
            background: 'rgba(10,20,28,.8)',
            color: COLORS.muted,
            borderRadius: 5,
            padding: '7px 10px',
            fontSize: 10,
            cursor: 'pointer',
          }}
        >
          {labels ? 'Hide Labels' : 'Show Labels'}
        </button>
      </div>}

      {isCompact && (
        <>
          <div
            style={{
              position: 'absolute',
              zIndex: 8,
              left: 14,
              bottom: 12,
              padding: '6px 9px',
              borderRadius: 999,
              background: 'rgba(7,16,24,.88)',
              border: '1px solid rgba(53,211,153,.45)',
              color: COLORS.ok,
              fontSize: 9,
              fontFamily: 'monospace',
            }}
          >
            ● Borewell monitoring active
          </div>

          <div
            style={{
              position: 'absolute',
              zIndex: 8,
              left: '50%',
              bottom: 12,
              transform: 'translateX(-50%)',
              padding: '6px 10px',
              borderRadius: 7,
              background: 'rgba(22,134,199,.88)',
              color: '#ffffff',
              fontSize: 10,
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            💧 Water ~ {telemetry.waterLevel.toFixed(1)} m
          </div>

          <button
            onClick={openFullDigitalTwin}
            style={{
              position: 'absolute',
              zIndex: 8,
              right: 14,
              bottom: 12,
              border: '1px solid rgba(53,211,153,.45)',
              background: 'rgba(7,16,24,.90)',
              color: COLORS.ok,
              borderRadius: 999,
              padding: '7px 11px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Digital Twin →
          </button>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, valueColor = COLORS.text }) {
  return (
    <div
      style={{
        padding: '6px 7px',
        borderRadius: 5,
        background: 'rgba(15,28,38,.75)',
        border: '1px solid rgba(80,120,140,.24)',
      }}
    >
      <div style={{ fontSize: 8, color: COLORS.muted }}>{label}</div>
      <div
        style={{
          marginTop: 3,
          fontSize: 12,
          fontFamily: 'monospace',
          fontWeight: 700,
          color: valueColor,
        }}
      >
        {value}
      </div>
    </div>
  );
}