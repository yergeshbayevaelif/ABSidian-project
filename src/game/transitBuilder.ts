import * as THREE from 'three';
import { LiveTransitMode, RocketCameraMode } from '../types/game';
import {
  createDriveableBusModel,
  createFlightRocketExterior,
  createNasaRocketModel,
} from './models';
import { getTerrainTexture } from './textures';

export interface LiveTransitController {
  root: THREE.Group;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  camPos: THREE.Vector3;
  camLook: THREE.Vector3;
  update: (
    steerX: number,
    steerY: number,
    thrustHeld: boolean,
    cameraMode: RocketCameraMode,
    dt: number,
    elapsed: number
  ) => {
    progressPct: number;
    distanceLeft: number;
    altitude: number;
    speedDisplay: number;
    done: boolean;
  };
  cleanup: () => void;
}

export function createLiveTransitController(
  mode: Exclude<LiveTransitMode, null>,
  actorGroup: THREE.Group
): LiveTransitController {
  const root = new THREE.Group();
  const camPos = new THREE.Vector3();
  const camLook = new THREE.Vector3();

  if (mode === 'bus_drive') {
    const skyColor = new THREE.Color('#38bdf8');
    const fogColor = new THREE.Color('#bae6fd');
    const fogDensity = 0.006;

    // Desert ground & sunlit 2-lane highway
    const desert = new THREE.Mesh(
      new THREE.PlaneGeometry(220, 320),
      new THREE.MeshStandardMaterial({ color: '#d97706', roughness: 0.95 })
    );
    desert.rotation.x = -Math.PI / 2;
    desert.position.y = -0.05;
    desert.receiveShadow = true;
    root.add(desert);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 320),
      new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.85 })
    );
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    root.add(road);

    const lineMat = new THREE.MeshBasicMaterial({ color: '#f59e0b' });
    [-6.1, 6.1].forEach((lx) => {
      const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 320), lineMat);
      shoulder.rotation.x = -Math.PI / 2;
      shoulder.position.set(lx, 0.02, 0);
      root.add(shoulder);
    });

    // Moving dashed lane markers & roadside streetlamps/palms/rocks
    const dashes: THREE.Mesh[] = [];
    const dashGeo = new THREE.PlaneGeometry(0.32, 3.6);
    const dashMat = new THREE.MeshBasicMaterial({ color: '#f8fafc' });
    for (let i = 0; i < 24; i++) {
      const d = new THREE.Mesh(dashGeo, dashMat);
      d.rotation.x = -Math.PI / 2;
      d.position.set(0, 0.03, 25 - i * 10);
      root.add(d);
      dashes.push(d);
    }

    const roadside: THREE.Group[] = [];
    const poleMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.6 });
    const lampMat = new THREE.MeshBasicMaterial({ color: '#fef08a' });
    const palmMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.8 });
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });

    for (let i = 0; i < 20; i++) {
      const prop = new THREE.Group();
      const side = i % 2 === 0 ? -9.5 : 9.5;
      if (i % 3 === 0) {
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.35, 4.2, 8), trunkMat);
        trunk.position.y = 2.1;
        prop.add(trunk);
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.4, 0), palmMat);
        crown.position.y = 4.4;
        prop.add(crown);
      } else {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 5.2, 8), poleMat);
        pole.position.y = 2.6;
        prop.add(pole);
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.4), lampMat);
        lamp.position.set(side > 0 ? -0.5 : 0.5, 5.2, 0);
        prop.add(lamp);
      }
      prop.position.set(side, 0, 20 - i * 12);
      root.add(prop);
      roadside.push(prop);
    }

    // Spaceport 39A Horizon Target approaching in the distance!
    const spaceportGroup = new THREE.Group();
    const rocket = createNasaRocketModel();
    rocket.scale.setScalar(1.35);
    rocket.position.set(0, 0, 0);
    spaceportGroup.add(rocket);

    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 24, 3.4),
      new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.55, metalness: 0.4 })
    );
    tower.position.set(5.6, 12, -2);
    spaceportGroup.add(tower);

    const arch = new THREE.Mesh(
      new THREE.TorusGeometry(8.5, 0.5, 8, 24, Math.PI),
      new THREE.MeshBasicMaterial({ color: '#22c55e' })
    );
    arch.position.set(0, 0, 12);
    spaceportGroup.add(arch);

    const totalDistance = 125;
    let distanceCovered = 0;
    spaceportGroup.position.set(0, 0, -totalDistance - 12);
    root.add(spaceportGroup);

    // Player's Driveable NASA Astrovan Bus + Real Cat Astronaut sitting in the driver's seat!
    const busRig = createDriveableBusModel();
    busRig.group.position.set(0, 0, 2);
    root.add(busRig.group);

    // Put the player's actual customized cat inside the transparent bus driver seat!
    const catSeatOffset = new THREE.Vector3(-0.6, 0.85, -2.5);
    actorGroup.position.copy(catSeatOffset);
    actorGroup.rotation.set(0, Math.PI, 0);
    busRig.group.add(actorGroup);

    let busX = 0;
    let wheelRot = 0;

    return {
      root,
      skyColor,
      fogColor,
      fogDensity,
      camPos,
      camLook,
      cleanup: () => {
        busRig.group.remove(actorGroup);
      },
      update: (steerX, steerY, thrustHeld, cameraMode, dt) => {
        const boost = steerY < -0.15 || thrustHeld ? 1.55 : 1.0;
        const speed = 20 * boost;
        distanceCovered = Math.min(totalDistance, distanceCovered + speed * dt);

        busX = THREE.MathUtils.clamp(busX + steerX * 9.5 * dt, -3.9, 3.9);
        busRig.group.position.x = busX;
        busRig.group.rotation.z = THREE.MathUtils.damp(busRig.group.rotation.z, -steerX * 0.08, 8, dt);
        busRig.group.rotation.y = THREE.MathUtils.damp(busRig.group.rotation.y, -steerX * 0.14, 8, dt);

        wheelRot -= speed * dt * 1.4;
        for (const w of busRig.wheels) {
          w.rotation.x = wheelRot;
        }

        for (const d of dashes) {
          d.position.z += speed * dt;
          if (d.position.z > 28) d.position.z -= 240;
        }
        for (const r of roadside) {
          r.position.z += speed * dt;
          if (r.position.z > 26) r.position.z -= 240;
        }

        const remaining = Math.max(0, totalDistance - distanceCovered);
        spaceportGroup.position.z = -remaining - 16;

        if (cameraMode === 'cockpit') {
          camPos.set(busX - 0.15, 2.35, 1.35);
          camLook.set(busX + steerX * 2.5, 1.9, -45);
        } else {
          camPos.set(busX * 0.72, 4.6, 10.6);
          camLook.set(busX * 0.85, 2.1, -18);
        }

        return {
          progressPct: Math.min(100, Math.round((distanceCovered / totalDistance) * 100)),
          distanceLeft: Math.round(remaining),
          altitude: 0,
          speedDisplay: Math.round(speed * 3.6),
          done: distanceCovered >= totalDistance,
        };
      },
    };
  }

  // PLANETARY DESCENT (Moon, Mars or Earth Return — Live 3D Touchdown!)
  const isMoon = mode === 'moon_descent';
  const isMars = mode === 'mars_descent';

  const skyColor = new THREE.Color(isMoon ? '#050814' : isMars ? '#9a3412' : '#0369a1');
  const fogColor = skyColor.clone();
  const fogDensity = isMoon ? 0.008 : 0.011;

  // Starfield / Sky Backdrop
  const starsGeo = new THREE.BufferGeometry();
  const starPts = new Float32Array(300 * 3);
  for (let i = 0; i < 300; i++) {
    starPts[i * 3] = (Math.random() - 0.5) * 160;
    starPts[i * 3 + 1] = 15 + Math.random() * 80;
    starPts[i * 3 + 2] = (Math.random() - 0.5) * 160;
  }
  starsGeo.setAttribute('position', new THREE.BufferAttribute(starPts, 3));
  root.add(new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 0.7 })));

  // Terrain Plane
  const groundMat = isMoon || isMars
    ? new THREE.MeshStandardMaterial({
        map: getTerrainTexture(isMoon ? 'moon' : 'mars'),
        roughness: 0.9,
      })
    : new THREE.MeshStandardMaterial({ color: '#0284c7', roughness: 0.25, metalness: 0.3 });

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  root.add(ground);

  // Surface Craters / Boulders / Buoys around Landing Zone
  const rockMat = new THREE.MeshStandardMaterial({
    color: isMoon ? '#94a3b8' : isMars ? '#b45309' : '#f8fafc',
    roughness: 0.9,
  });
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2;
    const rad = 12 + (i % 4) * 7;
    const rock = new THREE.Mesh(
      isMoon ? new THREE.TorusGeometry(1.8 + (i % 3), 0.35, 8, 16) : new THREE.DodecahedronGeometry(1.4 + (i % 3) * 0.5, 0),
      rockMat
    );
    if (isMoon) rock.rotation.x = -Math.PI / 2;
    rock.position.set(Math.cos(ang) * rad, isMoon ? 0.1 : 0.8, Math.sin(ang) * rad);
    root.add(rock);
  }

  // Illuminated Landing Pad Target at (0, 0, 0)
  const padBase = new THREE.Mesh(
    new THREE.CylinderGeometry(5.5, 6.2, 0.45, 24),
    new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.6, roughness: 0.4 })
  );
  padBase.position.y = 0.22;
  root.add(padBase);

  const padRing = new THREE.Mesh(
    new THREE.RingGeometry(4.2, 5.1, 32),
    new THREE.MeshBasicMaterial({ color: '#22c55e', side: THREE.DoubleSide })
  );
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.y = 0.47;
  root.add(padRing);

  // Player's Descending ABSIDIAN-1 Spacecraft with Thrusters & Visible Cat Inside Glass Canopy!
  const lander = createFlightRocketExterior();
  lander.legsGroup.visible = true;
  let shipX = -3.8;
  let shipZ = 2.5;
  let altitude = 34;
  const startAlt = altitude;
  lander.group.position.set(shipX, altitude, shipZ);
  root.add(lander.group);

  // Place player cat inside cockpit canopy area so player sits right in it
  actorGroup.position.set(0, 3.6, 0.3);
  actorGroup.scale.setScalar(0.45);
  lander.group.add(actorGroup);

  return {
    root,
    skyColor,
    fogColor,
    fogDensity,
    camPos,
    camLook,
    cleanup: () => {
      lander.group.remove(actorGroup);
      actorGroup.scale.setScalar(1);
    },
    update: (steerX, steerY, thrustHeld, cameraMode, dt, elapsed) => {
      // Steer rocket horizontally over the glowing landing pad
      shipX = THREE.MathUtils.clamp(shipX + steerX * 7.5 * dt - shipX * 0.28 * dt, -10, 10);
      shipZ = THREE.MathUtils.clamp(shipZ + steerY * 7.5 * dt - shipZ * 0.28 * dt, -10, 10);

      const fallSpeed = thrustHeld ? 3.2 : 6.2;
      altitude = Math.max(0.25, altitude - fallSpeed * dt);

      lander.group.position.set(shipX, altitude, shipZ);
      lander.group.rotation.z = THREE.MathUtils.damp(lander.group.rotation.z, -steerX * 0.22, 6, dt);
      lander.group.rotation.x = THREE.MathUtils.damp(lander.group.rotation.x, steerY * 0.22, 6, dt);

      const flameBoost = thrustHeld ? 1.45 : 0.72;
      lander.flame.scale.set(
        thrustHeld ? 1.2 : 0.85,
        flameBoost + Math.sin(elapsed * 26) * 0.22,
        thrustHeld ? 1.2 : 0.85
      );

      padRing.scale.setScalar(1 + Math.sin(elapsed * 4) * 0.06);

      if (cameraMode === 'cockpit') {
        camPos.set(shipX * 0.9, altitude + 4.3, shipZ + 1.2);
        camLook.set(shipX * 0.4, 0.5, shipZ * 0.4);
      } else {
        camPos.set(shipX + 8.5, altitude + 6.5, shipZ + 11.5);
        camLook.set(shipX * 0.6, Math.max(1, altitude * 0.65), shipZ * 0.6);
      }

      return {
        progressPct: Math.min(100, Math.round(((startAlt - altitude) / (startAlt - 0.25)) * 100)),
        distanceLeft: Math.round(altitude),
        altitude: Math.round(altitude),
        speedDisplay: Math.round(fallSpeed * 3.6),
        done: altitude <= 0.3,
      };
    },
  };
}
