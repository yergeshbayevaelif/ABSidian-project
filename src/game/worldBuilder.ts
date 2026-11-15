import * as THREE from 'three';
import {
  BuildingInstance,
  PrologueSystems,
  SceneWorldId,
  TimeOfDay,
  WorldInteractable,
} from '../types/game';
import {
  createAestheticStationProp,
  createCatAstronautModel,
  createCockpitSeatProp,
  createCrewBusModel,
  createDeskProp,
  createFlightRocketExterior,
  createHydroPlanterProp,
  createModularBaseBuilding,
  createNasaRocketModel,
  createServerRackProp,
} from './models';
import {
  getNasaLogoTexture,
  getSciFiFloorTexture,
  getTerrainTexture,
  StationIconKind,
} from './textures';

export interface CollisionBox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface BuiltWorld {
  root: THREE.Group;
  collisions: CollisionBox[];
  interactables: WorldInteractable[];
  bounds: number;
  spawn: { x: number; z: number };
  animatedProps: Array<(time: number, dt: number) => void>;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  spaceMotionUpdate?: (steerX: number, steerY: number, dt: number, elapsed: number, exteriorView: boolean) => void;
}

function addWall(
  root: THREE.Group,
  collisions: CollisionBox[],
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  solid = true
) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  root.add(mesh);
  if (solid) {
    collisions.push({
      minX: x - w / 2 - 0.35,
      maxX: x + w / 2 + 0.35,
      minZ: z - d / 2 - 0.35,
      maxZ: z + d / 2 + 0.35,
    });
  }
  return mesh;
}

function addGlowingWindowWall(
  root: THREE.Group,
  collisions: CollisionBox[],
  x: number,
  z: number,
  w: number,
  d: number,
  frameMat: THREE.Material,
  accentHex = '#38bdf8'
) {
  addWall(root, collisions, x, 0.75, z, w, 1.5, d, frameMat, true);
  addWall(root, collisions, x, 3.6, z, w, 0.8, d, frameMat, false);
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(Math.max(0.12, w - 0.2), 1.35, Math.max(0.12, d - 0.2)),
    new THREE.MeshPhysicalMaterial({
      color: accentHex,
      transparent: true,
      opacity: 0.24,
      roughness: 0.1,
    })
  );
  glass.position.set(x, 2.2, z);
  root.add(glass);
}

function addFloorGuideStrip(root: THREE.Group, x1: number, z1: number, x2: number, z2: number, color: string) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(0.28, len),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.42 })
  );
  strip.rotation.x = -Math.PI / 2;
  strip.rotation.z = Math.atan2(dx, dz);
  strip.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
  root.add(strip);
}

function addMarkerRing(
  root: THREE.Group,
  x: number,
  z: number,
  color: string,
  animatedProps: BuiltWorld['animatedProps']
) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(1.05, 1.32, 28),
    new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(x, 0.03, z);
  root.add(ring);
  animatedProps.push((time) => {
    const s = 1 + Math.sin(time * 3.2) * 0.07;
    ring.scale.set(s, s, 1);
  });
}

function placeStation(
  root: THREE.Group,
  collisions: CollisionBox[],
  animatedProps: BuiltWorld['animatedProps'],
  x: number,
  z: number,
  iconKind: StationIconKind,
  accentHex: string,
  completed: boolean,
  rotY = 0
) {
  const { group, holoBadge } = createAestheticStationProp(iconKind, accentHex, completed);
  group.position.set(x, 0, z);
  group.rotation.y = rotY;
  root.add(group);
  collisions.push({ minX: x - 1.35, maxX: x + 1.35, minZ: z - 1.15, maxZ: z + 1.15 });
  animatedProps.push((time) => {
    holoBadge.rotation.y = time * 1.4;
    holoBadge.position.y = 3.05 + Math.sin(time * 2.4) * 0.12;
  });
}

function addStarfield(root: THREE.Group, count = 420) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 1.4 - 0.4);
    const r = 95 + Math.random() * 25;
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 6;
    pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const tint = 0.75 + Math.random() * 0.25;
    colors[i * 3] = tint;
    colors[i * 3 + 1] = tint;
    colors[i * 3 + 2] = 1.0;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const pts = new THREE.Points(
    geo,
    new THREE.PointsMaterial({ size: 0.7, vertexColors: true, transparent: true, opacity: 0.9 })
  );
  root.add(pts);
}

