import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Sliders, Trash2, Volume2, X } from 'lucide-react';
import {
  ActiveMiniGame,
  BuildingInstance,
  BuildingType,
  Difficulty,
  DialogueNode,
  GameStateId,
  InventoryItem,
  JournalEntry,
  Language,
  LiveTransitMode,
  MissionDesignConfig,
  PlayerCustomization,
  PrologueSystems,
  RemotePlayer,
  ResourcesState,
  RocketCameraMode,
  SaveProgressPayload,
  SceneWorldId,
  SpaceWeatherData,
  TimeOfDay,
  WorldInteractable,
} from './types/game';
import { INITIAL_JOURNAL } from './data/storyData';
import { t } from './i18n/translations';
import { soundEngine } from './audio/soundEngine';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreator } from './components/CharacterCreator';
import { BackstoryCinematic } from './components/BackstoryCinematic';
import { GameCanvas3D } from './components/GameCanvas3D';
import { GameHUD } from './components/GameHUD';
import { EngineeringModals } from './components/EngineeringModals';
import { MultiplayerModal } from './components/MultiplayerModal';
import { DebriefCertificate } from './components/DebriefCertificate';
import { SpaceTravelMapModal } from './components/SpaceTravelMapModal';
import { DailyStreakModal } from './components/DailyStreakModal';
import { CosmeticsShopModal } from './components/CosmeticsShopModal';

const SAVE_STORAGE_KEY = 'absidian_save_v1';

