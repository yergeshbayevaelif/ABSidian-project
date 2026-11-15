import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BuildingInstance,
  Difficulty,
  LiveTransitMode,
  PlayerCustomization,
  PrologueSystems,
  RemotePlayer,
  RocketCameraMode,
  SceneWorldId,
  TimeOfDay,
  WorldInteractable,
} from '../types/game';
import {
  AnimatedActorRefs,
  createCatAstronautModel,
  createHelperRoverModel,
} from '../game/models';
import { BuiltWorld, buildSceneWorld } from '../game/worldBuilder';
import { createLiveTransitController, LiveTransitController } from '../game/transitBuilder';
import { soundEngine } from '../audio/soundEngine';

interface GameCanvas3DProps {
  sceneId: SceneWorldId;
  player: PlayerCustomization;
  difficulty: Difficulty;
  prologue: PrologueSystems;
  buildings: BuildingInstance[];
  completedMissions: string[];
  timeOfDay: TimeOfDay;
  paused: boolean;
  remotePlayers: RemotePlayer[];
  joystickInput: { x: number; y: number };
  roverScanPulse: number;
  isSeated?: boolean;
  launchShake?: boolean;
  liveTransitMode?: LiveTransitMode;
  rocketCameraMode?: RocketCameraMode;
  onNearbyInteractable: (item: WorldInteractable | null) => void;
  onPlayerMoveSync: (pos: { x: number; y: number; z: number; rotY: number; moving: boolean }) => void;
  onPlayerPosUpdate: (pos: { x: number; z: number }) => void;
  onTriggerInteract: (item: WorldInteractable) => void;
  onTransitUpdate?: (info: {
    progressPct: number;
    distanceLeft: number;
    altitude: number;
    speedDisplay: number;
  }) => void;
  onTransitComplete?: (mode: Exclude<LiveTransitMode, null>) => void;
}

const _camTarget = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();

