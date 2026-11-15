import * as THREE from 'three';
import { BuildingType, CatBreed } from '../types/game';
import { CAT_BREEDS } from '../i18n/translations';
import {
  getCatFaceTexture,
  getNasaLogoTexture,
  getSolarCellTexture,
  getStationIconTexture,
  StationIconKind,
} from './textures';

export interface AnimatedActorRefs {
  group: THREE.Group;
  bodyPivot: THREE.Group;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  tail: THREE.Object3D;
  droneRef?: THREE.Object3D;
}

export interface CatModelOptions {
  wearingSuit?: boolean;
  decorations?: string[];
}

// Aesthetic Multi-Part Sci-Fi Console / Equipment Station with Realistic Icon Screen & Floating Holo Badge!
export function createAestheticStationProp(
  iconKind: StationIconKind,
  accentHex: string,
  completed = false
): { group: THREE.Group; holoBadge: THREE.Mesh } {
  const group = new THREE.Group();

  const baseMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45, metalness: 0.6 });
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.35, metalness: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({
    color: completed ? '#22c55e' : accentHex,
    emissive: completed ? '#16a34a' : accentHex,
    emissiveIntensity: 0.65,
    roughness: 0.25,
  });

  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, 0.28, 8), baseMat);
  plinth.position.y = 0.14;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  group.add(plinth);

  const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.35, 0.95), bodyMat);
  pedestal.position.y = 0.95;
  pedestal.castShadow = true;
  group.add(pedestal);

  [-0.84, 0.84].forEach((px) => {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 1.25, 12), baseMat);
    pipe.position.set(px, 0.9, 0);
    group.add(pipe);

    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 10), trimMat);
    cap.position.set(px, 1.56, 0);
    group.add(cap);
  });

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.65, 1.05, 0.48), baseMat);
  hood.position.set(0, 1.88, -0.05);
  hood.rotation.x = -0.22;
  hood.castShadow = true;
  group.add(hood);

  const iconTex = getStationIconTexture(iconKind, completed ? '#22c55e' : accentHex);
  const screenMat = new THREE.MeshBasicMaterial({ map: iconTex });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 0.86), screenMat);
  screen.position.set(0, 1.86, 0.21);
  screen.rotation.x = -0.22;
  group.add(screen);

  const led = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.08), trimMat);
  led.position.set(0, 1.25, 0.49);
  group.add(led);

  const holoBadge = new THREE.Mesh(
    new THREE.PlaneGeometry(0.75, 0.75),
    new THREE.MeshBasicMaterial({ map: iconTex, transparent: true, opacity: 0.92, side: THREE.DoubleSide })
  );
  holoBadge.position.set(0, 3.05, 0);
  group.add(holoBadge);

  return { group, holoBadge };
}