const DEFAULT_PLAYER: PlayerCustomization = {
  id: `CAT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  name: 'Капитан Мурзик',
  breed: 'tabby',
  suitColor: '#f1f5f9',
  accentColor: '#06b6d4',
  accessory: 'visor_gold',
  specialization: 'systems',
  skinId: 'artemis_classic',
  decorations: [],
  wearingSuit: false,
  isGuest: true,
};

const DEFAULT_RESOURCES: ResourcesState = {
  health: 100,
  oxygen: 100,
  suitEnergy: 100,
  stamina: 100,
  basePowerGenerated: 20,
  basePowerUsed: 10,
  o2Reserve: 85,
  waterReserve: 85,
  foodReserve: 90,
  radiationExposure: 4,
  commsStrength: 80,
  sciencePoints: 0,
  credits: 150,
};

const DEFAULT_PROLOGUE: PrologueSystems = {
  ventilationPower: 15,
  waterPower: 10,
  commsPower: 5,
  labPower: 20,
  generatorRepaired: false,
  ventCleared: false,
  stabilized: false,
};

const DEFAULT_DESIGN: MissionDesignConfig = {
  solarPanels: 2,
  o2Tanks: 2,
  waterTanks: 2,
  foodPacks: 2,
  greenhouseKit: true,
  scienceRig: false,
  radiationShielding: 2,
};

const DEFAULT_INVENTORY: InventoryItem[] = [
  { id: 'parts', nameEn: 'Repair Parts', nameRu: 'Запчасти', qty: 6, icon: 'wrench' },
  { id: 'alloys', nameEn: 'Base Alloys', nameRu: 'Строительные сплавы', qty: 14, icon: 'box' },
  { id: 'seeds', nameEn: 'Hydroponic Seeds', nameRu: 'Семена для оранжереи', qty: 4, icon: 'leaf' },
];

export default function App() {
  const [language, setLanguage] = useState<Language>('ru');
  const [difficulty, setDifficulty] = useState<Difficulty>('engineer');
  const [player, setPlayer] = useState<PlayerCustomization>(DEFAULT_PLAYER);
  const [gameState, setGameState] = useState<GameStateId>('TITLE_SCREEN');
  const [sceneId, setSceneId] = useState<SceneWorldId>('lab_2140');
  const [resources, setResources] = useState<ResourcesState>(DEFAULT_RESOURCES);
  const [prologue, setPrologue] = useState<PrologueSystems>(DEFAULT_PROLOGUE);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [buildings, setBuildings] = useState<BuildingInstance[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
  const [journal, setJournal] = useState<JournalEntry[]>(INITIAL_JOURNAL);
  const [missionDesign, setMissionDesign] = useState<MissionDesignConfig>(DEFAULT_DESIGN);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('daylight');

  // Transient UI states
  const [nearbyItem, setNearbyItem] = useState<WorldInteractable | null>(null);
  const [playerPos, setPlayerPos] = useState({ x: 0, z: 6 });
  const [joystickInput, setJoystickInput] = useState({ x: 0, y: 0 });
  const [activeMiniGame, setActiveMiniGame] = useState<ActiveMiniGame | null>(null);
  const [dialogueQueue, setDialogueQueue] = useState<DialogueNode[]>([]);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [liveTransitMode, setLiveTransitMode] = useState<LiveTransitMode>(null);
  const [rocketCameraMode, setRocketCameraMode] = useState<RocketCameraMode>('cockpit');
  const [transitInfo, setTransitInfo] = useState({
    progressPct: 0,
    distanceLeft: 125,
    altitude: 34,
    speedDisplay: 72,
  });
  const [roverScanPulse, setRoverScanPulse] = useState(0);
  const [roverTip, setRoverTip] = useState<string | null>(null);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeatherData | null>(null);

  // Progression, Daily Streak, Skins Shop & Rocket Cockpit States
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streakDays, setStreakDays] = useState(0);
  const [lastStreakClaim, setLastStreakClaim] = useState('');
  const [ownedSkins, setOwnedSkins] = useState<string[]>(['artemis_classic']);
  const [ownedDecorations, setOwnedDecorations] = useState<string[]>([]);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [showShopModal, setShowShopModal] = useState(false);
  const [isSeated, setIsSeated] = useState(false);
  const [launchCountdown, setLaunchCountdown] = useState<number | null>(null);
  const [rewardToast, setRewardToast] = useState<{ title: string; subtitle: string } | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Settings & Audio
  const [showSettings, setShowSettings] = useState(false);
  const [showTravelMap, setShowTravelMap] = useState(false);
  const [unlockedScenes, setUnlockedScenes] = useState<SceneWorldId[]>(['lab_2140']);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const [volume, setVolume] = useState(0.45);
  const [hasSave, setHasSave] = useState(false);

  // Multiplayer WebSocket state
  const [showMultiplayer, setShowMultiplayer] = useState(false);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayer[]>([]);
  const [mpError, setMpError] = useState<string | null>(null);
  const [lastComms, setLastComms] = useState<Array<{ id: string; sender: string; phraseKey: string }>>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const todayKey = new Date().toISOString().slice(0, 10);
  const canClaimStreak = lastStreakClaim !== todayKey;

  const ru = language === 'ru';
  const txt = t(language);

  // Check local save on mount & fetch real NASA DONKI data
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY);
      if (raw) setHasSave(true);
    } catch {
      // Ignore storage error
    }

    fetch('/api/nasa/space-weather')
      .then((r) => r.json())
      .then((d: SpaceWeatherData) => setSpaceWeather(d))
      .catch(() => {});
  }, []);

  // Auto-save progress whenever gameplay advances
  useEffect(() => {
    if (gameState === 'TITLE_SCREEN' || gameState === 'PLAYER_SETUP') return;
    try {
      const payload: SaveProgressPayload = {
        version: 1,
        language,
        difficulty,
        player,
        gameState,
        sceneId,
        resources,
        prologue,
        completedMissions,
        buildings,
        inventory,
        journal,
        missionDesign,
        timeOfDay,
        xp,
        level,
        streakDays,
        lastStreakClaim,
        ownedSkins,
        ownedDecorations,
      };
      localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(payload));
      setHasSave(true);
    } catch {
      // Ignore quota errors
    }
  }, [
    language,
    difficulty,
    player,
    gameState,
    sceneId,
    resources,
    prologue,
    completedMissions,
    buildings,
    inventory,
    journal,
    missionDesign,
    timeOfDay,
    xp,
    level,
    streakDays,
    lastStreakClaim,
    ownedSkins,
    ownedDecorations,
  ]);

  // Unlock cosmic travel map nodes automatically as story progresses
  useEffect(() => {
    setUnlockedScenes((prev) => {
      const next = new Set<SceneWorldId>(prev);
      next.add('lab_2140');
      next.add(sceneId);
      if (prologue.stabilized) next.add('academy');
      if (
        completedMissions.includes('mission_planned') ||
        gameState === 'LAUNCH' ||
        gameState === 'SPACEFLIGHT' ||
        gameState === 'LUNAR_EXPLORATION' ||
        gameState === 'MARS_EXPEDITION'
      ) {
        next.add('academy');
        next.add('launchpad');
      }
      if (gameState === 'SPACEFLIGHT' || gameState === 'LUNAR_EXPLORATION' || gameState === 'MARS_EXPEDITION') {
        next.add('spacecraft');
      }
      if (gameState === 'LUNAR_EXPLORATION' || gameState === 'MARS_EXPEDITION') {
        next.add('moon');
      }
      if (buildings.filter((b) => b.planet === 'moon').length >= 2 || gameState === 'MARS_EXPEDITION') {
        next.add('mars');
      }
      if (next.size === prev.length && prev.every((s) => next.has(s))) return prev;
      return Array.from(next);
    });
  }, [sceneId, prologue.stabilized, gameState, buildings, completedMissions]);

  // Live In-Cockpit Launch Countdown sequence (3..2..1..LIFTOFF!)
  useEffect(() => {
    if (launchCountdown === null) return;
    if (launchCountdown > 0) {
      const timer = window.setTimeout(() => {
        const nextVal = launchCountdown - 1;
        if (nextVal === 0) {
          soundEngine.playRocketLaunch();
        } else {
          soundEngine.playDialogueBlip(760);
        }
        setLaunchCountdown(nextVal);
      }, 950);
      return () => window.clearTimeout(timer);
    }
    const endTimer = window.setTimeout(() => {
      setLaunchCountdown(null);
    }, 2600);
    return () => window.clearTimeout(endTimer);
  }, [launchCountdown]);

  // Persistent Survival Resource Simulation Loop (Limited Resources visibly drain!)
  useEffect(() => {
    const isDead =
      resources.health <= 0 ||
      resources.oxygen <= 0 ||
      resources.foodReserve <= 0 ||
      resources.waterReserve <= 0;

    const isPlaying3D =
      gameState !== 'TITLE_SCREEN' &&
      gameState !== 'PLAYER_SETUP' &&
      gameState !== 'INTRO_CINEMATIC' &&
      gameState !== 'MISSION_DEBRIEF' &&
      !liveTransitMode &&
      !showSettings &&
      !showTravelMap &&
      !showStreakModal &&
      !showShopModal &&
      launchCountdown === null &&
      !activeMiniGame &&
      dialogueQueue.length === 0 &&
      !isDead;

    if (!isPlaying3D) return;

    const timer = window.setInterval(() => {
      setResources((prev) => {
        const diffMult = difficulty === 'explorer' ? 0.55 : difficulty === 'engineer' ? 1.0 : 1.55;
        const planetBldgs = buildings.filter((b) => b.planet === sceneId);
        const activeSolar = planetBldgs.filter((b) => b.type === 'solar' && b.powered);
        const activeO2 = planetBldgs.some((b) => b.type === 'o2_station' && b.powered);
        const activeWater = planetBldgs.some((b) => b.type === 'water_recycler' && b.powered);
        const activeGreenhouse = planetBldgs.some((b) => b.type === 'greenhouse' && b.powered);
        const activeShield = planetBldgs.some((b) => b.type === 'shield_dome' && b.powered);

        const sunFactor = timeOfDay === 'daylight' ? 1.0 : timeOfDay === 'twilight' ? 0.55 : 0.15;
        const solarKw = activeSolar.reduce((acc, s) => acc + Math.max(8, 35 * sunFactor * (1 - s.dustLevel / 140)), 0);
        const generated = Math.round(20 + solarKw);
        const used = planetBldgs
          .filter((b) => b.powered && b.type !== 'solar')
          .reduce((acc, b) => acc + (b.type === 'science_lab' ? 20 : b.type === 'greenhouse' ? 18 : 12), 10);

        let o2Delta = 0;
        let energyDelta = -0.18 * diffMult;
        let waterDelta = -0.22 * diffMult;
        let foodDelta = -0.18 * diffMult;
        let radDelta = 0;
        let healthDelta = 0;

        if (sceneId === 'lab_2140') {
          o2Delta = (prologue.stabilized ? -0.05 : -0.45) * diffMult;
          waterDelta = (prologue.stabilized ? -0.15 : -0.35) * diffMult;
          foodDelta = -0.18 * diffMult;
        } else if (sceneId === 'academy' || sceneId === 'launchpad') {
          o2Delta = -0.06 * diffMult;
          waterDelta = -0.22 * diffMult;
          foodDelta = -0.18 * diffMult;
        } else if (sceneId === 'spacecraft') {
          o2Delta = -0.25 * diffMult;
          waterDelta = -0.28 * diffMult;
          foodDelta = -0.22 * diffMult;
          energyDelta = -0.24 * diffMult;
        } else if (sceneId === 'moon' || sceneId === 'mars') {
          o2Delta = (activeO2 ? -0.1 : -0.58) * diffMult;
          energyDelta = -0.32 * diffMult;
          waterDelta = (activeWater ? 0.08 : -0.34) * diffMult;
          foodDelta = (activeGreenhouse ? 0.1 : -0.25) * diffMult;
          radDelta = (activeShield ? -0.35 : 0.22) * diffMult;
        }

        const nextO2 = Math.max(0, Math.min(100, prev.oxygen + o2Delta));
        const nextEnergy = Math.max(0, Math.min(100, prev.suitEnergy + energyDelta));
        const nextWater = Math.max(0, Math.min(100, prev.waterReserve + waterDelta));
        const nextFood = Math.max(0, Math.min(100, prev.foodReserve + foodDelta));
        const nextRad = Math.min(100, Math.max(0, prev.radiationExposure + radDelta));

        if (nextRad > 65) {
          healthDelta -= 0.45;
        }
        const nextHealth = Math.max(0, Math.min(100, prev.health + healthDelta));

        return {
          ...prev,
          oxygen: nextO2,
          suitEnergy: nextEnergy,
          health: nextHealth,
          basePowerGenerated: generated,
          basePowerUsed: used,
          waterReserve: nextWater,
          foodReserve: nextFood,
          radiationExposure: nextRad,
        };
      });

      if (sceneId === 'mars') {
        setBuildings((prev) =>
          prev.map((b) =>
            b.planet === 'mars' && b.type === 'solar'
              ? { ...b, dustLevel: Math.min(80, b.dustLevel + 0.6) }
              : b
          )
        );
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [
    gameState,
    sceneId,
    difficulty,
    buildings,
    timeOfDay,
    liveTransitMode,
    showSettings,
    showTravelMap,
    showStreakModal,
    showShopModal,
    launchCountdown,
    activeMiniGame,
    dialogueQueue.length,
    prologue.stabilized,
    resources.health,
    resources.oxygen,
    resources.foodReserve,
    resources.waterReserve,
  ]);

  // Escape toggles Settings, M toggles Cosmic Travel Map
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Escape' && gameState !== 'TITLE_SCREEN') {
        setShowSettings((s) => !s);
      } else if (e.code === 'KeyM' && gameState !== 'TITLE_SCREEN' && gameState !== 'PLAYER_SETUP' && gameState !== 'INTRO_CINEMATIC') {
        setShowTravelMap((m) => !m);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameState]);

  // WebSocket Multiplayer Client Connection
  const connectWebSocket = useCallback(
    (onOpenAction?: (ws: WebSocket) => void) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        onOpenAction?.(wsRef.current);
        return;
      }
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        onOpenAction?.(ws);
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data) as { type: string; payload: Record<string, unknown> };
          if (msg.type === 'room:state') {
            setMpError(null);
            setRoomCode(String(msg.payload.code));
            setRemotePlayers((msg.payload.players as RemotePlayer[]) || []);
            const bldgs = msg.payload.sharedBuildings as BuildingInstance[];
            if (Array.isArray(bldgs) && bldgs.length > 0) {
              setBuildings((prev) => {
                const map = new Map(prev.map((b) => [b.id, b]));
                bldgs.forEach((b) => map.set(b.id, b));
                return Array.from(map.values());
              });
            }
          } else if (msg.type === 'player:moved') {
            const moved = msg.payload as unknown as RemotePlayer;
            setRemotePlayers((prev) => {
              const exists = prev.some((p) => p.id === moved.id);
              if (!exists) return [...prev, moved];
              return prev.map((p) => (p.id === moved.id ? moved : p));
            });
          } else if (msg.type === 'world:built') {
            const b = msg.payload as unknown as BuildingInstance;
            setBuildings((prev) => (prev.some((x) => x.id === b.id) ? prev : [...prev, b]));
          } else if (msg.type === 'chat:received') {
            const c = msg.payload as { id: string; sender: string; phraseKey: string };
            setLastComms((prev) => [...prev.slice(-8), c]);
          } else if (msg.type === 'room:error') {
            setMpError(String(msg.payload.code || 'ERROR'));
          }
        } catch {
          // Ignore invalid messages
        }
      };
    },
    []
  );

  const handlePlayerMoveSync = useCallback(
    (pos: { x: number; y: number; z: number; rotY: number; moving: boolean }) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomCode) {
        wsRef.current.send(
          JSON.stringify({
            type: 'player:move',
            payload: {
              sceneId,
              x: pos.x,
              y: pos.y,
              z: pos.z,
              rotY: pos.rotY,
              moving: pos.moving,
              oxygen: resources.oxygen,
              health: resources.health,
            },
          })
        );
      }
    },
    [roomCode, sceneId, resources.oxygen, resources.health]
  );

  const triggerToast = useCallback((title: string, subtitle: string) => {
    setRewardToast({ title, subtitle });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setRewardToast(null), 4200);
  }, []);

  const grantReward = useCallback(
    (coinsDelta: number, xpDelta: number, scienceDelta: number, labelRu: string, labelEn: string) => {
      let nextXp = xp + xpDelta;
      let nextLevel = level;
      let bonusCoins = 0;
      let bonusScience = 0;
      let leveledUp = false;

      while (nextXp >= nextLevel * 100) {
        nextXp -= nextLevel * 100;
        nextLevel += 1;
        bonusCoins += 75;
        bonusScience += 15;
        leveledUp = true;
      }

      setXp(nextXp);
      setLevel(nextLevel);
      setResources((prev) => ({
        ...prev,
        credits: prev.credits + coinsDelta + bonusCoins,
        sciencePoints: prev.sciencePoints + scienceDelta + bonusScience,
        ...(leveledUp
          ? {
              health: 100,
              oxygen: 100,
              waterReserve: 100,
              foodReserve: 100,
              suitEnergy: 100,
            }
          : {}),
      }));

      if (leveledUp) {
        soundEngine.playSuccess();
        triggerToast(
          ru ? `🎉 LEVEL UP! Уровень ${nextLevel}!` : `🎉 LEVEL UP! Level ${nextLevel}!`,
          ru
            ? `+${coinsDelta + bonusCoins} 🪙 (бонус +75!) · +${scienceDelta + bonusScience} SCI · Припасы 100%!`
            : `+${coinsDelta + bonusCoins} Coins (+75 Bonus!) · +${scienceDelta + bonusScience} SCI · Full Restore!`
        );
      } else {
        triggerToast(
          ru ? labelRu : labelEn,
          ru
            ? `+${coinsDelta} 🪙 монет · +${xpDelta} XP${scienceDelta > 0 ? ` · +${scienceDelta} SCI` : ''}`
            : `+${coinsDelta} Coins · +${xpDelta} XP${scienceDelta > 0 ? ` · +${scienceDelta} SCI` : ''}`
        );
      }
    },
    [xp, level, ru, triggerToast]
  );

  const openDialogue = (nodes: DialogueNode[]) => {
    setDialogueQueue(nodes);
    setDialogueIndex(0);
    soundEngine.playDialogueBlip();
  };

  const handleInteract = useCallback(
    (item: WorldInteractable) => {
      if (item.id === 'lab_tech_npc') {
        openDialogue([
          {
            speakerEn: 'Technician Whiskers',
            speakerRu: 'Техник Барсик',
            roleEn: 'Lab Maintenance Cat',
            roleRu: 'Инженер лаборатории',
            portraitBreed: 'ginger_white',
            textEn:
              'Solar storm 2140 knocked out power! Fix the wires on the left console, clear the leaves from the right vent, then balance power at the center breaker panel!',
            textRu:
              'Буря 2140 года обесточила центр! Соедини провода генератора слева, очисти вентиляцию от листьев справа и настрой щиток в центре!',
          },
        ]);
      } else if (item.id === 'lab_generator') {
        setActiveMiniGame({ type: 'wiring' });
      } else if (item.id === 'lab_vent_clean') {
        setActiveMiniGame({ type: 'clean_vent' });
      } else if (item.id === 'lab_power_console') {
        setActiveMiniGame({ type: 'power_divert' });
      } else if (item.id === 'lab_exit_academy') {
        setGameState('ACADEMY');
        setSceneId('academy');
        setIsSeated(false);
        setPlayer((p) => ({ ...p, wearingSuit: false }));
        openDialogue([
          {
            speakerEn: 'Unknown Transmission',
            speakerRu: 'Загадочное сообщение',
            roleEn: 'PROJECT ABSIDIAN',
            roleRu: 'ПРОЕКТ ABSIDIAN',
            portraitBreed: 'director',
            textEn:
              'Your system held when others failed. Welcome to ABSIDIAN Academy! Put on a spacesuit for vacuum drills at the Locker, swipe your ID card, and complete the labs before boarding the Crew Bus!',
            textRu:
              'Твоя система устояла! Добро пожаловать в Академию ABSIDIAN! Проведи пропуск, потренируйся (в вакууме надевай скафандр в шкафчике!), утверди план и садись в автобус на космодром!',
          },
        ]);
      } else if (item.id === 'academy_suit_up') {
        soundEngine.playRepair();
        setPlayer((prev) => {
          const nextSuit = !prev.wearingSuit;
          triggerToast(
            ru ? (nextSuit ? '🧑‍🚀 Скафандр надет!' : '👔 Обычная форма') : nextSuit ? '🧑‍🚀 Spacesuit Equipped!' : '👔 Casual Uniform',
            ru
              ? nextSuit
                ? 'Герметичный шлем и реактивный ранец готовы к космосу!'
                : 'Ты в удобной форме курсанта академии.'
              : nextSuit
              ? 'Pressurized helmet & EVA jetpack ready!'
              : 'Wearing indoor academy cadet uniform.'
          );
          return { ...prev, wearingSuit: nextSuit };
        });
      } else if (item.id === 'academy_director') {
        openDialogue([
          {
            speakerEn: 'Director Nova',
            speakerRu: 'Директор Нова',
            roleEn: 'ABSIDIAN Program Lead',
            roleRu: 'Руководитель программы ABSIDIAN',
            portraitBreed: 'director',
            textEn:
              'Before flying into space, learn how air, water, energy, and navigation work! Complete training labs, design your mission, suit up at the Locker, and board the yellow Crew Bus!',
            textRu:
              'Перед космосом изучи навигацию, щиты, ПО и вакуум! Пройди задания, утверди план миссии, надень скафандр в шкафчике и садись в жёлтый автобус экипажа!',
          },
        ]);
      } else if (item.id === 'academy_card') {
        setActiveMiniGame({ type: 'swipe_card' });
      } else if (item.id === 'train_software') {
        setActiveMiniGame({ type: 'download_data' });
      } else if (item.id === 'train_orbital') {
        setActiveMiniGame({ type: 'chart_course' });
      } else if (item.id === 'train_emergency') {
        setPlayer((p) => ({ ...p, wearingSuit: true }));
        setActiveMiniGame({ type: 'calibrate_rings' });
      } else if (item.id === 'train_habitat') {
        setActiveMiniGame({ type: 'prime_shields' });
      } else if (item.id === 'academy_mission_control') {
        setGameState('MISSION_PLANNING');
        setActiveMiniGame({ type: 'mission_planner' });
      } else if (item.id === 'academy_nasa_terminal') {
        setActiveMiniGame({ type: 'nasa_terminal' });
      } else if (item.id === 'academy_bus_board') {
        soundEngine.playSuccess();
        setPlayer((p) => ({ ...p, wearingSuit: true }));
        setIsSeated(false);
        setRocketCameraMode('cockpit');
        setTransitInfo({ progressPct: 0, distanceLeft: 125, altitude: 0, speedDisplay: 72 });
        setLiveTransitMode('bus_drive');
      } else if (item.id === 'launchpad_fuel') {
        setActiveMiniGame({ type: 'refuel_tank' });
      } else if (item.id === 'launchpad_keypad') {
        setActiveMiniGame({ type: 'keypad_code' });
      } else if (item.id === 'launchpad_board') {
        const fuelOk = completedMissions.includes('launchpad_fuel');
        const pinOk = completedMissions.includes('launchpad_keypad');
        if (!fuelOk || !pinOk) {
          soundEngine.playAlert();
          openDialogue([
            {
              speakerEn: 'Launch Control',
              speakerRu: 'Центр запуска',
              roleEn: 'Pad 39A',
              roleRu: 'Площадка 39А',
              portraitBreed: 'director',
              textEn:
                'Hold on! Before climbing up to ABSIDIAN-1, refuel the rocket on the right pad and enter the 5-digit PIN code on the left panel!',
              textRu:
                'Подожди! Сначала заправь ракету справа и введи 5-значный код допуска на панели слева, а затем поднимайся по трапу в кабину!',
            },
          ]);
        } else {
          soundEngine.playSuccess();
          setPlayer((p) => ({ ...p, wearingSuit: true }));
          setGameState('SPACEFLIGHT');
          setSceneId('spacecraft');
          setIsSeated(true);
          setLaunchCountdown(3);
          grantReward(75, 80, 25, 'Посадка в ракету ABSIDIAN-1!', 'Boarded ABSIDIAN-1!');
        }
      } else if (item.id === 'spacecraft_crew') {
        openDialogue([
          {
            speakerEn: 'Pilot Oreo',
            speakerRu: 'Пилот Орео',
            roleEn: 'Flight Commander',
            roleRu: 'Командир корабля',
            portraitBreed: 'calico_bw',
            textEn:
              'You are strapped into the rocket! You can sit in your pilot seat watching space out the window, or stand up [E], stabilize steering, and touch down on the Moon!',
            textRu:
              'Мы внутри настоящей ракеты! Можешь сидеть в кресле и смотреть в иллюминатор на космос, или встать [E], выровнять курс и начать посадку на Луну!',
          },
        ]);
      } else if (item.id === 'spacecraft_sit_seat') {
        soundEngine.playClick();
        setIsSeated((prev) => !prev);
      } else if (item.id === 'spacecraft_steer') {
        setActiveMiniGame({ type: 'stabilize_steering' });
      } else if (item.id === 'spacecraft_land_moon') {
        setIsSeated(false);
        setRocketCameraMode('exterior');
        setTransitInfo({ progressPct: 0, distanceLeft: 34, altitude: 34, speedDisplay: 22 });
        setLiveTransitMode('moon_descent');
      } else if (item.kind === 'supply') {
        soundEngine.playSuccess();
        setResources((prev) => ({
          ...prev,
          oxygen: 100,
          waterReserve: 100,
          foodReserve: 100,
          suitEnergy: 100,
          health: Math.min(100, prev.health + 25),
        }));
        openDialogue([
          {
            speakerEn: 'Life Support Unit',
            speakerRu: 'Станция жизнеобеспечения',
            roleEn: 'Full Refill',
            roleRu: 'Пополнение припасов',
            portraitBreed: player.breed,
            textEn: 'Oxygen, Food, Water, and Suit Power all restored to 100%!',
            textRu: 'Кислород, еда, вода и батарея скафандра пополнены до 100%!',
          },
        ]);
      } else if (item.kind === 'sample') {
        if (!completedMissions.includes(item.id)) {
          soundEngine.playSuccess();
          setCompletedMissions((prev) => [...prev, item.id]);
          grantReward(40, 45, 25, 'Образец грунта собран!', 'Surface Sample Collected!');
          setActiveMiniGame({ type: 'sample_lab', contextId: item.id });
        }
      } else if (item.id.startsWith('bldg_lab_')) {
        setActiveMiniGame({ type: 'sample_lab', contextId: 'lab_scan' });
      }
    },
    [completedMissions, player.breed, ru, triggerToast, grantReward]
  );

  // Build new structure right beside the Cat Astronaut!
  const handleBuildStructure = (type: BuildingType) => {
    const planet: 'moon' | 'mars' = sceneId === 'mars' ? 'mars' : 'moon';
    const offsetAngle = (buildings.length * 1.35) % (Math.PI * 2);
    const bx = Math.max(-24, Math.min(24, Math.round(playerPos.x + Math.cos(offsetAngle) * 4.5)));
    const bz = Math.max(-24, Math.min(24, Math.round(playerPos.z + Math.sin(offsetAngle) * 4.5)));

    const newB: BuildingInstance = {
      id: `${type}_${Date.now()}`,
      type,
      planet,
      x: bx,
      z: bz,
      powered: true,
      health: 100,
      dustLevel: 0,
      builtBy: player.name,
    };

    setBuildings((prev) => [...prev, newB]);
    grantReward(
      25,
      35,
      type === 'science_lab' || type === 'greenhouse' ? 20 : 10,
      `Построен модуль: ${txt.buildings[type].name}`,
      `Built module: ${txt.buildings[type].name}`
    );

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && roomCode) {
      wsRef.current.send(JSON.stringify({ type: 'world:build', payload: { building: newB } }));
    }
  };

  // Helper Rover R-4 Scan Advice (Engineer / Normal Mode)
  const handleRoverScan = () => {
    setRoverScanPulse((p) => p + 1);
    soundEngine.playDialogueBlip(720);
    if (sceneId === 'lab_2140' && !prologue.stabilized) {
      setRoverTip(
        ru
          ? 'Р-4: Проверь генератор слева и оставь приборы выключенными — воздух и вода важнее!'
          : 'R-4: Check the left generator and turn Lab Gear down so Air & Water stay online!'
      );
    } else if (sceneId === 'academy') {
      setRoverTip(
        ru
          ? 'Р-4: Посети все 4 лаборатории, потом подойди к голограмме в центре!'
          : 'R-4: Visit the 4 training labs, then use the center Mission Control hologram!'
      );
    } else if (sceneId === 'moon' || sceneId === 'mars') {
      setRoverTip(
        ru
          ? 'Р-4: Построй Солнечную панель, О₂ и Оранжерею. Не забывай пополнять кислород у модуля!'
          : 'R-4: Build a Solar Array, O₂ Unit, and Greenhouse. Refill O₂ at the Lander anytime!'
      );
    } else {
      setRoverTip(
        ru ? 'Р-4: Все системы отсканированы! Следуй к светящимся маркерам.' : 'R-4: Area scanned! Follow the glowing objective beacons.'
      );
    }
  };

  // Current Objective Text & Next-Chapter Advancement
  const { objectiveText, canAdvanceChapter, advanceLabel } = useMemo(() => {
    if (sceneId === 'lab_2140') {
      if (!prologue.stabilized) {
        const w = prologue.generatorRepaired ? 'OK' : ru ? 'Нет' : 'Need';
        const v = prologue.ventCleared ? 'OK' : ru ? 'Нет' : 'Need';
        return {
          objectiveText: ru
            ? `Почини Провода (${w}), Вентиляцию (${v}) и настрой Щиток питания в центре!`
            : `Fix Generator Wires (${w}), Clear Vent (${v}), then balance Center Power Panel!`,
          canAdvanceChapter: false,
          advanceLabel: '',
        };
      }
      return {
        objectiveText: ru
          ? 'Лаборатория спасена! Иди к зелёной двери или открой Карту перелёта [M]'
          : 'Lab stabilized! Walk to the green exit door or open Travel Map [M]',
        canAdvanceChapter: true,
        advanceLabel: ru ? 'В Академию ABSIDIAN' : 'Go to Academy',
      };
    }

    if (sceneId === 'academy') {
      const trainCount = ['train_software', 'train_orbital', 'train_emergency', 'train_habitat'].filter((k) =>
        completedMissions.includes(k)
      ).length;
      if (trainCount < 2) {
        return {
          objectiveText: ru
            ? `Пройди тренировки (${trainCount}/2) · Скафандр можно надеть у шкафчика!`
            : `Complete training labs (${trainCount}/2) · Suit Locker available`,
          canAdvanceChapter: false,
          advanceLabel: '',
        };
      }
      if (!completedMissions.includes('mission_planned')) {
        return {
          objectiveText: ru
            ? 'Утверди план миссии в центре зала!'
            : 'Use center Mission Control table to plan your launch!',
          canAdvanceChapter: true,
          advanceLabel: ru ? 'Проект миссии' : 'Design Mission',
        };
      }
      return {
        objectiveText: ru
          ? 'Надень скафандр у шкафчика и садись в жёлтый автобус экипажа на космодром!'
          : 'Put on your spacesuit at the Locker & board the Crew Bus to Spaceport!',
        canAdvanceChapter: true,
        advanceLabel: ru ? 'В автобус на космодром' : 'Board Crew Bus',
      };
    }

    if (sceneId === 'launchpad') {
      const f = completedMissions.includes('launchpad_fuel');
      const k = completedMissions.includes('launchpad_keypad');
      return {
        objectiveText: ru
          ? `Подготовка ракеты: Заправка (${f ? 'OK' : 'Нет'}) · Код (${k ? 'OK' : 'Нет'}) → Посадка в ракету`
          : `Spaceport Prep: Fuel (${f ? 'OK' : 'Need'}) · Launch PIN (${k ? 'OK' : 'Need'}) → Board Rocket`,
        canAdvanceChapter: false,
        advanceLabel: '',
      };
    }

    if (sceneId === 'spacecraft') {
      return {
        objectiveText: ru
          ? 'Ты внутри ракеты! Стабилизируй курс на пульте и начинай посадку на Луну!'
          : 'You are inside the rocket! Stabilize steering & start Lunar Landing!',
        canAdvanceChapter: false,
        advanceLabel: '',
      };
    }

    if (sceneId === 'moon') {
      const moonBldgs = buildings.filter((b) => b.planet === 'moon').length;
      if (moonBldgs < 3) {
        return {
          objectiveText: ru
            ? `Построй лунную базу с нуля (${moonBldgs}/3 модулей): кнопка «Строить базу»`
            : `Build Moon base from scratch (${moonBldgs}/3 modules) via Build Base`,
          canAdvanceChapter: false,
          advanceLabel: '',
        };
      }
      return {
        objectiveText: ru
          ? 'Лунная база работает! Собери образцы в кратере и отправляйся на Марс!'
          : 'Lunar base active! Collect crater samples and launch the Mars Expedition!',
        canAdvanceChapter: true,
        advanceLabel: ru ? 'Экспедиция на Марс' : 'Launch to Mars',
      };
    }

    // Mars!
    const marsBldgs = buildings.filter((b) => b.planet === 'mars').length;
    if (marsBldgs < 2) {
      return {
        objectiveText: ru
          ? `Построй марсианскую базу и оранжерею (${marsBldgs}/2 модулей)`
          : `Construct Martian base & greenhouse (${marsBldgs}/2 modules)`,
        canAdvanceChapter: false,
        advanceLabel: '',
      };
    }
    if (!completedMissions.includes('deep_space_probe')) {
      return {
        objectiveText: ru
          ? 'Глава 9: Спроектируй зонд для дальнего космоса!'
          : 'Chapter 9: Design a Deep-Space Robotic Probe!',
        canAdvanceChapter: true,
        advanceLabel: ru ? 'Зонд дальнего космоса' : 'Deep Space Probe',
      };
    }
    return {
      objectiveText: ru
        ? 'Глава 10: Пройди финальное испытание миссии!'
        : 'Chapter 10: Resolve the Final Engineering Crisis!',
      canAdvanceChapter: true,
      advanceLabel: ru ? 'Финальное решение' : 'Final Mission Decision',
    };
  }, [sceneId, prologue.stabilized, prologue.generatorRepaired, prologue.ventCleared, completedMissions, buildings, ru]);

  const handleAdvanceChapter = () => {
    if (sceneId === 'lab_2140' && prologue.stabilized) {
      setGameState('ACADEMY');
      setSceneId('academy');
      setPlayer((p) => ({ ...p, wearingSuit: false }));
    } else if (sceneId === 'academy') {
      if (!completedMissions.includes('mission_planned')) {
        setGameState('MISSION_PLANNING');
        setActiveMiniGame({ type: 'mission_planner' });
      } else {
        setPlayer((p) => ({ ...p, wearingSuit: true }));
        setRocketCameraMode('cockpit');
        setTransitInfo({ progressPct: 0, distanceLeft: 125, altitude: 0, speedDisplay: 72 });
        setLiveTransitMode('bus_drive');
      }
    } else if (sceneId === 'moon') {
      setRocketCameraMode('exterior');
      setTransitInfo({ progressPct: 0, distanceLeft: 34, altitude: 34, speedDisplay: 22 });
      setLiveTransitMode('mars_descent');
    } else if (sceneId === 'mars') {
      if (!completedMissions.includes('deep_space_probe')) {
        setGameState('DEEP_SPACE');
        setActiveMiniGame({ type: 'deep_space_probe' });
      } else {
        setGameState('FINAL_MISSION');
        setActiveMiniGame({ type: 'final_crisis' });
      }
    }
  };

  // Title Screen
  if (gameState === 'TITLE_SCREEN') {
    return (
      <>
        <TitleScreen
          language={language}
          hasSave={hasSave}
          onChangeLanguage={setLanguage}
          onStartAdventure={() => setGameState('PLAYER_SETUP')}
          onPlayWithFriends={() => {
            setShowMultiplayer(true);
          }}
          onContinue={() => {
            try {
              const raw = localStorage.getItem(SAVE_STORAGE_KEY);
              if (raw) {
                const saved = JSON.parse(raw) as SaveProgressPayload;
                setLanguage(saved.language || 'ru');
                setDifficulty(saved.difficulty || 'engineer');
                setPlayer({
                  ...DEFAULT_PLAYER,
                  ...(saved.player || {}),
                  skinId: saved.player?.skinId || 'artemis_classic',
                  decorations: saved.player?.decorations || [],
                  wearingSuit: saved.player?.wearingSuit ?? false,
                });
                setGameState(saved.gameState || 'PROLOGUE');
                setSceneId(saved.sceneId || 'lab_2140');
                setResources(saved.resources || DEFAULT_RESOURCES);
                setPrologue(saved.prologue || DEFAULT_PROLOGUE);
                setCompletedMissions(saved.completedMissions || []);
                setBuildings(saved.buildings || []);
                setInventory(saved.inventory || DEFAULT_INVENTORY);
                setJournal(saved.journal || INITIAL_JOURNAL);
                setMissionDesign(saved.missionDesign || DEFAULT_DESIGN);
                setTimeOfDay(saved.timeOfDay || 'daylight');
                setXp(saved.xp ?? 0);
                setLevel(saved.level ?? 1);
                setStreakDays(saved.streakDays ?? 0);
                setLastStreakClaim(saved.lastStreakClaim ?? '');
                setOwnedSkins(saved.ownedSkins || ['artemis_classic']);
                setOwnedDecorations(saved.ownedDecorations || []);
              }
            } catch {
              setGameState('PLAYER_SETUP');
            }
          }}
          onOpenSettings={() => setShowSettings(true)}
        />
        {showMultiplayer && (
          <MultiplayerModal
            language={language}
            roomCode={roomCode}
            players={remotePlayers}
            errorMsg={mpError}
            lastComms={lastComms}
            onClose={() => setShowMultiplayer(false)}
            onCreateRoom={() =>
              connectWebSocket((ws) =>
                ws.send(
                  JSON.stringify({
                    type: 'room:create',
                    payload: {
                      player: {
                        id: player.id,
                        name: player.name,
                        breed: player.breed,
                        suitColor: player.suitColor,
                        accentColor: player.accentColor,
                        role: player.specialization,
                        sceneId,
                        x: playerPos.x,
                        y: 0,
                        z: playerPos.z,
                        rotY: 0,
                        moving: false,
                        oxygen: resources.oxygen,
                        health: resources.health,
                      },
                      buildings,
                      credits: resources.credits,
                    },
                  })
                )
              )
            }
            onJoinRoom={(code) =>
              connectWebSocket((ws) =>
                ws.send(
                  JSON.stringify({
                    type: 'room:join',
                    payload: {
                      code,
                      player: {
                        id: player.id,
                        name: player.name,
                        breed: player.breed,
                        suitColor: player.suitColor,
                        accentColor: player.accentColor,
                        role: player.specialization,
                        sceneId,
                        x: playerPos.x,
                        y: 0,
                        z: playerPos.z,
                        rotY: 0,
                        moving: false,
                        oxygen: resources.oxygen,
                        health: resources.health,
                      },
                    },
                  })
                )
              )
            }
            onLeaveRoom={() => {
              wsRef.current?.send(JSON.stringify({ type: 'room:leave', payload: {} }));
              setRoomCode(null);
              setRemotePlayers([]);
            }}
            onSendPreset={(phraseKey) =>
              wsRef.current?.send(JSON.stringify({ type: 'chat:preset', payload: { phraseKey } }))
            }
          />
        )}
        {showSettings && (
          <SettingsOverlay
            language={language}
            soundOn={soundOn}
            musicOn={musicOn}
            volume={volume}
            timeOfDay={timeOfDay}
            onChangeLanguage={setLanguage}
            onToggleSound={() => {
              const next = !soundOn;
              setSoundOn(next);
              soundEngine.setEnabled(next);
            }}
            onToggleMusic={() => {
              const next = !musicOn;
              setMusicOn(next);
              soundEngine.setMusicEnabled(next);
            }}
            onVolume={(v) => {
              setVolume(v);
              soundEngine.setVolume(v);
            }}
            onTimeOfDay={setTimeOfDay}
            onResetSave={() => {
              localStorage.removeItem(SAVE_STORAGE_KEY);
              setHasSave(false);
            }}
            onClose={() => setShowSettings(false)}
          />
        )}
      </>
    );
  }

  // Player Customization
  if (gameState === 'PLAYER_SETUP') {
    return (
      <CharacterCreator
        language={language}
        initialPlayer={player}
        initialDifficulty={difficulty}
        onBack={() => setGameState('TITLE_SCREEN')}
        onComplete={(newPlayer, newDiff, saveToServer) => {
          setPlayer(newPlayer);
          setDifficulty(newDiff);
          if (saveToServer) {
            fetch('/api/profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...newPlayer, difficulty: newDiff }),
            }).catch(() => {});
          }
          setGameState('INTRO_CINEMATIC');
        }}
      />
    );
  }

  // Year 2140 Backstory + Pioneering Women Intro Cinematic
  if (gameState === 'INTRO_CINEMATIC') {
    return (
      <BackstoryCinematic
        language={language}
        onFinish={() => {
          setGameState('PROLOGUE');
          setSceneId('lab_2140');
        }}
      />
    );
  }

  // Chapter 12 Debrief Certificate
  if (gameState === 'MISSION_DEBRIEF') {
    return (
      <DebriefCertificate
        language={language}
        player={player}
        resources={resources}
        buildings={buildings}
        completedMissions={completedMissions}
        onContinueSandbox={() => {
          setGameState('LUNAR_EXPLORATION');
          setSceneId('moon');
        }}
        onReplay={() => setGameState('TITLE_SCREEN')}
      />
    );
  }

  const deathReason =
    resources.oxygen <= 0
      ? ru
        ? 'Закончился кислород — котик задохнулся!'
        : 'Out of Oxygen — suffocation!'
      : resources.foodReserve <= 0
      ? ru
        ? 'Закончилась еда — критическое истощение!'
        : 'Out of Food — critical starvation!'
      : resources.waterReserve <= 0
      ? ru
        ? 'Закончилась вода — обезвоживание!'
        : 'Out of Water — severe dehydration!'
      : ru
      ? 'Здоровье экипажа упало до 0!'
      : 'Crew health dropped to zero!';

  const showEmergencyModal =
    resources.health <= 0 ||
    resources.oxygen <= 0 ||
    resources.foodReserve <= 0 ||
    resources.waterReserve <= 0;

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#07090e]">
      {/* 3D Interactive World */}
      <GameCanvas3D
        sceneId={sceneId}
        player={player}
        difficulty={difficulty}
        prologue={prologue}
        buildings={buildings}
        completedMissions={completedMissions}
        timeOfDay={timeOfDay}
        paused={
          Boolean(activeMiniGame) ||
          dialogueQueue.length > 0 ||
          showSettings ||
          showMultiplayer ||
          showTravelMap ||
          showStreakModal ||
          showShopModal ||
          showEmergencyModal ||
          Boolean(liveTransitMode)
        }
        remotePlayers={remotePlayers}
        joystickInput={joystickInput}
        roverScanPulse={roverScanPulse}
        isSeated={isSeated}
        launchShake={launchCountdown === 0}
        liveTransitMode={liveTransitMode}
        rocketCameraMode={rocketCameraMode}
        onNearbyInteractable={setNearbyItem}
        onPlayerMoveSync={handlePlayerMoveSync}
        onPlayerPosUpdate={setPlayerPos}
        onTriggerInteract={handleInteract}
        onTransitUpdate={setTransitInfo}
        onTransitComplete={(doneMode) => {
          setLiveTransitMode(null);
          soundEngine.playSuccess();
          if (doneMode === 'bus_drive') {
            setPlayer((p) => ({ ...p, wearingSuit: true }));
            setIsSeated(false);
            setGameState('LAUNCH');
            setSceneId('launchpad');
            grantReward(25, 30, 0, 'Прибытие на Космодром 39А!', 'Arrived at Launchpad 39A!');
          } else if (doneMode === 'moon_descent') {
            setIsSeated(false);
            setRocketCameraMode('cockpit');
            setGameState('LUNAR_EXPLORATION');
            setSceneId('moon');
            grantReward(45, 50, 20, 'Мягкая посадка на Луну!', 'Soft Touchdown on the Moon!');
          } else if (doneMode === 'mars_descent') {
            setIsSeated(false);
            setRocketCameraMode('cockpit');
            setGameState('MARS_EXPEDITION');
            setSceneId('mars');
            grantReward(55, 60, 25, 'Успешная посадка на Марс!', 'Successful Mars Touchdown!');
          } else if (doneMode === 'earth_return') {
            setIsSeated(false);
            setRocketCameraMode('cockpit');
            setGameState('MISSION_DEBRIEF');
          }
        }}
      />

      {/* Active HUD */}
      <GameHUD
        language={language}
        difficulty={difficulty}
        gameState={gameState}
        sceneId={sceneId}
        player={player}
        playerPos={playerPos}
        resources={resources}
        timeOfDay={timeOfDay}
        objectiveText={objectiveText}
        canAdvanceChapter={canAdvanceChapter}
        advanceLabel={advanceLabel}
        nearbyItem={nearbyItem}
        buildings={buildings}
        inventory={inventory}
        journal={journal}
        dialogue={dialogueQueue[dialogueIndex] || null}
        roverTip={roverTip}
        soundOn={soundOn}
        roomCode={roomCode}
        showEmergencyModal={showEmergencyModal}
        deathReason={deathReason}
        level={level}
        xp={xp}
        xpNeeded={level * 100}
        streakDays={streakDays}
        canClaimStreak={canClaimStreak}
        isSeated={isSeated}
        launchCountdown={launchCountdown}
        liveTransitMode={liveTransitMode}
        transitInfo={transitInfo}
        rocketCameraMode={rocketCameraMode}
        rewardToast={rewardToast}
        onChangeLanguage={setLanguage}
        onChangeTimeOfDay={setTimeOfDay}
        onToggleSound={() => {
          const next = !soundOn;
          setSoundOn(next);
          soundEngine.setEnabled(next);
        }}
        onInteract={handleInteract}
        onJoystickMove={setJoystickInput}
        onRoverScan={handleRoverScan}
        onBuildStructure={handleBuildStructure}
        onOpenBaseConsole={() => setActiveMiniGame({ type: 'base_console' })}
        onOpenNasaTerminal={() => setActiveMiniGame({ type: 'nasa_terminal' })}
        onOpenTravelMap={() => setShowTravelMap(true)}
        onOpenMultiplayer={() => setShowMultiplayer(true)}
        onOpenStreak={() => setShowStreakModal(true)}
        onOpenShop={() => setShowShopModal(true)}
        onToggleRocketCamera={() =>
          setRocketCameraMode((m) => (m === 'cockpit' ? 'exterior' : 'cockpit'))
        }
        onStartLunarDescent={() => {
          setIsSeated(false);
          setRocketCameraMode('exterior');
          setTransitInfo({ progressPct: 0, distanceLeft: 34, altitude: 34, speedDisplay: 22 });
          setLiveTransitMode('moon_descent');
        }}
        onEatRation={() => {
          setResources((prev) =>
            prev.credits >= 10
              ? { ...prev, credits: prev.credits - 10, foodReserve: Math.min(100, prev.foodReserve + 28) }
              : prev
          );
        }}
        onDrinkWater={() => {
          setResources((prev) =>
            prev.credits >= 10
              ? { ...prev, credits: prev.credits - 10, waterReserve: Math.min(100, prev.waterReserve + 28) }
              : prev
          );
        }}
        onAdvanceChapter={handleAdvanceChapter}
        onAdvanceDialogue={(nextIdx) => {
          if (typeof nextIdx === 'number') {
            setDialogueIndex(nextIdx);
          } else if (dialogueIndex + 1 < dialogueQueue.length) {
            setDialogueIndex((i) => i + 1);
          } else {
            setDialogueQueue([]);
            setDialogueIndex(0);
          }
        }}
        onEmergencyRestart={() => {
          setResources({ ...DEFAULT_RESOURCES, credits: resources.credits, sciencePoints: resources.sciencePoints });
        }}
        onEmergencyRecover={() => {
          setResources((prev) => ({
            ...prev,
            health: 100,
            oxygen: 100,
            waterReserve: 100,
            foodReserve: 100,
            suitEnergy: 100,
            credits: Math.max(0, prev.credits - 50),
          }));
        }}
        onOpenSettings={() => setShowSettings(true)}
      />

      {/* Space Travel Map Modal [M] */}
      {showTravelMap && (
        <SpaceTravelMapModal
          language={language}
          currentScene={sceneId}
          unlockedScenes={unlockedScenes}
          onClose={() => setShowTravelMap(false)}
          onTravelTo={(targetScene, targetState) => {
            setSceneId(targetScene);
            setGameState(targetState);
            setIsSeated(false);
            if (targetScene === 'launchpad' || targetScene === 'spacecraft' || targetScene === 'moon' || targetScene === 'mars') {
              setPlayer((p) => ({ ...p, wearingSuit: true }));
            } else if (targetScene === 'lab_2140') {
              setPlayer((p) => ({ ...p, wearingSuit: false }));
            }
          }}
          onOpenDeepSpaceProbe={() => {
            setGameState('DEEP_SPACE');
            setActiveMiniGame({ type: 'deep_space_probe' });
          }}
        />
      )}

      {/* Daily Streak Gift Calendar */}
      {showStreakModal && (
        <DailyStreakModal
          language={language}
          streakDays={streakDays}
          canClaimToday={canClaimStreak}
          onClose={() => setShowStreakModal(false)}
          onClaimReward={(reward) => {
            setStreakDays((d) => d + 1);
            setLastStreakClaim(todayKey);
            if (reward.bonusSkin) {
              setOwnedSkins((prev) => (prev.includes(reward.bonusSkin!) ? prev : [...prev, reward.bonusSkin!]));
            }
            if (reward.bonusDecoration) {
              setOwnedDecorations((prev) =>
                prev.includes(reward.bonusDecoration!) ? prev : [...prev, reward.bonusDecoration!]
              );
              setPlayer((p) => ({
                ...p,
                decorations: p.decorations.includes(reward.bonusDecoration!)
                  ? p.decorations
                  : [...p.decorations, reward.bonusDecoration!],
              }));
            }
            grantReward(reward.coins, 50, reward.science, reward.titleRu, reward.titleEn);
          }}
        />
      )}

      {/* Skins & 3D Decorations Shop */}
      {showShopModal && (
        <CosmeticsShopModal
          language={language}
          coins={resources.credits}
          player={player}
          ownedSkins={ownedSkins}
          ownedDecorations={ownedDecorations}
          onClose={() => setShowShopModal(false)}
          onBuySkin={(skin) => {
            if (resources.credits < skin.price || ownedSkins.includes(skin.id)) return;
            setResources((prev) => ({ ...prev, credits: prev.credits - skin.price }));
            setOwnedSkins((prev) => [...prev, skin.id]);
            setPlayer((p) => ({
              ...p,
              skinId: skin.id,
              suitColor: skin.suitColor,
              accentColor: skin.accentColor,
              wearingSuit: true,
            }));
            triggerToast(
              ru ? `Куплен и надет скин: ${skin.nameRu}!` : `Purchased & Equipped: ${skin.nameEn}!`,
              ru ? 'Посмотри на котика в 3D!' : 'Check out your 3D cat!'
            );
          }}
          onEquipSkin={(skin) => {
            setPlayer((p) => ({
              ...p,
              skinId: skin.id,
              suitColor: skin.suitColor,
              accentColor: skin.accentColor,
            }));
          }}
          onBuyDecoration={(deco) => {
            if (resources.credits < deco.price || ownedDecorations.includes(deco.id)) return;
            setResources((prev) => ({ ...prev, credits: prev.credits - deco.price }));
            setOwnedDecorations((prev) => [...prev, deco.id]);
            setPlayer((p) => ({
              ...p,
              decorations: p.decorations.includes(deco.id) ? p.decorations : [...p.decorations, deco.id],
            }));
            triggerToast(
              ru ? `Куплено 3D-украшение: ${deco.nameRu}!` : `Bought 3D Gear: ${deco.nameEn}!`,
              ru ? 'Оно сразу появилось на твоём персонаже!' : 'Visible live on your character!'
            );
          }}
          onToggleDecoration={(decoId) => {
            setPlayer((p) => ({
              ...p,
              decorations: p.decorations.includes(decoId)
                ? p.decorations.filter((id) => id !== decoId)
                : [...p.decorations, decoId],
            }));
          }}
        />
      )}

      {/* Playable Engineering Mini-Games */}
      {activeMiniGame && (
        <EngineeringModals
          active={activeMiniGame}
          language={language}
          difficulty={difficulty}
          prologue={prologue}
          resources={resources}
          buildings={buildings}
          missionDesign={missionDesign}
          spaceWeather={spaceWeather}
          onClose={() => setActiveMiniGame(null)}
          onUpdatePrologue={(next) => {
            setPrologue(next);
            if (next.generatorRepaired && !prologue.generatorRepaired) {
              grantReward(45, 45, 5, 'Провода генератора починены!', 'Generator Wiring Fixed!');
            } else if (next.ventCleared && !prologue.ventCleared) {
              grantReward(45, 45, 5, 'Вентиляция очищена!', 'Air Vent Cleared!');
            }
            if (next.stabilized && !prologue.stabilized) {
              grantReward(60, 60, 20, 'Энергосистема спасена!', 'Power Grid Stabilized!');
              setJournal((prev) =>
                prev.some((j) => j.id === 'entry_academy_invite')
                  ? prev
                  : [
                      ...prev,
                      {
                        id: 'entry_academy_invite',
                        chapter: 'Prologue',
                        titleEn: 'Facility Saved & ABSIDIAN Invitation',
                        titleRu: 'Лаборатория спасена и приглашение ABSIDIAN',
                        summaryEn: 'Restoring relays and prioritizing Air & Water saved the research lab during the 2140 blackout.',
                        summaryRu: 'Восстановление реле и приоритет воздуха с водой спасли центр во время бури 2140 года.',
                        scienceLessonEn: 'Engineering lesson: Critical life support must always take priority over non-essential lab instruments.',
                        scienceLessonRu: 'Урок инженера: системы жизни всегда важнее второстепенных приборов.',
                      },
                    ]
              );
            }
          }}
          onCompleteTraining={(missionKey, rewardCredits, rewardScience) => {
            if (!completedMissions.includes(missionKey)) {
              setCompletedMissions((prev) => [...prev, missionKey]);
              grantReward(
                rewardCredits,
                55,
                rewardScience,
                `Задание выполнено: ${missionKey.replace('_', ' ')}`,
                `Task Completed: ${missionKey.replace('_', ' ')}`
              );
              setJournal((prev) => [
                ...prev,
                {
                  id: `entry_${missionKey}`,
                  chapter: 'Chapter 2',
                  titleEn: `Completed: ${missionKey.replace('_', ' ')}`,
                  titleRu: `Выполнено: ${missionKey.replace('_', ' ')}`,
                  summaryEn: 'Successfully demonstrated astronaut engineering readiness.',
                  summaryRu: 'Успешно пройдена инженерная подготовка астронавта.',
                  scienceLessonEn: 'Accurate software, trajectories, and life support make spaceflight safe.',
                  scienceLessonRu: 'Надёжный код, точная орбита и контроль давления делают полёт безопасным.',
                },
              ]);
            }
          }}
          onSaveMissionDesign={(cfg) => {
            setMissionDesign(cfg);
            if (!completedMissions.includes('mission_planned')) {
              setCompletedMissions((prev) => [...prev, 'mission_planned']);
              grantReward(60, 60, 20, 'План миссии утверждён!', 'Mission Plan Approved!');
            }
            setGameState('ACADEMY');
            setSceneId('academy');
            openDialogue([
              {
                speakerEn: 'Director Nova',
                speakerRu: 'Директор Нова',
                roleEn: 'Mission Approved',
                roleRu: 'План утверждён',
                portraitBreed: 'director',
                textEn:
                  'Excellent launch configuration! Put on your pressurized spacesuit at the Locker, then board the yellow Crew Bus at the exit to head to Launchpad 39A!',
                textRu:
                  'Отличная конфигурация корабля! Теперь надень герметичный скафандр в шкафчике подготовки и садись в жёлтый автобус экипажа у выхода — он отвезёт нас прямо к ракете!',
              },
            ]);
          }}
          onToggleBuildingPower={(id) => {
            setBuildings((prev) => prev.map((b) => (b.id === id ? { ...b, powered: !b.powered } : b)));
          }}
          onCleanMarsDust={() => {
            setBuildings((prev) => prev.map((b) => ({ ...b, dustLevel: 0 })));
          }}
          onCompleteFinalMission={() => {
            setGameState('RETURN_EARTH');
            setRocketCameraMode('exterior');
            setTransitInfo({ progressPct: 0, distanceLeft: 34, altitude: 34, speedDisplay: 22 });
            setLiveTransitMode('earth_return');
          }}
        />
      )}

      {/* Multiplayer Modal */}
      {showMultiplayer && (
        <MultiplayerModal
          language={language}
          roomCode={roomCode}
          players={remotePlayers}
          errorMsg={mpError}
          lastComms={lastComms}
          onClose={() => setShowMultiplayer(false)}
          onCreateRoom={() =>
            connectWebSocket((ws) =>
              ws.send(
                JSON.stringify({
                  type: 'room:create',
                  payload: {
                    player: {
                      id: player.id,
                      name: player.name,
                      breed: player.breed,
                      suitColor: player.suitColor,
                      accentColor: player.accentColor,
                      role: player.specialization,
                      sceneId,
                      x: playerPos.x,
                      y: 0,
                      z: playerPos.z,
                      rotY: 0,
                      moving: false,
                      oxygen: resources.oxygen,
                      health: resources.health,
                    },
                    buildings,
                    credits: resources.credits,
                  },
                })
              )
            )
          }
          onJoinRoom={(code) =>
            connectWebSocket((ws) =>
              ws.send(
                JSON.stringify({
                  type: 'room:join',
                  payload: {
                    code,
                    player: {
                      id: player.id,
                      name: player.name,
                      breed: player.breed,
                      suitColor: player.suitColor,
                      accentColor: player.accentColor,
                      role: player.specialization,
                      sceneId,
                      x: playerPos.x,
                      y: 0,
                      z: playerPos.z,
                      rotY: 0,
                      moving: false,
                      oxygen: resources.oxygen,
                      health: resources.health,
                    },
                  },
                })
              )
            )
          }
          onLeaveRoom={() => {
            wsRef.current?.send(JSON.stringify({ type: 'room:leave', payload: {} }));
            setRoomCode(null);
            setRemotePlayers([]);
          }}
          onSendPreset={(phraseKey) =>
            wsRef.current?.send(JSON.stringify({ type: 'chat:preset', payload: { phraseKey } }))
          }
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsOverlay
          language={language}
          soundOn={soundOn}
          musicOn={musicOn}
          volume={volume}
          timeOfDay={timeOfDay}
          onChangeLanguage={setLanguage}
          onToggleSound={() => {
            const next = !soundOn;
            setSoundOn(next);
            soundEngine.setEnabled(next);
          }}
          onToggleMusic={() => {
            const next = !musicOn;
            setMusicOn(next);
            soundEngine.setMusicEnabled(next);
          }}
          onVolume={(v) => {
            setVolume(v);
            soundEngine.setVolume(v);
          }}
          onTimeOfDay={setTimeOfDay}
          onResetSave={() => {
            localStorage.removeItem(SAVE_STORAGE_KEY);
            setHasSave(false);
            setGameState('TITLE_SCREEN');
            setShowSettings(false);
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

interface SettingsOverlayProps {
  language: Language;
  soundOn: boolean;
  musicOn: boolean;
  volume: number;
  timeOfDay: TimeOfDay;
  onChangeLanguage: (l: Language) => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onVolume: (v: number) => void;
  onTimeOfDay: (t: TimeOfDay) => void;
  onResetSave: () => void;
  onClose: () => void;
}

const SettingsOverlay: React.FC<SettingsOverlayProps> = ({
  language,
  soundOn,
  musicOn,
  volume,
  timeOfDay,
  onChangeLanguage,
  onToggleSound,
  onToggleMusic,
  onVolume,
  onTimeOfDay,
  onResetSave,
  onClose,
}) => {
  const txt = t(language);
  const ru = language === 'ru';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl text-slate-100 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="font-display text-lg font-bold text-white">{txt.settingsModal.title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <span>{txt.languageLabel}</span>
            <div className="flex gap-1.5">
              {(['ru', 'en'] as Language[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onChangeLanguage(l)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    language === l ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {l === 'ru' ? 'Русский' : 'English'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span>{txt.settingsModal.soundFx}</span>
            <button
              type="button"
              onClick={onToggleSound}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                soundOn ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {soundOn ? (ru ? 'ВКЛ' : 'ON') : ru ? 'ВЫКЛ' : 'OFF'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span>{txt.settingsModal.music}</span>
            <button
              type="button"
              onClick={onToggleMusic}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                musicOn ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {musicOn ? (ru ? 'ВКЛ' : 'ON') : ru ? 'ВЫКЛ' : 'OFF'}
            </button>
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                {txt.settingsModal.volume}
              </span>
              <span className="font-mono-tabular">{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
          </div>

          <div>
            <div className="text-xs text-slate-400 mb-2">{txt.settingsModal.dayCycle}</div>
            <div className="grid grid-cols-3 gap-2">
              {(['daylight', 'twilight', 'night'] as TimeOfDay[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onTimeOfDay(m)}
                  className={`py-2 rounded-lg text-xs font-bold ${
                    timeOfDay === m ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {txt.hud.dayTime[m]}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={onResetSave}
            className="w-full py-2.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{txt.settingsModal.resetSave}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