export const GameCanvas3D: React.FC<GameCanvas3DProps> = ({
  sceneId,
  player,
  difficulty,
  prologue,
  buildings,
  completedMissions,
  timeOfDay,
  paused,
  remotePlayers,
  joystickInput,
  roverScanPulse,
  isSeated = false,
  launchShake = false,
  liveTransitMode = null,
  rocketCameraMode = 'cockpit',
  onNearbyInteractable,
  onPlayerMoveSync,
  onPlayerPosUpdate,
  onTriggerInteract,
  onTransitUpdate,
  onTransitComplete,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Refs to keep Three.js loop decoupled from React re-renders
  const stateRef = useRef({
    sceneId,
    player,
    difficulty,
    prologue,
    buildings,
    completedMissions,
    timeOfDay,
    paused,
    remotePlayers,
    joystickInput,
    roverScanPulse,
    isSeated,
    launchShake,
    liveTransitMode,
    rocketCameraMode,
  });
  stateRef.current = {
    sceneId,
    player,
    difficulty,
    prologue,
    buildings,
    completedMissions,
    timeOfDay,
    paused,
    remotePlayers,
    joystickInput,
    roverScanPulse,
    isSeated,
    launchShake,
    liveTransitMode,
    rocketCameraMode,
  };

  const callbacksRef = useRef({
    onNearbyInteractable,
    onPlayerMoveSync,
    onPlayerPosUpdate,
    onTriggerInteract,
    onTransitUpdate,
    onTransitComplete,
  });
  callbacksRef.current = {
    onNearbyInteractable,
    onPlayerMoveSync,
    onPlayerPosUpdate,
    onTriggerInteract,
    onTransitUpdate,
    onTransitComplete,
  };

  const rebuildFlagRef = useRef(0);
  const worldKey = `${sceneId}|${prologue.stabilized}|${prologue.generatorRepaired}|${prologue.ventCleared}|${prologue.ventilationPower >= 25}|${prologue.waterPower >= 25}|${buildings.length}|${buildings.map((b) => `${b.id}:${b.powered}`).join(',')}|${completedMissions.join(',')}|${timeOfDay}`;
  const prevWorldKeyRef = useRef('');
  const lastSceneIdRef = useRef<SceneWorldId>(sceneId);

  useEffect(() => {
    if (prevWorldKeyRef.current !== worldKey) {
      prevWorldKeyRef.current = worldKey;
      rebuildFlagRef.current += 1;
    }
  }, [worldKey]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(
      54,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      240
    );

    // Three-Point / Atmospheric Lighting Rig
    const hemiLight = new THREE.HemisphereLight('#93c5fd', '#1e293b', 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight('#fffbeb', 1.45);
    keyLight.position.set(18, 28, 16);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.left = -28;
    keyLight.shadow.camera.right = 28;
    keyLight.shadow.camera.top = 28;
    keyLight.shadow.camera.bottom = -28;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.45);
    rimLight.position.set(-16, 12, -20);
    scene.add(rimLight);

    // Player Cat Astronaut
    let currentPlayerKey = `${stateRef.current.player.breed}_${stateRef.current.player.suitColor}_${stateRef.current.player.accentColor}_${stateRef.current.player.wearingSuit}_${stateRef.current.player.decorations.join(',')}`;
    let actor: AnimatedActorRefs = createCatAstronautModel(
      stateRef.current.player.breed,
      stateRef.current.player.suitColor,
      stateRef.current.player.accentColor,
      isSoftwareGl,
      {
        wearingSuit: stateRef.current.player.wearingSuit,
        decorations: stateRef.current.player.decorations,
      }
    );
    scene.add(actor.group);

    // Helper Rover Robot (Only visible on Engineer/Normal difficulty!)
    const rover = createHelperRoverModel();
    rover.visible = stateRef.current.difficulty === 'engineer';
    scene.add(rover);

    // Remote Multiplayer Cat Astronauts Map
    const remoteMeshes = new Map<string, AnimatedActorRefs>();

    let builtWorld: BuiltWorld | null = null;
    let builtVersion = -1;
    let transitCtrl: LiveTransitController | null = null;
    let activeTransitKey: LiveTransitMode = null;
    let transitFinished = false;
    let lastTransitUiPush = 0;
    let pilotSteerX = 0;
    let pilotSteerY = 0;
    let playerPos = new THREE.Vector3(0, 0, 6);
    let playerVelY = 0;
    let playerRotY = 0;
    let walkPhase = 0;
    let camYaw = 0;
    let camPitch = 0.52;
    let isDragging = false;
    let lastMouseX = 0;
    let lastMouseY = 0;
    let lastSyncTime = 0;
    let lastNearbyId = '';
    let roverPos = new THREE.Vector3(-2.2, 0, 7.5);
    let lastScanSeen = 0;
    let roverScanRingTimer = 0;

    const roverScanRing = new THREE.Mesh(
      new THREE.RingGeometry(0.4, 2.5, 32),
      new THREE.MeshBasicMaterial({ color: '#06b6d4', side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    roverScanRing.rotation.x = -Math.PI / 2;
    roverScanRing.position.y = 0.08;
    scene.add(roverScanRing);

    const loadWorld = (resetSpawn: boolean) => {
      if (builtWorld) {
        scene.remove(builtWorld.root);
      }
      const st = stateRef.current;
      builtWorld = buildSceneWorld(st.sceneId, {
        prologue: st.prologue,
        buildings: st.buildings,
        completedMissions: st.completedMissions,
        timeOfDay: st.timeOfDay,
        isSoftwareGl,
      });
      scene.add(builtWorld.root);
      scene.background = builtWorld.skyColor;
      scene.fog = new THREE.FogExp2(builtWorld.fogColor.getHex(), builtWorld.fogDensity);

      // Adjust key light intensity for Daylight / Twilight / Night!
      if (st.sceneId === 'lab_2140') {
        keyLight.intensity = st.prologue.stabilized ? 1.2 : 0.35;
        hemiLight.intensity = st.prologue.stabilized ? 0.8 : 0.3;
      } else if (st.timeOfDay === 'daylight') {
        keyLight.intensity = st.sceneId === 'mars' ? 1.85 : 1.7;
        keyLight.color.set('#fffbeb');
        hemiLight.intensity = st.sceneId === 'mars' ? 1.1 : 0.85;
      } else if (st.timeOfDay === 'twilight') {
        keyLight.intensity = 1.05;
        keyLight.color.set('#fdba74');
        hemiLight.intensity = 0.6;
      } else {
        keyLight.intensity = 0.42;
        keyLight.color.set('#93c5fd');
        hemiLight.intensity = 0.32;
      }

      if (resetSpawn) {
        playerPos.set(builtWorld.spawn.x, 0, builtWorld.spawn.z);
        roverPos.set(builtWorld.spawn.x - 2.2, 0, builtWorld.spawn.z + 1.4);
      }
      builtVersion = rebuildFlagRef.current;
    };

    loadWorld(true);
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Input Tracking
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const code = e.code;
      keys.add(code);
      if (code === 'KeyE') {
        const st = stateRef.current;
        if (!st.paused && builtWorld) {
          let closest: WorldInteractable | null = null;
          let minD = Infinity;
          for (const item of builtWorld.interactables) {
            const dx = playerPos.x - item.x;
            const dz = playerPos.z - item.z;
            const d = Math.hypot(dx, dz);
            if (d <= item.radius && d < minD) {
              minD = d;
              closest = item;
            }
          }
          if (closest) {
            callbacksRef.current.onTriggerInteract(closest);
          }
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.code);

    const canvasEl = renderer.domElement;
    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      camYaw -= dx * 0.006;
      camPitch = THREE.MathUtils.clamp(camPitch + dy * 0.004, 0.2, 1.15);
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onResize);
    canvasEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const collidesAt = (x: number, z: number): boolean => {
      if (!builtWorld) return false;
      if (Math.abs(x) > builtWorld.bounds || Math.abs(z) > builtWorld.bounds) return true;
      for (const box of builtWorld.collisions) {
        if (x > box.minX && x < box.maxX && z > box.minZ && z < box.maxZ) {
          return true;
        }
      }
      return false;
    };

    function tick() {
      if (disposed) return;
      const dt = Math.min(0.08, clock.getDelta());
      const elapsed = clock.getElapsedTime();
      const st = stateRef.current;

      // Handle Live 3D Transit Transitions (Bus Driving or Planetary Descent — ZERO Loading Screens!)
      if (st.liveTransitMode !== activeTransitKey) {
        if (transitCtrl) {
          transitCtrl.cleanup();
          scene.remove(transitCtrl.root);
          scene.add(actor.group);
          actor.group.scale.setScalar(1);
          transitCtrl = null;
        }
        activeTransitKey = st.liveTransitMode;
        transitFinished = false;

        if (activeTransitKey) {
          if (builtWorld) builtWorld.root.visible = false;
          rover.visible = false;
          actor.group.visible = true;
          actor.leftLeg.rotation.x = -Math.PI / 2;
          actor.rightLeg.rotation.x = -Math.PI / 2;
          actor.leftArm.rotation.x = -0.45;
          actor.rightArm.rotation.x = -0.45;
          transitCtrl = createLiveTransitController(activeTransitKey, actor.group);
          scene.add(transitCtrl.root);
          scene.background = transitCtrl.skyColor;
          scene.fog = new THREE.FogExp2(transitCtrl.fogColor.getHex(), transitCtrl.fogDensity);
          keyLight.intensity = activeTransitKey === 'bus_drive' ? 1.85 : 1.45;
          hemiLight.intensity = activeTransitKey === 'bus_drive' ? 1.1 : 0.7;
        } else {
          if (builtWorld) {
            builtWorld.root.visible = true;
            scene.background = builtWorld.skyColor;
            scene.fog = new THREE.FogExp2(builtWorld.fogColor.getHex(), builtWorld.fogDensity);
          }
          actor.group.visible = true;
        }
      }

      if (transitCtrl && activeTransitKey) {
        let steerX = st.joystickInput.x;
        let steerY = st.joystickInput.y;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) steerX -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) steerX += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) steerY -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) steerY += 1;
        const thrustHeld = keys.has('Space') || keys.has('KeyW') || keys.has('ArrowUp');

        const info = transitCtrl.update(
          THREE.MathUtils.clamp(steerX, -1, 1),
          THREE.MathUtils.clamp(steerY, -1, 1),
          thrustHeld,
          st.rocketCameraMode,
          dt,
          elapsed
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, transitCtrl.camPos.x, 8, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, transitCtrl.camPos.y, 8, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, transitCtrl.camPos.z, 8, dt);
        camera.lookAt(transitCtrl.camLook);

        if (elapsed - lastTransitUiPush > 0.1) {
          lastTransitUiPush = elapsed;
          callbacksRef.current.onTransitUpdate?.(info);
        }
        if (info.done && !transitFinished) {
          transitFinished = true;
          const completedMode = activeTransitKey;
          callbacksRef.current.onTransitComplete?.(completedMode);
        }

        renderer.render(scene, camera);
        if (isSoftwareGl) afterDraw(tick);
        else frameId = requestAnimationFrame(tick);
        return;
      }

      // Check scene switch or world rebuild
      if (lastSceneIdRef.current !== st.sceneId) {
        lastSceneIdRef.current = st.sceneId;
        loadWorld(true);
      } else if (builtVersion !== rebuildFlagRef.current) {
        loadWorld(false);
      }

      // Check player customization / suit / decorations update
      const pKey = `${st.player.breed}_${st.player.suitColor}_${st.player.accentColor}_${st.player.wearingSuit}_${st.player.decorations.join(',')}`;
      if (pKey !== currentPlayerKey) {
        currentPlayerKey = pKey;
        scene.remove(actor.group);
        actor = createCatAstronautModel(
          st.player.breed,
          st.player.suitColor,
          st.player.accentColor,
          isSoftwareGl,
          {
            wearingSuit: st.player.wearingSuit,
            decorations: st.player.decorations,
          }
        );
        scene.add(actor.group);
      }

      // Helper Rover visibility (Engineer / Normal mode!)
      rover.visible = st.difficulty === 'engineer' && st.sceneId !== 'spacecraft';
      if (st.roverScanPulse !== lastScanSeen) {
        lastScanSeen = st.roverScanPulse;
        roverScanRingTimer = 1.4;
      }

      // Movement & Physics when not paused and NOT strapped into cockpit seat
      let moving = false;
      if (st.isSeated && st.sceneId === 'spacecraft') {
        playerPos.set(2.6, 0.38, -5.8);
        playerRotY = Math.PI;
        // Player steers the Rocket while seated in the cockpit OR in exterior camera!
        let sx = st.joystickInput.x;
        let sy = -st.joystickInput.y;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) sx -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) sx += 1;
        if (keys.has('KeyW') || keys.has('ArrowUp')) sy += 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) sy -= 1;
        pilotSteerX = THREE.MathUtils.damp(pilotSteerX, THREE.MathUtils.clamp(sx, -1, 1), 6, dt);
        pilotSteerY = THREE.MathUtils.damp(pilotSteerY, THREE.MathUtils.clamp(sy, -1, 1), 6, dt);

        if (!st.paused && builtWorld) {
          let closest: WorldInteractable | null = null;
          let minD = Infinity;
          for (const item of builtWorld.interactables) {
            const d = Math.hypot(playerPos.x - item.x, playerPos.z - item.z);
            if (d <= item.radius && d < minD) {
              minD = d;
              closest = item;
            }
          }
          const nextId = closest?.id || '';
          if (nextId !== lastNearbyId) {
            lastNearbyId = nextId;
            callbacksRef.current.onNearbyInteractable(closest);
          }
        }
      } else if (!st.paused && builtWorld) {
        let inX = st.joystickInput.x;
        let inZ = st.joystickInput.y;

        if (keys.has('KeyW') || keys.has('ArrowUp')) inZ -= 1;
        if (keys.has('KeyS') || keys.has('ArrowDown')) inZ += 1;
        if (keys.has('KeyA') || keys.has('ArrowLeft')) inX -= 1;
        if (keys.has('KeyD') || keys.has('ArrowRight')) inX += 1;

        const len = Math.hypot(inX, inZ);
        if (len > 0.08) {
          moving = true;
          inX /= Math.max(1, len);
          inZ /= Math.max(1, len);

          const sinY = Math.sin(camYaw);
          const cosY = Math.cos(camYaw);
          const worldMoveX = inX * cosY + inZ * sinY;
          const worldMoveZ = -inX * sinY + inZ * cosY;

          const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 1.4 : 1.0;
          const speed = (st.sceneId === 'moon' ? 6.8 : 6.2) * sprint;
          const nx = playerPos.x + worldMoveX * speed * dt;
          const nz = playerPos.z + worldMoveZ * speed * dt;

          if (!collidesAt(nx, playerPos.z)) playerPos.x = nx;
          if (!collidesAt(playerPos.x, nz)) playerPos.z = nz;

          const targetRot = Math.atan2(worldMoveX, worldMoveZ);
          let diff = targetRot - playerRotY;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          playerRotY += diff * Math.min(1, dt * 12);

          walkPhase += dt * 11;
          if (Math.sin(walkPhase) > 0.94 && playerPos.y <= 0.05) {
            soundEngine.playFootstep();
          }
        }

        const gravity = st.sceneId === 'moon' ? -6.2 : st.sceneId === 'mars' ? -10.5 : -20.0;
        const jumpPower = st.sceneId === 'moon' ? 4.4 : st.sceneId === 'mars' ? 5.2 : 6.6;
        if (keys.has('Space') && playerPos.y <= 0.01) {
          playerVelY = jumpPower;
        }
        playerVelY += gravity * dt;
        playerPos.y = Math.max(0, playerPos.y + playerVelY * dt);
        if (playerPos.y === 0) playerVelY = 0;

        let closest: WorldInteractable | null = null;
        let minD = Infinity;
        for (const item of builtWorld.interactables) {
          const d = Math.hypot(playerPos.x - item.x, playerPos.z - item.z);
          if (d <= item.radius && d < minD) {
            minD = d;
            closest = item;
          }
        }
        const nextId = closest?.id || '';
        if (nextId !== lastNearbyId) {
          lastNearbyId = nextId;
          callbacksRef.current.onNearbyInteractable(closest);
        }
      }

      // Animate Player Cat Astronaut (Walking OR Seated in Rocket Seat!)
      actor.group.position.copy(playerPos);
      actor.group.rotation.y = playerRotY;
      if (actor.droneRef) {
        actor.droneRef.position.y = 1.92 + Math.sin(elapsed * 3.5) * 0.1;
        actor.droneRef.rotation.y = elapsed * 1.8;
      }
      if (st.isSeated && st.sceneId === 'spacecraft') {
        actor.leftLeg.rotation.x = -Math.PI / 2;
        actor.rightLeg.rotation.x = -Math.PI / 2;
        actor.leftArm.rotation.x = -0.35;
        actor.rightArm.rotation.x = -0.35;
        actor.tail.rotation.y = Math.sin(elapsed * 1.5) * 0.1;
      } else if (moving) {
        const swing = Math.sin(walkPhase) * 0.55;
        actor.leftLeg.rotation.x = swing;
        actor.rightLeg.rotation.x = -swing;
        actor.leftArm.rotation.x = -swing * 0.7;
        actor.rightArm.rotation.x = swing * 0.7;
        actor.tail.rotation.y = Math.sin(walkPhase * 1.3) * 0.35;
      } else {
        actor.leftLeg.rotation.x = THREE.MathUtils.damp(actor.leftLeg.rotation.x, 0, 10, dt);
        actor.rightLeg.rotation.x = THREE.MathUtils.damp(actor.rightLeg.rotation.x, 0, 10, dt);
        actor.leftArm.rotation.x = THREE.MathUtils.damp(actor.leftArm.rotation.x, 0, 10, dt);
        actor.rightArm.rotation.x = THREE.MathUtils.damp(actor.rightArm.rotation.x, 0, 10, dt);
        actor.tail.rotation.y = Math.sin(elapsed * 2.2) * 0.2;
      }

      // Helper Rover Follow Logic
      if (rover.visible) {
        const targetRX = playerPos.x - Math.sin(playerRotY + 0.8) * 2.3;
        const targetRZ = playerPos.z - Math.cos(playerRotY + 0.8) * 2.3;
        roverPos.x = THREE.MathUtils.damp(roverPos.x, targetRX, 3.2, dt);
        roverPos.z = THREE.MathUtils.damp(roverPos.z, targetRZ, 3.2, dt);
        rover.position.set(roverPos.x, Math.sin(elapsed * 5) * 0.015, roverPos.z);
        rover.rotation.y = Math.atan2(playerPos.x - roverPos.x, playerPos.z - roverPos.z);

        if (roverScanRingTimer > 0) {
          roverScanRingTimer -= dt;
          roverScanRing.position.set(roverPos.x, 0.08, roverPos.z);
          const p = 1 - roverScanRingTimer / 1.4;
          roverScanRing.scale.setScalar(0.5 + p * 3.5);
          (roverScanRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - p);
        } else {
          (roverScanRing.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // Sync Remote Multiplayer Cat Astronauts
      const activeIds = new Set<string>();
      st.remotePlayers.forEach((rp) => {
        if (rp.id === st.player.id || rp.sceneId !== st.sceneId) return;
        activeIds.add(rp.id);
        let meshRef = remoteMeshes.get(rp.id);
        if (!meshRef) {
          meshRef = createCatAstronautModel(
            (rp.breed as PlayerCustomization['breed']) || 'tabby',
            rp.suitColor || '#f1f5f9',
            rp.accentColor || '#06b6d4',
            isSoftwareGl
          );
          scene.add(meshRef.group);
          remoteMeshes.set(rp.id, meshRef);
        }
        meshRef.group.position.x = THREE.MathUtils.damp(meshRef.group.position.x, rp.x, 8, dt);
        meshRef.group.position.y = THREE.MathUtils.damp(meshRef.group.position.y, rp.y, 8, dt);
        meshRef.group.position.z = THREE.MathUtils.damp(meshRef.group.position.z, rp.z, 8, dt);
        meshRef.group.rotation.y = rp.rotY;
        if (rp.moving) {
          const s = Math.sin(elapsed * 10) * 0.5;
          meshRef.leftLeg.rotation.x = s;
          meshRef.rightLeg.rotation.x = -s;
        }
      });
      for (const [id, meshRef] of remoteMeshes.entries()) {
        if (!activeIds.has(id)) {
          scene.remove(meshRef.group);
          remoteMeshes.delete(id);
        }
      }

      // Animate world props & Live Spacecraft Flight Motion
      const isExteriorRocket = st.sceneId === 'spacecraft' && st.rocketCameraMode === 'exterior';
      actor.group.visible = !isExteriorRocket;
      if (builtWorld) {
        for (const fn of builtWorld.animatedProps) {
          fn(elapsed, dt);
        }
        if (builtWorld.spaceMotionUpdate) {
          builtWorld.spaceMotionUpdate(
            st.isSeated ? pilotSteerX : 0,
            st.isSeated ? pilotSteerY : 0,
            dt,
            elapsed,
            isExteriorRocket
          );
        }
      }

      // Damped Camera (Cockpit Seated, Exterior Space Flight, or Standard Third-Person)
      if (isExteriorRocket) {
        const shakeX = st.launchShake ? (Math.random() - 0.5) * 0.14 : 0;
        const shakeY = st.launchShake ? (Math.random() - 0.5) * 0.14 : 0;
        _desiredCamPos.set(pilotSteerX * 2.2 + 3.8 + shakeX, 4.4 + pilotSteerY * 1.1 + shakeY, -3.5);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 6, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 6, dt);
        _camTarget.set(pilotSteerX * 1.6, 2.5 + pilotSteerY * 1.0, -24);
        camera.lookAt(_camTarget);
      } else if (st.isSeated && st.sceneId === 'spacecraft') {
        const shakeX = st.launchShake ? (Math.random() - 0.5) * 0.09 : 0;
        const shakeY = st.launchShake ? (Math.random() - 0.5) * 0.09 : 0;
        _desiredCamPos.set(1.3 + shakeX, 3.0 + shakeY, -2.1);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 6, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 6, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 6, dt);
        _camTarget.set(0.4 + pilotSteerX * 3.5, 2.3 + pilotSteerY * 2.5, -18);
        camera.lookAt(_camTarget);
      } else {
        const camDist = st.sceneId === 'spacecraft' ? 6.2 : 9.2;
        const horiz = Math.cos(camPitch) * camDist;
        const vert = Math.sin(camPitch) * camDist + 1.8;
        _desiredCamPos.set(
          playerPos.x + Math.sin(camYaw) * horiz,
          playerPos.y + vert,
          playerPos.z + Math.cos(camYaw) * horiz
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _desiredCamPos.x, 7, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _desiredCamPos.y, 7, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _desiredCamPos.z, 7, dt);
        _camTarget.set(playerPos.x, playerPos.y + 1.35, playerPos.z);
        camera.lookAt(_camTarget);
      }

      // Periodic sync for radar & multiplayer
      if (elapsed - lastSyncTime > 0.12) {
        lastSyncTime = elapsed;
        callbacksRef.current.onPlayerPosUpdate({ x: playerPos.x, z: playerPos.z });
        callbacksRef.current.onPlayerMoveSync({
          x: Number(playerPos.x.toFixed(2)),
          y: Number(playerPos.y.toFixed(2)),
          z: Number(playerPos.z.toFixed(2)),
          rotY: Number(playerRotY.toFixed(2)),
          moving,
        });
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('resize', onResize);
      canvasEl.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
};