// Composite Cat Astronaut with Optional Pressurized Spacesuit + 3D Purchased Skin Decorations!
export function createCatAstronautModel(
  breed: CatBreed,
  suitHex: string,
  accentHex: string,
  isSoftwareGl = false,
  options: CatModelOptions = {}
): AnimatedActorRefs {
  const wearingSuit = options.wearingSuit ?? true;
  const decorations = options.decorations ?? [];
  const group = new THREE.Group();
  const bodyPivot = new THREE.Group();
  group.add(bodyPivot);

  const breedInfo = CAT_BREEDS.find((b) => b.id === breed) || CAT_BREEDS[0];

  const suitMat = new THREE.MeshStandardMaterial({
    color: wearingSuit ? suitHex : '#1e293b',
    roughness: 0.46,
    metalness: wearingSuit ? 0.18 : 0.08,
  });
  const trimMat = new THREE.MeshStandardMaterial({
    color: accentHex,
    emissive: accentHex,
    emissiveIntensity: 0.22,
    roughness: 0.3,
    metalness: 0.6,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    roughness: 0.8,
    metalness: 0.12,
  });
  const furMat = new THREE.MeshStandardMaterial({
    color: breedInfo.fur,
    roughness: 0.78,
    metalness: 0.02,
  });
  const earInnerMat = new THREE.MeshStandardMaterial({
    color: breedInfo.earInner,
    roughness: 0.65,
  });

  const makeLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.62, 0);

    const legMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.45, 12), suitMat);
    legMesh.position.y = -0.24;
    legMesh.castShadow = true;
    legPivot.add(legMesh);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), bootMat);
    boot.position.set(0, -0.54, 0.05);
    boot.castShadow = true;
    legPivot.add(boot);

    return legPivot;
  };

  const leftLeg = makeLeg(-0.2);
  const rightLeg = makeLeg(0.2);
  bodyPivot.add(leftLeg, rightLeg);

  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.32, 0.78, 16), suitMat);
  torso.position.y = 1.02;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(torso);

  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.11, 16), trimMat);
  belt.position.y = 0.72;
  bodyPivot.add(belt);

  const chestBox = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.28, 0.12), trimMat);
  chestBox.position.set(0, 1.02, 0.34);
  bodyPivot.add(chestBox);

  const nasaMat = new THREE.MeshStandardMaterial({
    map: getNasaLogoTexture(),
    transparent: true,
    roughness: 0.35,
  });
  const nasaBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.22), nasaMat);
  nasaBadge.position.set(0, 1.02, 0.405);
  bodyPivot.add(nasaBadge);

  const shoulderBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.14), nasaMat);
  shoulderBadge.position.set(-0.37, 1.24, 0);
  shoulderBadge.rotation.y = -Math.PI / 2;
  bodyPivot.add(shoulderBadge);

  // Bulky EVA Backpack ONLY when wearing full spacesuit!
  if (wearingSuit) {
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.64, 0.28), suitMat);
    pack.position.set(0, 1.08, -0.38);
    pack.castShadow = true;
    bodyPivot.add(pack);

    const packStripe = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.1, 0.04), trimMat);
    packStripe.position.set(0, 1.22, -0.53);
    bodyPivot.add(packStripe);
  }

  // Skin Decoration: Jetpack Wings!
  if (decorations.includes('wings')) {
    const wingMat = new THREE.MeshStandardMaterial({
      color: '#e2e8f0',
      emissive: accentHex,
      emissiveIntensity: 0.35,
      metalness: 0.7,
      roughness: 0.25,
    });
    [-1, 1].forEach((side) => {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.24, 0.06), wingMat);
      wing.position.set(side * 0.56, 1.26, -0.38);
      wing.rotation.z = side * 0.42;
      wing.rotation.y = -side * 0.25;
      bodyPivot.add(wing);
    });
  }

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 0.72, -0.32);
  const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.56, 8), furMat);
  tailMesh.rotation.x = -Math.PI / 3;
  tailMesh.position.set(0, 0.15, -0.22);
  tailPivot.add(tailMesh);
  bodyPivot.add(tailPivot);

  const makeArm = (xOffset: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 1.32, 0);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.5, 10), suitMat);
    arm.position.y = -0.22;
    arm.castShadow = true;
    armPivot.add(arm);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), wearingSuit ? trimMat : furMat);
    glove.position.y = -0.48;
    armPivot.add(glove);
    return armPivot;
  };
  const leftArm = makeArm(-0.46);
  const rightArm = makeArm(0.46);
  bodyPivot.add(leftArm, rightArm);

  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.06, 10, 20), trimMat);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = 1.44;
  bodyPivot.add(collar);

  const catHeadGroup = new THREE.Group();
  catHeadGroup.position.set(0, 1.76, 0);

  const headSphere = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 20), furMat);
  catHeadGroup.add(headSphere);

  const facePlane = new THREE.Mesh(
    new THREE.CircleGeometry(0.27, 20),
    new THREE.MeshBasicMaterial({ map: getCatFaceTexture(breed) })
  );
  facePlane.position.z = 0.25;
  catHeadGroup.add(facePlane);

  const neonEarMat = new THREE.MeshStandardMaterial({
    color: '#22d3ee',
    emissive: '#e879f9',
    emissiveIntensity: 1.1,
  });

  [-1, 1].forEach((side) => {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.22, 4),
      decorations.includes('neon_ears') ? neonEarMat : furMat
    );
    ear.position.set(side * 0.2, 0.3, 0.02);
    ear.rotation.z = -side * 0.32;
    ear.rotation.y = Math.PI / 4;
    catHeadGroup.add(ear);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 4), earInnerMat);
    inner.position.set(side * 0.2, 0.29, 0.06);
    inner.rotation.z = -side * 0.32;
    inner.rotation.y = Math.PI / 4;
    catHeadGroup.add(inner);
  });

  bodyPivot.add(catHeadGroup);

  // Glass Dome Helmet ONLY when wearing Spacesuit!
  if (wearingSuit) {
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#e0f2fe',
      transparent: true,
      opacity: isSoftwareGl ? 0.28 : 0.32,
      roughness: 0.08,
      metalness: 0.05,
      depthWrite: false,
    });
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.46, 22, 22), glassMat);
    helmet.position.y = 1.78;
    helmet.renderOrder = 2;
    bodyPivot.add(helmet);
  }

  // Skin Decoration: Golden Star Crown!
  if (decorations.includes('crown')) {
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, wearingSuit ? 2.26 : 2.1, 0);
    const goldMat = new THREE.MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#d97706',
      emissiveIntensity: 0.4,
      metalness: 0.85,
      roughness: 0.2,
    });
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.16, 0.12, 8), goldMat);
    crownGroup.add(band);
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((a) => {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), goldMat);
      spike.position.set(Math.cos(a) * 0.14, 0.11, Math.sin(a) * 0.14);
      crownGroup.add(spike);
    });
    bodyPivot.add(crownGroup);
  }

  // Skin Decoration: Cosmic Halo Ring!
  if (decorations.includes('halo')) {
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.32, 0.04, 10, 28),
      new THREE.MeshStandardMaterial({
        color: '#38bdf8',
        emissive: '#06b6d4',
        emissiveIntensity: 1.4,
      })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, wearingSuit ? 2.4 : 2.25, 0);
    bodyPivot.add(halo);
  }

  // Skin Decoration: Shoulder Mini-Drone Bot!
  let droneRef: THREE.Object3D | undefined;
  if (decorations.includes('drone_bot')) {
    const drone = new THREE.Group();
    drone.position.set(0.7, 1.92, -0.1);
    const cube = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.14, 0),
      new THREE.MeshStandardMaterial({
        color: '#f8fafc',
        emissive: '#38bdf8',
        emissiveIntensity: 0.85,
        metalness: 0.5,
      })
    );
    drone.add(cube);
    bodyPivot.add(drone);
    droneRef = drone;
  }

  return { group, bodyPivot, leftLeg, rightLeg, leftArm, rightArm, tail: tailPivot, droneRef };
}