export function buildSceneWorld(
  sceneId: SceneWorldId,
  options: {
    prologue: PrologueSystems;
    buildings: BuildingInstance[];
    completedMissions: string[];
    timeOfDay: TimeOfDay;
    isSoftwareGl: boolean;
  }
): BuiltWorld {
  const root = new THREE.Group();
  const collisions: CollisionBox[] = [];
  const interactables: WorldInteractable[] = [];
  const animatedProps: BuiltWorld['animatedProps'] = [];

  let bounds = 24;
  let spawn = { x: 0, z: 6 };
  let skyColor = new THREE.Color('#090e1a');
  let fogColor = new THREE.Color('#090e1a');
  let fogDensity = 0.012;
  let spaceMotionUpdate: BuiltWorld['spaceMotionUpdate'] = undefined;

  const metalWall = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.48, metalness: 0.52 });
  const lightWall = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.42, metalness: 0.25 });
  const trimWall = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.4, metalness: 0.5 });

  if (sceneId === 'lab_2140') {
    bounds = 15.2;
    spawn = { x: 0, z: 9.5 };
    const stabilized = options.prologue.stabilized;
    skyColor = new THREE.Color(stabilized ? '#0f172a' : '#120a12');
    fogColor = skyColor.clone();
    fogDensity = 0.012;

    const floorTex = getSciFiFloorTexture(stabilized ? 'lab_lit' : 'lab_dark');
    floorTex.repeat.set(9, 9);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.55, metalness: 0.25 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    root.add(floor);

    // Outer Architectural Lab Walls
    addWall(root, collisions, 0, 2.4, -15, 32, 4.8, 0.8, metalWall);
    addWall(root, collisions, 0, 2.4, 15, 32, 4.8, 0.8, metalWall);
    addWall(root, collisions, -15, 2.4, 0, 0.8, 4.8, 30, metalWall);
    addWall(root, collisions, 15, 2.4, 0, 0.8, 4.8, 30, metalWall);

    // Interior Walled Rooms & Glass Partitions separating North Generator Wing from Lobby!
    addGlowingWindowWall(root, collisions, -9.5, -1.5, 9.8, 0.45, trimWall, '#f59e0b');
    addGlowingWindowWall(root, collisions, 9.5, -1.5, 9.8, 0.45, trimWall, '#22d3ee');
    // Overhead Beam Archway
    addWall(root, collisions, 0, 4.1, -1.5, 10, 0.8, 0.6, metalWall, false);

    // Interior Furniture: Server Racks, Desks, Planters
    [
      { x: -13.2, z: -12 },
      { x: -11.5, z: -12 },
      { x: 13.2, z: -12 },
    ].forEach((pos) => {
      const rack = createServerRackProp(stabilized ? '#22c55e' : '#ef4444');
      rack.position.set(pos.x, 0, pos.z);
      root.add(rack);
      collisions.push({ minX: pos.x - 0.8, maxX: pos.x + 0.8, minZ: pos.z - 0.7, maxZ: pos.z + 0.7 });
    });

    const labDesk = createDeskProp('#38bdf8');
    labDesk.position.set(11.5, 0, 8.5);
    labDesk.rotation.y = -Math.PI / 4;
    root.add(labDesk);
    collisions.push({ minX: 10.2, maxX: 12.8, minZ: 7.3, maxZ: 9.7 });

    [
      { x: -12.5, z: 12 },
      { x: 12.5, z: 12 },
    ].forEach((p) => {
      const plant = createHydroPlanterProp();
      plant.position.set(p.x, 0, p.z);
      root.add(plant);
      collisions.push({ minX: p.x - 0.7, maxX: p.x + 0.7, minZ: p.z - 0.7, maxZ: p.z + 0.7 });
    });

    // Deck guide strips
    addFloorGuideStrip(root, 0, 9, -8, -4.5, '#f59e0b');
    addFloorGuideStrip(root, 0, 9, 8, -4.5, '#22d3ee');
    addFloorGuideStrip(root, 0, 9, 0, -6.5, '#38bdf8');

    const labLight = new THREE.PointLight(stabilized ? '#e0f2fe' : '#fb7185', stabilized ? 3.8 : 2.8, 38, 1.1);
    labLight.position.set(0, 4.8, 0);
    root.add(labLight);
    if (!stabilized) {
      animatedProps.push((t) => {
        labLight.intensity = 1.9 + Math.sin(t * 5) * 0.7;
      });
    }

    // 1. Wiring / Generator Repair Station (NW Room)
    placeStation(root, collisions, animatedProps, -8, -7.5, 'power', '#f59e0b', options.prologue.generatorRepaired);
    addMarkerRing(root, -8, -4.8, options.prologue.generatorRepaired ? '#22c55e' : '#f59e0b', animatedProps);
    interactables.push({
      id: 'lab_generator',
      sceneId: 'lab_2140',
      x: -8,
      y: 0,
      z: -4.8,
      radius: 2.8,
      labelEn: 'Fix Generator Wiring (+45 Coins)',
      labelRu: 'Починить провода генератора (+45 🪙)',
      kind: 'repair',
      completed: options.prologue.generatorRepaired,
    });

    // 2. Ventilation Fan Filter Chute (NE Room)
    placeStation(root, collisions, animatedProps, 8, -7.5, 'fan', '#22d3ee', options.prologue.ventCleared);
    addMarkerRing(root, 8, -4.8, options.prologue.ventCleared ? '#22c55e' : '#22d3ee', animatedProps);
    interactables.push({
      id: 'lab_vent_clean',
      sceneId: 'lab_2140',
      x: 8,
      y: 0,
      z: -4.8,
      radius: 2.8,
      labelEn: 'Clear Ventilation Filter (+45 Coins)',
      labelRu: 'Очистить вентиляцию от листьев (+45 🪙)',
      kind: 'repair',
      completed: options.prologue.ventCleared,
    });

    // 3. Emergency Power Breaker Console (North Center)
    placeStation(root, collisions, animatedProps, 0, -10.2, 'radar', '#38bdf8', stabilized);
    addMarkerRing(root, 0, -7.5, stabilized ? '#22c55e' : '#38bdf8', animatedProps);
    interactables.push({
      id: 'lab_power_console',
      sceneId: 'lab_2140',
      x: 0,
      y: 0,
      z: -7.5,
      radius: 2.9,
      labelEn: 'Divert Power Breakers (+60 Coins)',
      labelRu: 'Настроить щиток питания (+60 🪙)',
      kind: 'terminal',
      completed: stabilized,
    });

    // Technician Cat NPC (West Lobby)
    const techCat = createCatAstronautModel('ginger_white', '#f1f5f9', '#f59e0b', options.isSoftwareGl, {
      wearingSuit: false,
    });
    techCat.group.position.set(-7.5, 0, 4.5);
    techCat.group.rotation.y = Math.PI / 3;
    root.add(techCat.group);
    addMarkerRing(root, -7.5, 4.5, '#38bdf8', animatedProps);
    interactables.push({
      id: 'lab_tech_npc',
      sceneId: 'lab_2140',
      x: -7.5,
      y: 0,
      z: 4.5,
      radius: 2.8,
      labelEn: 'Talk to Technician Whiskers',
      labelRu: 'Поговорить с техником Барсиком',
      kind: 'npc',
    });

    // Exit Door to Academy (South Wall)
    const doorGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 3.0),
      new THREE.MeshBasicMaterial({ color: stabilized ? '#22c55e' : '#475569' })
    );
    doorGlow.position.set(0, 1.6, 14.5);
    doorGlow.rotation.y = Math.PI;
    root.add(doorGlow);
    if (stabilized) {
      addMarkerRing(root, 0, 12.2, '#22c55e', animatedProps);
      interactables.push({
        id: 'lab_exit_academy',
        sceneId: 'lab_2140',
        x: 0,
        y: 0,
        z: 12.2,
        radius: 2.8,
        labelEn: 'Enter ABSIDIAN Academy',
        labelRu: 'Отправиться в Академию ABSIDIAN',
        kind: 'door',
      });
    }
  } else if (sceneId === 'academy') {
    bounds = 27.5;
    spawn = { x: 0, z: 20 };
    skyColor = new THREE.Color(options.timeOfDay === 'night' ? '#070b18' : options.timeOfDay === 'twilight' ? '#1e293b' : '#38bdf8');
    fogColor = skyColor.clone();
    fogDensity = 0.007;
    addStarfield(root, options.timeOfDay === 'daylight' ? 80 : 320);

    const campusTex = getSciFiFloorTexture('academy');
    campusTex.repeat.set(16, 16);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ map: campusTex, roughness: 0.65, metalness: 0.2 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    // Outer Perimeter Complex Walls (NO empty infinite void!)
    addWall(root, collisions, 0, 2.6, -28, 58, 5.2, 1, metalWall);
    addWall(root, collisions, 0, 2.6, 28, 58, 5.2, 1, metalWall);
    addWall(root, collisions, -28, 2.6, 0, 1, 5.2, 56, metalWall);
    addWall(root, collisions, 28, 2.6, 0, 1, 5.2, 56, metalWall);

    // Walled 4 Training Lab Bays with Glass View Windows & Open Doorways!
    // NW Bay (-27..-11, z -13..2)
    addGlowingWindowWall(root, collisions, -19, 2, 16, 0.5, trimWall, '#38bdf8');
    addWall(root, collisions, -11, 2.2, -9.5, 0.5, 4.4, 7, lightWall);
    // NE Bay (11..27, z -13..2)
    addGlowingWindowWall(root, collisions, 19, 2, 16, 0.5, trimWall, '#a855f7');
    addWall(root, collisions, 11, 2.2, -9.5, 0.5, 4.4, 7, lightWall);
    // SW Bay (-27..-11, z -26..-12)
    addWall(root, collisions, -19, 2.2, -11.5, 16, 4.4, 0.5, lightWall);
    addGlowingWindowWall(root, collisions, -11, -21, 0.5, 11, trimWall, '#ef4444');
    // SE Bay (11..27, z -26..-12)
    addWall(root, collisions, 19, 2.2, -11.5, 16, 4.4, 0.5, lightWall);
    addGlowingWindowWall(root, collisions, 11, -21, 0.5, 11, trimWall, '#22c55e');

    // Furnished Interiors inside the bays & central lounge!
    [
      { x: -24, z: -2 },
      { x: 24, z: -2 },
      { x: -24, z: -24 },
      { x: 24, z: -24 },
    ].forEach((p) => {
      const desk = createDeskProp('#38bdf8');
      desk.position.set(p.x, 0, p.z);
      root.add(desk);
      collisions.push({ minX: p.x - 1.4, maxX: p.x + 1.4, minZ: p.z - 0.8, maxZ: p.z + 0.8 });
    });

    [
      { x: -6, z: 22 },
      { x: 6, z: 22 },
      { x: -6, z: -4 },
      { x: 6, z: -4 },
    ].forEach((p) => {
      const plant = createHydroPlanterProp();
      plant.position.set(p.x, 0, p.z);
      root.add(plant);
      collisions.push({ minX: p.x - 0.7, maxX: p.x + 0.7, minZ: p.z - 0.7, maxZ: p.z + 0.7 });
    });

    // NASA Academy Monument
    const monument = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.0, 0.6), metalWall);
    monument.position.set(0, 1.5, 12);
    root.add(monument);
    const nasaLogoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.1, 2.1),
      new THREE.MeshBasicMaterial({ map: getNasaLogoTexture(), transparent: true })
    );
    nasaLogoPlane.position.set(0, 1.65, 12.35);
    root.add(nasaLogoPlane);
    collisions.push({ minX: -2.6, maxX: 2.6, minZ: 11.2, maxZ: 12.8 });

    // Program Director Nova Cat (Casual Uniform)
    const director = createCatAstronautModel('tuxedo', '#1e293b', '#f59e0b', options.isSoftwareGl, {
      wearingSuit: false,
    });
    director.group.position.set(0, 0, 6);
    root.add(director.group);
    addMarkerRing(root, 0, 6, '#f59e0b', animatedProps);
    interactables.push({
      id: 'academy_director',
      sceneId: 'academy',
      x: 0,
      y: 0,
      z: 6,
      radius: 3.0,
      labelEn: 'Talk to Director Nova',
      labelRu: 'Поговорить с директором Новой',
      kind: 'npc',
    });

    // Suit Locker Room Station (Put on / Take off Spacesuit!)
    placeStation(root, collisions, animatedProps, -14, 16, 'shield', '#f59e0b', false);
    addMarkerRing(root, -14, 18.6, '#f59e0b', animatedProps);
    interactables.push({
      id: 'academy_suit_up',
      sceneId: 'academy',
      x: -14,
      y: 0,
      z: 18.6,
      radius: 3.0,
      labelEn: 'Suit Locker: Put On / Remove Spacesuit',
      labelRu: 'Гардероб: Надеть / Снять скафандр',
      kind: 'terminal',
    });

    // Security Card Check-In Gate
    const cardDone = options.completedMissions.includes('academy_card');
    placeStation(root, collisions, animatedProps, -7.5, 10, 'card', '#f59e0b', cardDone);
    addMarkerRing(root, -7.5, 12.4, cardDone ? '#22c55e' : '#f59e0b', animatedProps);
    interactables.push({
      id: 'academy_card',
      sceneId: 'academy',
      x: -7.5,
      y: 0,
      z: 12.4,
      radius: 2.8,
      labelEn: 'Swipe Astronaut ID Card (+40 Coins)',
      labelRu: 'Провести карту допуска (+40 🪙)',
      kind: 'terminal',
      completed: cardDone,
    });

    // 4 Walled Training Labs!
    const labs: Array<{
      id: string;
      x: number;
      z: number;
      color: string;
      icon: StationIconKind;
      labelEn: string;
      labelRu: string;
    }> = [
      { id: 'train_software', x: -18, z: -5, color: '#38bdf8', icon: 'code', labelEn: 'Flight Code Lab (+45 Coins)', labelRu: 'Лаборатория ПО (+45 🪙)' },
      { id: 'train_orbital', x: 18, z: -5, color: '#a855f7', icon: 'course', labelEn: 'Course Plotting (+45 Coins)', labelRu: 'Курс полёта (+45 🪙)' },
      { id: 'train_emergency', x: -18, z: -20, color: '#ef4444', icon: 'radar', labelEn: 'Vacuum Ring Test [Suit!] (+55 Coins)', labelRu: 'Вакуум-камера [Скафандр!] (+55 🪙)' },
      { id: 'train_habitat', x: 18, z: -20, color: '#22c55e', icon: 'shield', labelEn: 'Shield Prep (+70 Coins)', labelRu: 'Защита и щиты (+70 🪙)' },
    ];

    labs.forEach((lab) => {
      const done = options.completedMissions.includes(lab.id);
      addFloorGuideStrip(root, 0, 6, lab.x, lab.z + 2.8, lab.color);
      placeStation(root, collisions, animatedProps, lab.x, lab.z, lab.icon, lab.color, done);
      addMarkerRing(root, lab.x, lab.z + 2.8, done ? '#22c55e' : lab.color, animatedProps);
      interactables.push({
        id: lab.id,
        sceneId: 'academy',
        x: lab.x,
        y: 0,
        z: lab.z + 2.8,
        radius: 3.0,
        labelEn: lab.labelEn,
        labelRu: lab.labelRu,
        kind: 'terminal',
        completed: done,
      });
    });

    // Mission Control Hologram Table
    placeStation(root, collisions, animatedProps, 0, -14, 'rocket', '#06b6d4', false);
    addMarkerRing(root, 0, -11.2, '#06b6d4', animatedProps);
    interactables.push({
      id: 'academy_mission_control',
      sceneId: 'academy',
      x: 0,
      y: 0,
      z: -11.2,
      radius: 3.2,
      labelEn: 'Mission Control & Cargo Planner',
      labelRu: 'Центр управления и проект миссии',
      kind: 'terminal',
    });

    // NASA Data Research Terminal
    placeStation(root, collisions, animatedProps, 7.5, 10, 'download', '#38bdf8', false);
    addMarkerRing(root, 7.5, 12.4, '#38bdf8', animatedProps);
    interactables.push({
      id: 'academy_nasa_terminal',
      sceneId: 'academy',
      x: 7.5,
      y: 0,
      z: 12.4,
      radius: 2.8,
      labelEn: 'Real NASA Space Weather Terminal',
      labelRu: 'Терминал данных NASA',
      kind: 'terminal',
    });

    // Parked NASA Crew Transfer Bus at East Gate!
    const crewBus = createCrewBusModel();
    crewBus.position.set(19, 0, 19);
    crewBus.rotation.y = Math.PI / 2;
    root.add(crewBus);
    collisions.push({ minX: 14.5, maxX: 23.5, minZ: 17, maxZ: 21 });
    addFloorGuideStrip(root, 0, 18, 16, 15.5, '#f97316');
    addMarkerRing(root, 16, 15.5, '#f97316', animatedProps);
    interactables.push({
      id: 'academy_bus_board',
      sceneId: 'academy',
      x: 16,
      y: 0,
      z: 15.5,
      radius: 3.2,
      labelEn: 'Put On Suits & Board Crew Bus to Spaceport',
      labelRu: 'Надеть скафандр и сесть в автобус на Космодром',
      kind: 'door',
    });
  } else if (sceneId === 'launchpad') {
    bounds = 25;
    spawn = { x: 0, z: 16 };
    skyColor = new THREE.Color('#0c192c');
    fogColor = skyColor.clone();
    fogDensity = 0.008;
    addStarfield(root, 260);

    const padTex = getSciFiFloorTexture('launchpad');
    padTex.repeat.set(14, 14);
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 60),
      new THREE.MeshStandardMaterial({ map: padTex, roughness: 0.7 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    root.add(ground);

    // Walled Spaceport Perimeter Blast Walls
    addWall(root, collisions, 0, 2.5, -25.5, 52, 5, 1, metalWall);
    addWall(root, collisions, 0, 2.5, 25.5, 52, 5, 1, metalWall);
    addWall(root, collisions, -25.5, 2.5, 0, 1, 5, 52, metalWall);
    addWall(root, collisions, 25.5, 2.5, 0, 1, 5, 52, metalWall);

    // South Spaceport Bus Arrival Terminal Walls
    addGlowingWindowWall(root, collisions, -12, 12, 12, 0.5, trimWall, '#f59e0b');
    addGlowingWindowWall(root, collisions, 12, 12, 12, 0.5, trimWall, '#f59e0b');

    // Parked Crew Transfer Bus that just dropped off the crew!
    const padBus = createCrewBusModel();
    padBus.position.set(14, 0, 19);
    padBus.rotation.y = -Math.PI / 2;
    root.add(padBus);
    collisions.push({ minX: 9.5, maxX: 18.5, minZ: 17, maxZ: 21 });

    // NASA Rocket + Launch Service Gantry Tower
    const rocket = createNasaRocketModel();
    rocket.position.set(0, 0.5, -9);
    root.add(rocket);
    collisions.push({ minX: -2.8, maxX: 2.8, minZ: -11.8, maxZ: -6.2 });

    addWall(root, collisions, -4.6, 7, -9, 2.2, 14, 2.2, metalWall);
    // Walk-up Gantry Ramp Walkway to Hatch
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.3, 6), trimWall);
    ramp.position.set(0, 0.15, -3.5);
    root.add(ramp);

    // Fueling Station
    const fuelDone = options.completedMissions.includes('launchpad_fuel');
    placeStation(root, collisions, animatedProps, 8, 3.5, 'fuel', '#f97316', fuelDone);
    addMarkerRing(root, 8, 6.2, fuelDone ? '#22c55e' : '#f97316', animatedProps);
    interactables.push({
      id: 'launchpad_fuel',
      sceneId: 'launchpad',
      x: 8,
      y: 0,
      z: 6.2,
      radius: 2.8,
      labelEn: 'Fuel Rocket Engines (+50 Coins)',
      labelRu: 'Заправить ракету топливом (+50 🪙)',
      kind: 'terminal',
      completed: fuelDone,
    });

    // Keypad Pre-Flight PIN Station
    const codeDone = options.completedMissions.includes('launchpad_keypad');
    placeStation(root, collisions, animatedProps, -8, 3.5, 'shield', '#38bdf8', codeDone);
    addMarkerRing(root, -8, 6.2, codeDone ? '#22c55e' : '#38bdf8', animatedProps);
    interactables.push({
      id: 'launchpad_keypad',
      sceneId: 'launchpad',
      x: -8,
      y: 0,
      z: 6.2,
      radius: 2.8,
      labelEn: 'Enter Launch Clearance Code (+45 Coins)',
      labelRu: 'Ввести код допуска запуска (+45 🪙)',
      kind: 'terminal',
      completed: codeDone,
    });

    // Climb Into Rocket & Sit Inside Cabin!
    addFloorGuideStrip(root, 0, 16, 0, -2.5, '#22c55e');
    addMarkerRing(root, 0, -2.5, '#22c55e', animatedProps);
    interactables.push({
      id: 'launchpad_board',
      sceneId: 'launchpad',
      x: 0,
      y: 0,
      z: -2.5,
      radius: 3.2,
      labelEn: 'Climb Into Rocket & Take Your Seat!',
      labelRu: 'Залезть в ракету и занять место внутри!',
      kind: 'rocket',
    });
  } else if (sceneId === 'spacecraft') {
    bounds = 9.5;
    spawn = { x: 2.6, z: -3.2 };
    skyColor = new THREE.Color('#04030c');
    fogColor = skyColor.clone();
    fogDensity = 0.003;
    addStarfield(root, 650);

    // Exterior Cosmos Group (Earth, Moon, Black Hole & Streaming Asteroids/Buoys!)
    const cosmosGroup = new THREE.Group();
    root.add(cosmosGroup);

    const bhGroup = new THREE.Group();
    bhGroup.position.set(0, 8, -72);
    const core = new THREE.Mesh(new THREE.SphereGeometry(6.2, 24, 24), new THREE.MeshBasicMaterial({ color: '#000000' }));
    bhGroup.add(core);
    const disk = new THREE.Mesh(
      new THREE.RingGeometry(7.2, 16, 48),
      new THREE.MeshBasicMaterial({ color: '#fbbf24', side: THREE.DoubleSide, transparent: true, opacity: 0.88 })
    );
    disk.rotation.x = Math.PI / 2.3;
    bhGroup.add(disk);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(6.4, 9.2, 48),
      new THREE.MeshBasicMaterial({ color: '#fde68a', side: THREE.DoubleSide, transparent: true, opacity: 0.72 })
    );
    bhGroup.add(halo);
    cosmosGroup.add(bhGroup);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(6.2, 24, 24),
      new THREE.MeshStandardMaterial({ color: '#2563eb', emissive: '#1d4ed8', emissiveIntensity: 0.48, roughness: 0.5 })
    );
    earth.position.set(24, 6, -34);
    cosmosGroup.add(earth);

    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(4.4, 22, 22),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.85 })
    );
    moon.position.set(-18, 7, -40);
    cosmosGroup.add(moon);

    // Streaming Space Asteroids & Orbital Beacons flying past the ship!
    const asteroids: THREE.Mesh[] = [];
    const rockGeo = new THREE.DodecahedronGeometry(0.8, 0);
    const rockMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.9 });
    const starStreakMat = new THREE.MeshBasicMaterial({ color: '#7dd3fc' });
    for (let i = 0; i < 24; i++) {
      const isStreak = i % 2 === 0;
      const m = new THREE.Mesh(
        isStreak ? new THREE.BoxGeometry(0.08, 0.08, 3.6) : rockGeo,
        isStreak ? starStreakMat : rockMat
      );
      m.position.set(
        ((i * 17) % 52) - 26,
        ((i * 11) % 24) - 4,
        -15 - ((i * 9) % 75)
      );
      if (Math.abs(m.position.x) < 6 && Math.abs(m.position.y - 3) < 4) {
        m.position.x += m.position.x >= 0 ? 9 : -9;
      }
      if (!isStreak) m.scale.setScalar(0.6 + (i % 4) * 0.35);
      cosmosGroup.add(m);
      asteroids.push(m);
    }

    // Exterior ABSIDIAN-1 Flying Rocket (shown when player toggles Exterior Flight Camera!)
    const extRocket = createFlightRocketExterior();
    extRocket.group.rotation.x = -Math.PI / 2;
    extRocket.group.position.set(0, 2.5, -14);
    extRocket.legsGroup.visible = false;
    extRocket.group.visible = false;
    root.add(extRocket.group);

    // Interior Cabin Group (hidden in Exterior camera so player sees rocket flying through open space!)
    const cabinGroup = new THREE.Group();
    root.add(cabinGroup);

    const cabinTex = getSciFiFloorTexture('spacecraft');
    cabinTex.repeat.set(5, 8);
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(15, 22),
      new THREE.MeshStandardMaterial({ map: cabinTex, roughness: 0.45, metalness: 0.25 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    cabinGroup.add(floor);

    addWall(cabinGroup, collisions, -7.2, 2.2, 0, 0.8, 4.4, 22, metalWall);
    addWall(cabinGroup, collisions, 7.2, 2.2, 0, 0.8, 4.4, 22, metalWall);
    addWall(cabinGroup, collisions, 0, 2.2, 10.6, 15, 4.4, 0.8, metalWall);
    addWall(cabinGroup, collisions, 0, 0.65, -9.8, 15, 1.3, 0.9, trimWall);
    [-6, -2, 2, 6].forEach((zPos) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.35, 0.4), trimWall);
      beam.position.set(0, 4.3, zPos);
      cabinGroup.add(beam);
    });

    const rackL = createServerRackProp('#22d3ee');
    rackL.position.set(-6.1, 0, 4.5);
    cabinGroup.add(rackL);
    const plantR = createHydroPlanterProp();
    plantR.position.set(5.8, 0, 4.5);
    cabinGroup.add(plantR);

    const seatFL = createCockpitSeatProp('#2563eb');
    seatFL.position.set(-2.6, 0, -5.8);
    seatFL.rotation.y = Math.PI;
    cabinGroup.add(seatFL);

    const seatFR = createCockpitSeatProp('#f59e0b');
    seatFR.position.set(2.6, 0, -5.8);
    seatFR.rotation.y = Math.PI;
    cabinGroup.add(seatFR);

    const seatRL = createCockpitSeatProp('#06b6d4');
    seatRL.position.set(-2.6, 0, 1.2);
    seatRL.rotation.y = Math.PI;
    cabinGroup.add(seatRL);

    const seatRR = createCockpitSeatProp('#06b6d4');
    seatRR.position.set(2.6, 0, 1.2);
    seatRR.rotation.y = Math.PI;
    cabinGroup.add(seatRR);

    const pilotCat = createCatAstronautModel('calico_bw', '#2563eb', '#f59e0b', options.isSoftwareGl, {
      wearingSuit: true,
    });
    pilotCat.group.position.set(-2.6, 0.38, -5.8);
    pilotCat.group.rotation.y = Math.PI;
    pilotCat.leftLeg.rotation.x = -Math.PI / 2;
    pilotCat.rightLeg.rotation.x = -Math.PI / 2;
    cabinGroup.add(pilotCat.group);

    addMarkerRing(cabinGroup, -2.6, -4.0, '#38bdf8', animatedProps);
    interactables.push({
      id: 'spacecraft_crew',
      sceneId: 'spacecraft',
      x: -2.6,
      y: 0,
      z: -4.0,
      radius: 2.6,
      labelEn: 'Talk to Pilot Oreo',
      labelRu: 'Поговорить с пилотом Орео',
      kind: 'npc',
    });

    addMarkerRing(cabinGroup, 2.6, -4.5, '#f59e0b', animatedProps);
    interactables.push({
      id: 'spacecraft_sit_seat',
      sceneId: 'spacecraft',
      x: 2.6,
      y: 0,
      z: -4.5,
      radius: 2.8,
      labelEn: 'Sit in Cockpit Seat / Stand Up',
      labelRu: 'Сесть в кресло пилота / Встать',
      kind: 'terminal',
    });

    const steerDone = options.completedMissions.includes('spacecraft_steer');
    placeStation(cabinGroup, collisions, animatedProps, 0, -8.2, 'radar', '#a855f7', steerDone);
    addMarkerRing(cabinGroup, 0, -6.2, steerDone ? '#22c55e' : '#a855f7', animatedProps);
    interactables.push({
      id: 'spacecraft_steer',
      sceneId: 'spacecraft',
      x: 0,
      y: 0,
      z: -6.2,
      radius: 2.6,
      labelEn: 'Stabilize Rocket Steering (+55 Coins)',
      labelRu: 'Стабилизировать курс ракеты (+55 🪙)',
      kind: 'terminal',
      completed: steerDone,
    });

    placeStation(cabinGroup, collisions, animatedProps, -4.8, -8.2, 'rocket', '#22c55e', false);
    addMarkerRing(cabinGroup, -4.8, -6.2, '#22c55e', animatedProps);
    interactables.push({
      id: 'spacecraft_land_moon',
      sceneId: 'spacecraft',
      x: -4.8,
      y: 0,
      z: -6.2,
      radius: 2.6,
      labelEn: 'Land on the Moon!',
      labelRu: 'Посадка на Луну!',
      kind: 'terminal',
    });

    let shipBankX = 0;
    let shipPitchY = 0;
    spaceMotionUpdate = (steerX, steerY, dt, elapsed, exteriorView) => {
      cabinGroup.visible = !exteriorView;
      extRocket.group.visible = exteriorView;
      disk.rotation.z += dt * 0.4;

      shipBankX = THREE.MathUtils.damp(shipBankX, steerX, 5, dt);
      shipPitchY = THREE.MathUtils.damp(shipPitchY, steerY, 5, dt);

      cosmosGroup.position.x = THREE.MathUtils.damp(cosmosGroup.position.x, -shipBankX * 7.5, 4, dt);
      cosmosGroup.position.y = THREE.MathUtils.damp(cosmosGroup.position.y, -shipPitchY * 5.0, 4, dt);
      cosmosGroup.rotation.z = THREE.MathUtils.damp(cosmosGroup.rotation.z, shipBankX * 0.14, 4, dt);

      extRocket.group.position.x = shipBankX * 2.2;
      extRocket.group.position.y = 2.6 + shipPitchY * 1.4 + Math.sin(elapsed * 3) * 0.12;
      extRocket.group.rotation.z = -shipBankX * 0.35;
      extRocket.group.rotation.x = -Math.PI / 2 + shipPitchY * 0.22;
      extRocket.flame.scale.set(1, 0.85 + Math.sin(elapsed * 28) * 0.28, 1);

      const flySpeed = 24 + Math.max(0, -steerY) * 14;
      for (const ast of asteroids) {
        ast.position.z += flySpeed * dt;
        ast.rotation.x += dt * 0.8;
        ast.rotation.y += dt * 1.1;
        if (ast.position.z > 8) {
          ast.position.z = -85;
        }
      }
    };
  } else {
    // LUNAR OR MARTIAN SURFACE WITH FORTIFIED WALLED BASE COMPOUND!
    const isMars = sceneId === 'mars';
    bounds = 38;
    spawn = { x: 0, z: 9 };

    if (isMars) {
      skyColor = new THREE.Color(
        options.timeOfDay === 'daylight' ? '#8ab4d6' : options.timeOfDay === 'twilight' ? '#c26d42' : '#130b0a'
      );
      fogColor = skyColor.clone();
      fogDensity = 0.011;
    } else {
      skyColor = new THREE.Color(options.timeOfDay === 'daylight' ? '#0a0e17' : '#03050a');
      fogColor = skyColor.clone();
      fogDensity = 0.008;
    }

    addStarfield(root, isMars && options.timeOfDay === 'daylight' ? 40 : 480);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(isMars ? 1.1 : 3.2, 20, 20),
      new THREE.MeshStandardMaterial({ color: '#60a5fa', emissive: '#3b82f6', emissiveIntensity: 0.7 })
    );
    earth.position.set(-28, 34, -65);
    root.add(earth);

    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 16, 16),
      new THREE.MeshBasicMaterial({ color: isMars ? '#fde68a' : '#ffffff' })
    );
    sun.position.set(42, options.timeOfDay === 'twilight' ? 14 : 46, -58);
    root.add(sun);

    const terrainTex = getTerrainTexture(isMars ? 'mars' : 'moon');
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      new THREE.MeshStandardMaterial({ map: terrainTex, roughness: 0.9, metalness: 0.05 })
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    root.add(terrain);

    // Fortified Outpost Compound Walls (4 Corner Defensive Walls with Open Gates!)
    [-11, 11].forEach((xSign) => {
      addWall(root, collisions, xSign, 1.4, -12, 9, 2.8, 0.8, trimWall);
      addWall(root, collisions, xSign, 1.4, 24, 9, 2.8, 0.8, trimWall);
    });
    [-15.5, 15.5].forEach((xSide) => {
      addWall(root, collisions, xSide, 1.4, -6.5, 0.8, 2.8, 11, trimWall);
      addWall(root, collisions, xSide, 1.4, 18.5, 0.8, 2.8, 11, trimWall);
    });

    // Illuminated Base Landing Pad Apron + Corner Floodlight Towers
    const padFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 34),
      new THREE.MeshStandardMaterial({ map: getSciFiFloorTexture('launchpad'), roughness: 0.65 })
    );
    padFloor.rotation.x = -Math.PI / 2;
    padFloor.position.set(0, 0.02, 6);
    padFloor.receiveShadow = true;
    root.add(padFloor);

    // Pre-built Rover Supply Garage / Briefing Bench inside Compound!
    const outpostDesk = createDeskProp(isMars ? '#fb923c' : '#38bdf8');
    outpostDesk.position.set(-10, 0, 12);
    outpostDesk.rotation.y = Math.PI / 2;
    root.add(outpostDesk);
    collisions.push({ minX: -11.4, maxX: -8.6, minZ: 10.6, maxZ: 13.4 });

    const supplyRack = createServerRackProp('#22c55e');
    supplyRack.position.set(10, 0, 12);
    root.add(supplyRack);
    collisions.push({ minX: 9.1, maxX: 10.9, minZ: 11.1, maxZ: 12.9 });

    const rockMat = new THREE.MeshStandardMaterial({
      color: isMars ? '#7c2d12' : '#475569',
      roughness: 0.9,
      metalness: 0.08,
    });
    for (let i = 0; i < 28; i++) {
      const ang = (i / 28) * Math.PI * 2;
      const dist = 42 + (i % 3) * 4;
      const ridge = new THREE.Mesh(new THREE.DodecahedronGeometry(4.5 + (i % 4) * 1.4, 1), rockMat);
      ridge.position.set(Math.cos(ang) * dist, 1.5, Math.sin(ang) * dist);
      ridge.scale.set(1.8, 0.9, 1.4);
      root.add(ridge);
    }

    // Lander
    const lander = new THREE.Group();
    lander.position.set(0, 0, 18);
    const legMat = new THREE.MeshStandardMaterial({ color: '#eab308', metalness: 0.65, roughness: 0.35 });
    const cabinMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.4, roughness: 0.4 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.5, 3.0, 8), cabinMat);
    body.position.y = 2.2;
    body.castShadow = true;
    lander.add(body);
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((a) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 8), legMat);
      leg.position.set(Math.cos(a) * 2.5, 0.9, Math.sin(a) * 2.5);
      leg.rotation.z = -Math.cos(a) * 0.35;
      leg.rotation.x = Math.sin(a) * 0.35;
      lander.add(leg);
    });
    const landerBadge = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({ map: getNasaLogoTexture(), transparent: true })
    );
    landerBadge.position.set(0, 2.3, -2.35);
    landerBadge.rotation.y = Math.PI;
    lander.add(landerBadge);
    root.add(lander);
    collisions.push({ minX: -2.8, maxX: 2.8, minZ: 15.2, maxZ: 20.8 });

    addMarkerRing(root, 0, 14.0, '#38bdf8', animatedProps);
    interactables.push({
      id: `${sceneId}_lander_refill`,
      sceneId,
      x: 0,
      y: 0,
      z: 14.0,
      radius: 2.8,
      labelEn: 'Lander: Refill O₂, Food & Water',
      labelRu: 'Модуль: пополнить О₂, еду и воду',
      kind: 'supply',
    });

    const planetBuildings = options.buildings.filter((b) => b.planet === sceneId);
    planetBuildings.forEach((b) => {
      const bMesh = createModularBaseBuilding(b.type, b.powered);
      bMesh.position.set(b.x, 0, b.z);
      root.add(bMesh);
      collisions.push({ minX: b.x - 2.6, maxX: b.x + 2.6, minZ: b.z - 2.6, maxZ: b.z + 2.6 });

      if (b.type === 'habitat' || b.type === 'o2_station' || b.type === 'greenhouse') {
        addMarkerRing(root, b.x, b.z - 3.6, '#22c55e', animatedProps);
        interactables.push({
          id: `bldg_refill_${b.id}`,
          sceneId,
          x: b.x,
          y: 0,
          z: b.z - 3.6,
          radius: 2.8,
          labelEn: 'Module: Refill O₂, Food & Water',
          labelRu: 'Модуль: воздух, вода и еда',
          kind: 'supply',
        });
      }
      if (b.type === 'science_lab') {
        addMarkerRing(root, b.x, b.z + 3.4, '#a855f7', animatedProps);
        interactables.push({
          id: `bldg_lab_${b.id}`,
          sceneId,
          x: b.x,
          y: 0,
          z: b.z + 3.4,
          radius: 2.8,
          labelEn: 'Use Base Science Spectrometer (+55 Coins)',
          labelRu: 'Анализ образцов в лаборатории (+55 🪙)',
          kind: 'terminal',
        });
      }
    });

    const sampleSpots = [
      { id: `${sceneId}_sample_1`, x: -20, z: -18, en: 'Collect Crater Sample (+40 Coins)', ru: 'Образец грунта кратера (+40 🪙)' },
      { id: `${sceneId}_sample_2`, x: 20, z: -18, en: isMars ? 'Sample Martian Ice (+40 Coins)' : 'Sample Lunar Ice (+40 Coins)', ru: isMars ? 'Проба льда Марса (+40 🪙)' : 'Проба лунного льда (+40 🪙)' },
      { id: `${sceneId}_sample_3`, x: -22, z: 16, en: 'Inspect Mineral Outcrop (+40 Coins)', ru: 'Изучить минералы (+40 🪙)' },
    ];
    sampleSpots.forEach((sp) => {
      const crystal = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.65, 0),
        new THREE.MeshStandardMaterial({
          color: isMars ? '#38bdf8' : '#f59e0b',
          emissive: isMars ? '#0284c7' : '#d97706',
          emissiveIntensity: 0.7,
        })
      );
      crystal.position.set(sp.x, 0.7, sp.z);
      root.add(crystal);
      animatedProps.push((t) => {
        crystal.rotation.y = t * 1.2;
        crystal.position.y = 0.75 + Math.sin(t * 2.5) * 0.12;
      });
      addMarkerRing(root, sp.x, sp.z, '#f59e0b', animatedProps);
      interactables.push({
        id: sp.id,
        sceneId,
        x: sp.x,
        y: 0,
        z: sp.z,
        radius: 2.6,
        labelEn: sp.en,
        labelRu: sp.ru,
        kind: 'sample',
        completed: options.completedMissions.includes(sp.id),
      });
    });
  }

  return {
    root,
    collisions,
    interactables,
    bounds,
    spawn,
    animatedProps,
    skyColor,
    fogColor,
    fogDensity,
    spaceMotionUpdate,
  };
}