// NASA Astrovan Crew Transfer Bus for Academy -> Spaceport 39A!
export function createCrewBusModel(): THREE.Group {
  const bus = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35, metalness: 0.25 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#0f172a',
    emissive: '#1e3a8a',
    emissiveIntensity: 0.35,
    roughness: 0.1,
    metalness: 0.6,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.3, 8.2), hullMat);
  body.position.y = 1.55;
  body.castShadow = true;
  bus.add(body);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.35, 8.24), orangeMat);
  stripe.position.y = 1.15;
  bus.add(stripe);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.95, 0.12), glassMat);
  windshield.position.set(0, 1.95, 4.1);
  bus.add(windshield);

  [-1.62, 1.62].forEach((x) => {
    [-2.4, -0.8, 0.8, 2.4].forEach((z) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.85, 1.25), glassMat);
      win.position.set(x, 1.9, z);
      bus.add(win);
    });
  });

  const nasaLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({ map: getNasaLogoTexture(), transparent: true })
  );
  nasaLogo.position.set(-1.63, 1.1, 0);
  nasaLogo.rotation.y = -Math.PI / 2;
  bus.add(nasaLogo);

  const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.38, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  [-1.55, 1.55].forEach((x) => {
    [-2.7, 2.7].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, 0.5, z);
      bus.add(wheel);
    });
  });

  return bus;
}

// Interior Cockpit / Briefing Seat Prop!
export function createCockpitSeatProp(accentHex = '#2563eb'): THREE.Group {
  const seat = new THREE.Group();
  const frameMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.6 });
  const cushionMat = new THREE.MeshStandardMaterial({ color: accentHex, roughness: 0.6 });

  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.4, 12), frameMat);
  base.position.y = 0.2;
  seat.add(base);

  const pan = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.18, 0.82), cushionMat);
  pan.position.y = 0.48;
  seat.add(pan);

  const back = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.05, 0.18), cushionMat);
  back.position.set(0, 1.02, -0.34);
  seat.add(back);

  const headRest = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.28, 0.2), frameMat);
  headRest.position.set(0, 1.65, -0.34);
  seat.add(headRest);

  return seat;
}

// Interior Lab Desk, Server Rack, Hydroponic Planter & Lockers for Beautiful Lived-In Bases!
export function createDeskProp(screenHex = '#38bdf8'): THREE.Group {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.5, roughness: 0.5 });
  const topMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.35 });
  const screenMat = new THREE.MeshStandardMaterial({
    color: screenHex,
    emissive: screenHex,
    emissiveIntensity: 0.75,
  });

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 1.1), topMat);
  top.position.y = 0.88;
  g.add(top);

  [-1.0, 1.0].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.88, 0.9), metal);
    leg.position.set(x, 0.44, 0);
    g.add(leg);
  });

  const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.08), screenMat);
  monitor.position.set(0, 1.32, -0.25);
  monitor.rotation.x = 0.12;
  g.add(monitor);
  return g;
}

export function createServerRackProp(ledHex = '#22d3ee'): THREE.Group {
  const g = new THREE.Group();
  const rack = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 2.8, 0.9),
    new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.65, roughness: 0.4 })
  );
  rack.position.y = 1.4;
  rack.castShadow = true;
  g.add(rack);

  const ledMat = new THREE.MeshBasicMaterial({ color: ledHex });
  [0.8, 1.4, 2.0, 2.4].forEach((y) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.07, 0.05), ledMat);
    strip.position.set(0, y, 0.46);
    g.add(strip);
  });
  return g;
}

export function createHydroPlanterProp(): THREE.Group {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.55, 0.65, 12),
    new THREE.MeshStandardMaterial({ color: '#e2e8f0', roughness: 0.4 })
  );
  pot.position.y = 0.32;
  g.add(pot);

  const leafMat = new THREE.MeshStandardMaterial({
    color: '#22c55e',
    emissive: '#14532d',
    emissiveIntensity: 0.3,
    roughness: 0.6,
  });
  const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.58, 1), leafMat);
  shrub.position.y = 0.92;
  g.add(shrub);
  return g;
}

export function createHelperRoverModel(): THREE.Group {
  const rover = new THREE.Group();

  const hullMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35, metalness: 0.25 });
  const darkMetal = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.65, metalness: 0.7 });
  const amberMat = new THREE.MeshStandardMaterial({
    color: '#f59e0b',
    emissive: '#d97706',
    emissiveIntensity: 0.6,
    roughness: 0.3,
  });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.38, 1.35), hullMat);
  body.position.y = 0.55;
  body.castShadow = true;
  rover.add(body);

  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.18, 10), amberMat);
  beacon.position.set(-0.22, 0.84, -0.15);
  rover.add(beacon);

  const hexDeck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.08, 6), amberMat);
  hexDeck.position.set(0.22, 0.78, -0.2);
  rover.add(hexDeck);

  const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14);
  wheelGeo.rotateZ(Math.PI / 2);
  [-0.64, 0.64].forEach((x) => {
    [-0.5, 0, 0.5].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, darkMetal);
      wheel.position.set(x, 0.22, z);
      wheel.castShadow = true;
      rover.add(wheel);

      const strut = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.32, 0.08), darkMetal);
      strut.position.set(x * 0.86, 0.38, z);
      rover.add(strut);
    });
  });

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.65, 8), darkMetal);
  mast.position.set(0, 1.02, 0.38);
  rover.add(mast);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.24), hullMat);
  head.position.set(0, 1.36, 0.42);
  rover.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({ color: '#06b6d4', emissive: '#06b6d4', emissiveIntensity: 1.2 });
  [-0.1, 0.1].forEach((ex) => {
    const eye = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 10), eyeMat);
    eye.rotation.x = Math.PI / 2;
    eye.position.set(ex, 1.36, 0.55);
    rover.add(eye);
  });

  const armBase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.55), darkMetal);
  armBase.position.set(0.25, 0.45, 0.86);
  armBase.rotation.x = 0.25;
  rover.add(armBase);

  return rover;
}

export function createNasaRocketModel(): THREE.Group {
  const rocket = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3, metalness: 0.2 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.6 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.55, metalness: 0.1 });

  const core = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.15, 11, 24), bodyMat);
  core.position.y = 6.2;
  core.castShadow = true;
  rocket.add(core);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 1.4, 24), orangeMat);
  band.position.y = 2.6;
  rocket.add(band);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.8, 24), bodyMat);
  cone.position.y = 13.1;
  cone.castShadow = true;
  rocket.add(cone);

  [-1.6, 1.6].forEach((x) => {
    const booster = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.52, 7.5, 16), bodyMat);
    booster.position.set(x, 4.4, 0);
    booster.castShadow = true;
    rocket.add(booster);

    const bCone = new THREE.Mesh(new THREE.ConeGeometry(0.48, 1.2, 16), orangeMat);
    bCone.position.set(x, 8.75, 0);
    rocket.add(bCone);
  });

  [-0.5, 0.5, 0].forEach((x, idx) => {
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.45, 0.85, 14), darkMat);
    nozzle.position.set(x, 0.45, idx === 2 ? 0.4 : -0.2);
    rocket.add(nozzle);
  });

  const nasaMat = new THREE.MeshStandardMaterial({
    map: getNasaLogoTexture(),
    transparent: true,
    roughness: 0.3,
  });
  const logoFront = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), nasaMat);
  logoFront.position.set(0, 7.8, 1.13);
  rocket.add(logoFront);

  const logoSide = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), nasaMat);
  logoSide.position.set(1.13, 7.8, 0);
  logoSide.rotation.y = Math.PI / 2;
  rocket.add(logoSide);

  return rocket;
}

export function createModularBaseBuilding(type: BuildingType, powered: boolean): THREE.Group {
  const b = new THREE.Group();
  const metalHull = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.42, metalness: 0.55 });
  const darkTrim = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.65, metalness: 0.4 });
  const glowMat = new THREE.MeshStandardMaterial({
    color: powered ? '#38bdf8' : '#ef4444',
    emissive: powered ? '#0284c7' : '#991b1b',
    emissiveIntensity: powered ? 1.1 : 0.6,
    roughness: 0.25,
  });

  if (type === 'solar') {
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.7, 0.4, 12), darkTrim);
    base.position.y = 0.2;
    b.add(base);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.2, 10), metalHull);
    mast.position.y = 1.3;
    b.add(mast);

    const solarMat = new THREE.MeshStandardMaterial({
      map: getSolarCellTexture(),
      roughness: 0.2,
      metalness: 0.7,
    });
    const wing = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 1.9), solarMat);
    wing.position.y = 2.4;
    wing.rotation.x = 0.35;
    wing.castShadow = true;
    b.add(wing);
  } else if (type === 'habitat') {
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.6, 2.4, 8), metalHull);
    hull.position.y = 1.2;
    hull.castShadow = true;
    hull.receiveShadow = true;
    b.add(hull);

    const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 2.4, 0.6, 8), darkTrim);
    roof.position.y = 2.7;
    b.add(roof);

    const winMat = new THREE.MeshStandardMaterial({
      color: powered ? '#fef08a' : '#475569',
      emissive: powered ? '#f59e0b' : '#000000',
      emissiveIntensity: powered ? 0.7 : 0,
    });
    [0, Math.PI / 2, -Math.PI / 2].forEach((ang) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.65, 0.12), winMat);
      win.position.set(Math.sin(ang) * 2.38, 1.35, Math.cos(ang) * 2.38);
      win.rotation.y = ang;
      b.add(win);
    });

    const airlock = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.9), darkTrim);
    airlock.position.set(0, 0.9, -2.4);
    b.add(airlock);
  } else if (type === 'greenhouse') {
    const foundation = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.0, 0.6, 16), metalHull);
    foundation.position.y = 0.3;
    b.add(foundation);

    const planterMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7 });
    const leafMat = new THREE.MeshStandardMaterial({
      color: '#22c55e',
      emissive: powered ? '#15803d' : '#000000',
      emissiveIntensity: powered ? 0.35 : 0,
      roughness: 0.6,
    });
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const bed = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.7), planterMat);
      bed.position.set(Math.cos(a) * 1.4, 0.75, Math.sin(a) * 1.4);
      bed.rotation.y = -a;
      b.add(bed);

      const foliage = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 10), leafMat);
      foliage.position.set(Math.cos(a) * 1.4, 1.15, Math.sin(a) * 1.4);
      b.add(foliage);
    }

    const domeMat = new THREE.MeshPhysicalMaterial({
      color: '#dcfce7',
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      depthWrite: false,
    });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.6, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeMat);
    dome.position.y = 0.6;
    dome.renderOrder = 3;
    b.add(dome);

    const frame = new THREE.Mesh(
      new THREE.SphereGeometry(2.63, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: '#94a3b8', wireframe: true })
    );
    frame.position.y = 0.6;
    b.add(frame);
  } else if (type === 'o2_station') {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.35, 2.4), darkTrim);
    pad.position.y = 0.18;
    b.add(pad);

    [-0.75, 0.75].forEach((x) => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 2.4, 16), metalHull);
      tank.position.set(x, 1.5, 0);
      tank.castShadow = true;
      b.add(tank);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 10), glowMat);
      cap.position.set(x, 2.7, 0);
      b.add(cap);
    });
  } else if (type === 'water_recycler') {
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.4, 2.6), darkTrim);
    base.position.y = 0.2;
    b.add(base);

    const blueWater = new THREE.MeshStandardMaterial({
      color: '#0ea5e9',
      emissive: powered ? '#0369a1' : '#000000',
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 0.95, 2.1, 18), blueWater);
    drum.position.y = 1.4;
    b.add(drum);

    const pipe = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 8, 20), metalHull);
    pipe.rotation.x = Math.PI / 2;
    pipe.position.y = 1.4;
    b.add(pipe);
  } else if (type === 'shield_dome') {
    const bunker = new THREE.Mesh(
      new THREE.SphereGeometry(2.7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.85, metalness: 0.2 })
    );
    bunker.castShadow = true;
    b.add(bunker);

    const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.7, 10), glowMat);
    beacon.position.y = 2.85;
    b.add(beacon);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 2.8), metalHull);
    body.position.y = 1.1;
    body.castShadow = true;
    b.add(body);

    const dishMast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 1.6, 8), darkTrim);
    dishMast.position.set(0.8, 2.8, 0);
    b.add(dishMast);

    const dish = new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.45, 16, 1, true), metalHull);
    dish.position.set(0.8, 3.6, 0);
    dish.rotation.x = -Math.PI / 3;
    b.add(dish);

    const status = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.15), glowMat);
    status.position.set(0, 1.8, 1.42);
    b.add(status);
  }

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(2.6, 2.85, 24),
    new THREE.MeshBasicMaterial({ color: powered ? '#22c55e' : '#ef4444', side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.03;
  b.add(ring);

  return b;
}

// Driveable NASA Astrovan Crew Bus with Clear Panoramic Glass & Spinning Wheels!
export function createDriveableBusModel(): { group: THREE.Group; wheels: THREE.Mesh[] } {
  const bus = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.35, metalness: 0.25 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.45 });
  const darkTrim = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.5 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#93c5fd',
    transparent: true,
    opacity: 0.24,
    roughness: 0.08,
    metalness: 0.2,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.9 });

  // Lower chassis + rear cabin + open clear upper greenhouse so the Cat Hero is seen inside!
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.05, 8.2), hullMat);
  chassis.position.y = 0.95;
  chassis.castShadow = true;
  bus.add(chassis);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.32, 8.24), orangeMat);
  stripe.position.y = 0.95;
  bus.add(stripe);

  const rearBody = new THREE.Mesh(new THREE.BoxGeometry(3.15, 1.4, 3.6), hullMat);
  rearBody.position.set(0, 2.15, 2.2);
  rearBody.castShadow = true;
  bus.add(rearBody);

  // Transparent panoramic front & side cab roof + pillars
  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.16, 0.16, 4.7), hullMat);
  roof.position.set(0, 2.95, -1.7);
  bus.add(roof);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(2.9, 1.25, 0.08), glassMat);
  windshield.position.set(0, 2.15, -4.02);
  bus.add(windshield);

  [-1.56, 1.56].forEach((x) => {
    const sideWin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 4.2), glassMat);
    sideWin.position.set(x, 2.15, -1.8);
    bus.add(sideWin);
  });

  // Interior steering console & driver seat
  const dash = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.55, 0.55), darkTrim);
  dash.position.set(0, 1.45, -3.45);
  bus.add(dash);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 8, 18), darkTrim);
  wheelRim.position.set(-0.6, 1.75, -3.05);
  wheelRim.rotation.x = Math.PI / 3;
  bus.add(wheelRim);

  // Glowing headlights & tail lights
  const headMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#ef4444' });
  [-1.1, 1.1].forEach((x) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.1), headMat);
    h.position.set(x, 0.9, -4.12);
    bus.add(h);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.1), tailMat);
    tl.position.set(x, 0.9, 4.12);
    bus.add(tl);
  });

  const nasaLogo = new THREE.Mesh(
    new THREE.PlaneGeometry(1.1, 1.1),
    new THREE.MeshBasicMaterial({ map: getNasaLogoTexture(), transparent: true })
  );
  nasaLogo.position.set(-1.62, 2.0, 2.2);
  nasaLogo.rotation.y = -Math.PI / 2;
  bus.add(nasaLogo);

  const wheels: THREE.Mesh[] = [];
  const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.4, 16);
  wheelGeo.rotateZ(Math.PI / 2);
  [-1.58, 1.58].forEach((x) => {
    [-2.7, 2.7].forEach((z) => {
      const wheel = new THREE.Mesh(wheelGeo, tireMat);
      wheel.position.set(x, 0.52, z);
      bus.add(wheel);
      wheels.push(wheel);
    });
  });

  return { group: bus, wheels };
}

// Flyable & Landable Exterior 3D ABSIDIAN-1 Spacecraft with Interactive Thruster Flames!
export function createFlightRocketExterior(): {
  group: THREE.Group;
  flame: THREE.Mesh;
  legsGroup: THREE.Group;
} {
  const g = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.28, metalness: 0.28 });
  const darkMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5, metalness: 0.6 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.45 });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#7dd3fc',
    transparent: true,
    opacity: 0.45,
    roughness: 0.1,
    metalness: 0.3,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.95, 4.4, 24), hullMat);
  body.position.y = 2.6;
  body.castShadow = true;
  g.add(body);

  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.96, 0.96, 0.65, 24), orangeMat);
  band.position.y = 1.25;
  g.add(band);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.85, 1.75, 24), hullMat);
  nose.position.y = 5.65;
  g.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.58, 16, 12), glassMat);
  canopy.position.set(0, 4.1, 0.68);
  g.add(canopy);

  const nasaMat = new THREE.MeshBasicMaterial({ map: getNasaLogoTexture(), transparent: true });
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), nasaMat);
  logo.position.set(0, 2.75, 0.91);
  g.add(logo);

  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.62, 0.6, 16), darkMat);
  nozzle.position.y = 0.25;
  g.add(nozzle);

  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.55, 2.4, 16),
    new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.9 })
  );
  flame.rotation.x = Math.PI;
  flame.position.y = -1.25;
  g.add(flame);

  const legsGroup = new THREE.Group();
  [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach((a) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 0.2), darkMat);
    leg.position.set(Math.sin(a) * 1.15, 0.45, Math.cos(a) * 1.15);
    leg.rotation.z = -Math.sin(a) * 0.48;
    leg.rotation.x = Math.cos(a) * 0.48;
    legsGroup.add(leg);
  });
  g.add(legsGroup);

  return { group: g, flame, legsGroup };
}
