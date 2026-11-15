import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Backpack,
  BookOpen,
  Bot,
  Building2,
  Bus,
  Camera,
  Coins,
  Compass,
  Droplets,
  Flame,
  Globe,
  Hammer,
  Heart,
  Map as MapIcon,
  Moon,
  Radio,
  Rocket,
  RotateCcw,
  Settings,
  Shield,
  ShoppingBag,
  Sliders,
  Sparkles,
  Sun,
  Sunrise,
  Users,
  Utensils,
  Volume2,
  VolumeX,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import {
  BuildingInstance,
  BuildingType,
  Difficulty,
  DialogueNode,
  GameStateId,
  InventoryItem,
  JournalEntry,
  Language,
  LiveTransitMode,
  PlayerCustomization,
  ResourcesState,
  RocketCameraMode,
  SceneWorldId,
  TimeOfDay,
  WorldInteractable,
} from '../types/game';
import { CAT_BREEDS, t } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface GameHUDProps {
  language: Language;
  difficulty: Difficulty;
  gameState: GameStateId;
  sceneId: SceneWorldId;
  player: PlayerCustomization;
  playerPos: { x: number; z: number };
  resources: ResourcesState;
  timeOfDay: TimeOfDay;
  objectiveText: string;
  canAdvanceChapter: boolean;
  advanceLabel: string;
  nearbyItem: WorldInteractable | null;
  buildings: BuildingInstance[];
  inventory: InventoryItem[];
  journal: JournalEntry[];
  dialogue: DialogueNode | null;
  roverTip: string | null;
  soundOn: boolean;
  roomCode: string | null;
  showEmergencyModal: boolean;
  deathReason: string;
  level: number;
  xp: number;
  xpNeeded: number;
  streakDays: number;
  canClaimStreak: boolean;
  isSeated: boolean;
  launchCountdown: number | null;
  liveTransitMode: LiveTransitMode;
  transitInfo: { progressPct: number; distanceLeft: number; altitude: number; speedDisplay: number };
  rocketCameraMode: RocketCameraMode;
  rewardToast: { title: string; subtitle: string } | null;
  onChangeLanguage: (lang: Language) => void;
  onChangeTimeOfDay: (mode: TimeOfDay) => void;
  onToggleSound: () => void;
  onInteract: (item: WorldInteractable) => void;
  onJoystickMove: (vec: { x: number; y: number }) => void;
  onRoverScan: () => void;
  onBuildStructure: (type: BuildingType) => void;
  onOpenBaseConsole: () => void;
  onOpenNasaTerminal: () => void;
  onOpenTravelMap: () => void;
  onOpenMultiplayer: () => void;
  onOpenStreak: () => void;
  onOpenShop: () => void;
  onToggleRocketCamera: () => void;
  onStartLunarDescent: () => void;
  onEatRation: () => void;
  onDrinkWater: () => void;
  onAdvanceChapter: () => void;
  onAdvanceDialogue: (nextIdx?: number) => void;
  onEmergencyRestart: () => void;
  onEmergencyRecover: () => void;
  onOpenSettings: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  language,
  difficulty,
  gameState,
  sceneId,
  player,
  playerPos,
  resources,
  timeOfDay,
  objectiveText,
  canAdvanceChapter,
  advanceLabel,
  nearbyItem,
  buildings,
  inventory,
  journal,
  dialogue,
  roverTip,
  soundOn,
  roomCode,
  showEmergencyModal,
  deathReason,
  level,
  xp,
  xpNeeded,
  streakDays,
  canClaimStreak,
  isSeated,
  launchCountdown,
  liveTransitMode,
  transitInfo,
  rocketCameraMode,
  rewardToast,
  onChangeLanguage,
  onChangeTimeOfDay,
  onToggleSound,
  onInteract,
  onJoystickMove,
  onRoverScan,
  onBuildStructure,
  onOpenBaseConsole,
  onOpenNasaTerminal,
  onOpenTravelMap,
  onOpenMultiplayer,
  onOpenStreak,
  onOpenShop,
  onToggleRocketCamera,
  onStartLunarDescent,
  onEatRation,
  onDrinkWater,
  onAdvanceChapter,
  onAdvanceDialogue,
  onEmergencyRestart,
  onEmergencyRecover,
  onOpenSettings,
}) => {
  const txt = t(language);
  const ru = language === 'ru';
  const breedInfo = CAT_BREEDS.find((b) => b.id === player.breed) || CAT_BREEDS[0];

  const [drawer, setDrawer] = useState<'none' | 'journal' | 'inventory' | 'build'>('none');
  const [joyKnob, setJoyKnob] = useState({ x: 0, y: 0 });
  const joyActiveRef = useRef(false);
  const joyOriginRef = useRef({ x: 0, y: 0 });
  const radarRef = useRef<HTMLCanvasElement | null>(null);

  const isPlanetSurface = sceneId === 'moon' || sceneId === 'mars';

  // Draw live Mini-Map Radar
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 96, 96);
    ctx.fillStyle = '#070b14';
    ctx.fillRect(0, 0, 96, 96);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(48, 48, 20, 0, Math.PI * 2);
    ctx.arc(48, 48, 40, 0, Math.PI * 2);
    ctx.stroke();

    const scale = sceneId === 'moon' || sceneId === 'mars' ? 1.15 : 1.7;

    buildings
      .filter((b) => b.planet === sceneId)
      .forEach((b) => {
        const rx = 48 + (b.x - playerPos.x) * scale;
        const ry = 48 + (b.z - playerPos.z) * scale;
        if (rx > 4 && rx < 92 && ry > 4 && ry < 92) {
          ctx.fillStyle = b.powered ? '#22c55e' : '#ef4444';
          ctx.fillRect(rx - 3, ry - 3, 6, 6);
        }
      });

    if (nearbyItem) {
      const ix = 48 + (nearbyItem.x - playerPos.x) * scale;
      const iy = 48 + (nearbyItem.z - playerPos.z) * scale;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ix, iy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(48, 48, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }, [playerPos, buildings, sceneId, nearbyItem]);

  const handleJoyStart = (e: React.PointerEvent<HTMLDivElement>) => {
    joyActiveRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    joyOriginRef.current = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joyActiveRef.current) return;
    const dx = e.clientX - joyOriginRef.current.x;
    const dy = e.clientY - joyOriginRef.current.y;
    const maxR = 32;
    const dist = Math.hypot(dx, dy);
    const clamped = Math.min(dist, maxR);
    const ang = Math.atan2(dy, dx);
    const kx = Math.cos(ang) * clamped;
    const ky = Math.sin(ang) * clamped;
    setJoyKnob({ x: kx, y: ky });
    onJoystickMove({ x: kx / maxR, y: ky / maxR });
  };

  const handleJoyEnd = () => {
    joyActiveRef.current = false;
    setJoyKnob({ x: 0, y: 0 });
    onJoystickMove({ x: 0, y: 0 });
  };

  const buildingTypes: BuildingType[] = [
    'solar',
    'habitat',
    'o2_station',
    'water_recycler',
    'greenhouse',
    'shield_dome',
    'science_lab',
  ];

  const vitalBars = [
    { label: txt.hud.health, val: resources.health, color: 'bg-rose-500', icon: Heart },
    { label: txt.hud.oxygen, val: resources.oxygen, color: 'bg-cyan-400', icon: Wind },
    { label: txt.hud.food, val: resources.foodReserve, color: 'bg-emerald-400', icon: Utensils },
    { label: txt.hud.water, val: resources.waterReserve, color: 'bg-blue-400', icon: Droplets },
    { label: txt.hud.energy, val: resources.suitEnergy, color: 'bg-amber-400', icon: Zap },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 md:p-4">
      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-3">
        {/* Top-Left: Cat Portrait + Limited Survival Bars + Coins */}
        <div className="pointer-events-auto bg-slate-950/92 border border-slate-800 rounded-2xl p-3 shadow-xl min-w-[260px]">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 shrink-0" style={{ borderColor: player.suitColor }}>
              <img
                src="/assets/aistudio/catsinspace_e0224f1c.jpg"
                alt={player.name}
                referrerPolicy="no-referrer"
                className="w-[300%] h-[200%] max-w-none object-cover"
                style={{ objectPosition: `${breedInfo.col * 50}% ${breedInfo.row * 100}%` }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5">
                <span className="font-display font-bold text-sm text-white truncate">{player.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 font-mono-tabular font-bold text-[10px] shrink-0">
                  LVL {level}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-[11px] font-mono-tabular">
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/60 text-amber-300 font-bold flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  {resources.credits} 🪙
                </span>
                <span className="text-cyan-300 font-bold">{resources.sciencePoints} SCI</span>
              </div>
            </div>
          </div>

          {/* XP Level Progress Bar & Suit Status */}
          <div className="mb-2.5 flex items-center gap-2 text-[10px]">
            <div className="flex-1">
              <div className="flex justify-between font-mono-tabular text-slate-400 mb-0.5">
                <span>XP {xp}/{xpNeeded}</span>
                <span className={player.wearingSuit ? 'text-emerald-400 font-semibold' : 'text-amber-300 font-semibold'}>
                  {player.wearingSuit
                    ? ru ? '🧑‍🚀 В скафандре' : '🧑‍🚀 Suit ON'
                    : ru ? '👔 Без скафандра' : '👔 Casual Uniform'}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-amber-400 transition-all"
                  style={{ width: `${Math.min(100, Math.round((xp / Math.max(1, xpNeeded)) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* 5 Decreasing Survival Resource Bars */}
          <div className="space-y-1.5 text-[11px]">
            {vitalBars.map((bar) => {
              const low = bar.val < 25;
              return (
                <div key={bar.label} className="flex items-center gap-2">
                  <bar.icon className={`w-3.5 h-3.5 shrink-0 ${low ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className={`w-16 truncate ${low ? 'text-rose-300 font-bold' : 'text-slate-300'}`}>{bar.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${low ? 'bg-rose-500 animate-pulse' : bar.color}`}
                      style={{ width: `${Math.max(0, Math.min(100, bar.val))}%` }}
                    />
                  </div>
                  <span className={`w-9 text-right font-mono-tabular ${low ? 'text-rose-300 font-bold' : 'text-slate-200'}`}>
                    {Math.round(bar.val)}%
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Eat / Drink Supply Action */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex gap-1.5">
            <button
              type="button"
              disabled={resources.credits < 10 || resources.foodReserve >= 98}
              onClick={() => {
                soundEngine.playSuccess();
                onEatRation();
              }}
              className="flex-1 py-1 px-2 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/70 disabled:opacity-40 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold flex items-center justify-center gap-1"
              title={ru ? 'Купить паёк за 10 монет' : 'Buy ration for 10 coins'}
            >
              <Utensils className="w-3 h-3" />
              <span>{txt.hud.eatRation} (-10🪙)</span>
            </button>
            <button
              type="button"
              disabled={resources.credits < 10 || resources.waterReserve >= 98}
              onClick={() => {
                soundEngine.playSuccess();
                onDrinkWater();
              }}
              className="flex-1 py-1 px-2 rounded-lg bg-blue-950/70 hover:bg-blue-900/70 disabled:opacity-40 border border-blue-700/60 text-blue-300 text-[10px] font-semibold flex items-center justify-center gap-1"
              title={ru ? 'Купить воду за 10 монет' : 'Buy water for 10 coins'}
            >
              <Droplets className="w-3 h-3" />
              <span>{txt.hud.drinkWater} (-10🪙)</span>
            </button>
          </div>

          {/* Planetary Daylight / Twilight / Night Selector */}
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between gap-1">
            {(['daylight', 'twilight', 'night'] as TimeOfDay[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onChangeTimeOfDay(mode);
                }}
                className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                  timeOfDay === mode
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {mode === 'daylight' && <Sun className="w-3 h-3" />}
                {mode === 'twilight' && <Sunrise className="w-3 h-3" />}
                {mode === 'night' && <Moon className="w-3 h-3" />}
                <span className="truncate">{txt.hud.dayTime[mode]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Top-Center: Location Indicator, Chapter & Objective */}
        <div className="pointer-events-auto hidden md:flex flex-col items-center bg-slate-950/92 border border-slate-800 rounded-2xl px-5 py-3 shadow-xl max-w-md text-center">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
            {txt.chapters[gameState as keyof typeof txt.chapters] || gameState}
          </div>
          <div className="text-xs font-semibold text-cyan-300 mb-1">
            📍 {txt.scenes[sceneId]}
          </div>
          <div className="text-sm font-semibold text-white">{objectiveText}</div>

          {isPlanetSurface && (
            <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono-tabular">
              <span className="text-amber-300">
                ⚡ {resources.basePowerUsed}/{resources.basePowerGenerated} {ru ? 'кВт' : 'kW'}
              </span>
              <span className="text-rose-300">☢ {Math.round(resources.radiationExposure)} mSv</span>
            </div>
          )}

          {canAdvanceChapter && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccess();
                onAdvanceChapter();
              }}
              className="mt-2.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs"
            >
              {advanceLabel}
            </button>
          )}
        </div>

        {/* Top-Right: Travel Map + Streak & Skins + Mini-Map Radar */}
        <div className="pointer-events-auto flex items-start gap-2.5">
          <div className="flex flex-col gap-1.5 bg-slate-950/92 border border-slate-800 rounded-2xl p-2 shadow-xl">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onOpenTravelMap();
              }}
              className="w-full px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <MapIcon className="w-4 h-4" />
              <span>{txt.hud.map} [M]</span>
            </button>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenStreak();
                }}
                className="relative flex-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 font-display font-bold text-[11px] flex items-center justify-center gap-1"
                title={ru ? 'Ежедневные подарки и стрик' : 'Daily Streak Gifts'}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>{ru ? `Стрик ${streakDays}` : `Streak ${streakDays}`}</span>
                {canClaimStreak && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenShop();
                }}
                className="flex-1 px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/60 text-purple-200 font-display font-bold text-[11px] flex items-center justify-center gap-1"
                title={ru ? 'Магазин скинов и украшений' : 'Skins & Decorations Shop'}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-purple-300" />
                <span>{ru ? 'Скины' : 'Shop'}</span>
              </button>
            </div>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setDrawer(drawer === 'journal' ? 'none' : 'journal');
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300"
                title={txt.hud.journal}
              >
                <BookOpen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setDrawer(drawer === 'inventory' ? 'none' : 'inventory');
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300"
                title={txt.hud.inventory}
              >
                <Backpack className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenNasaTerminal();
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-blue-300"
                title={txt.hud.nasaData}
              >
                <Radio className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenMultiplayer();
                }}
                className={`p-2 rounded-xl ${
                  roomCode ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50' : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                }`}
                title={txt.playWithFriends}
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onChangeLanguage(language === 'ru' ? 'en' : 'ru');
                }}
                className="flex-1 px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] font-bold text-slate-200 flex items-center justify-center gap-1"
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{language.toUpperCase()}</span>
              </button>
              <button
                type="button"
                onClick={onToggleSound}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200"
              >
                {soundOn ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenSettings();
                }}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-center bg-slate-950/92 border border-slate-800 rounded-2xl p-2 shadow-xl">
            <canvas ref={radarRef} width={96} height={96} className="rounded-full border border-cyan-500/30" />
            <span className="text-[10px] font-mono-tabular text-slate-400 mt-1 flex items-center gap-1">
              <Compass className="w-3 h-3 text-cyan-400" />
              Radar
            </span>
          </div>
        </div>
      </div>

      {/* LIVE 3D BUS DRIVE OR PLANETARY DESCENT OVERLAY (ZERO LOADING SCREEN!) */}
      {liveTransitMode && (
        <div className="pointer-events-auto self-center w-full max-w-lg bg-slate-950/90 border-2 border-cyan-500/70 rounded-2xl px-5 py-3.5 shadow-2xl">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5">
              {liveTransitMode === 'bus_drive' ? (
                <Bus className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Rocket className="w-5 h-5 text-cyan-400 shrink-0" />
              )}
              <div>
                <div className="font-display font-bold text-sm text-white">
                  {liveTransitMode === 'bus_drive'
                    ? ru
                      ? 'Поездка на Космодром 39А'
                      : 'Driving Crew Bus to Pad 39A'
                    : liveTransitMode === 'moon_descent'
                    ? ru
                      ? 'Управляемая посадка на Луну'
                      : 'Piloted Lunar Touchdown'
                    : liveTransitMode === 'mars_descent'
                    ? ru
                      ? 'Управляемая посадка на Марс'
                      : 'Piloted Mars Touchdown'
                    : ru
                    ? 'Возвращение на Землю'
                    : 'Piloted Earth Return'}
                </div>
                <div className="text-[11px] text-cyan-300 font-mono-tabular">
                  {liveTransitMode === 'bus_drive'
                    ? ru
                      ? `До ракеты: ${transitInfo.distanceLeft} м · Скорость ${transitInfo.speedDisplay} км/ч`
                      : `Distance: ${transitInfo.distanceLeft} m · Speed ${transitInfo.speedDisplay} km/h`
                    : ru
                    ? `Высота: ${transitInfo.altitude} м · A/D/W/S — наведение · ПРОБЕЛ — тяга`
                    : `Altitude: ${transitInfo.altitude} m · WASD steer · SPACE retro-thrust`}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onToggleRocketCamera();
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-white flex items-center gap-1.5 shrink-0"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{rocketCameraMode === 'cockpit' ? (ru ? 'Вид снаружи' : 'Outside View') : ru ? 'Из кабины' : 'Inside View'}</span>
            </button>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all"
              style={{ width: `${transitInfo.progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* REWARD / LEVEL-UP BANNER */}
      {rewardToast && (
        <div className="self-center bg-slate-950/95 border-2 border-amber-400 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-3 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="font-display font-bold text-sm text-amber-300">{rewardToast.title}</div>
            <div className="text-xs text-slate-200">{rewardToast.subtitle}</div>
          </div>
        </div>
      )}

      {/* IN-COCKPIT LIVE ROCKET LAUNCH COUNTDOWN */}
      {launchCountdown !== null && (
        <div className="self-center bg-slate-950/90 border-2 border-amber-500 rounded-2xl px-8 py-4 shadow-2xl text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <Rocket className="w-4 h-4" />
            <span>{ru ? 'БОРТОВОЙ ОТСЧЁТ ABSIDIAN-1' : 'ABSIDIAN-1 IN-COCKPIT LAUNCH'}</span>
          </div>
          <div className="font-display font-black text-4xl text-white tracking-wider">
            {launchCountdown > 0 ? `T - ${launchCountdown}` : ru ? 'ПУСК! ПОЛЁТ В КОСМОС!' : 'LIFTOFF! IN ORBIT!'}
          </div>
          <p className="text-xs text-cyan-300 mt-1">
            {ru ? 'Смотри в панорамный иллюминатор прямо из кресла пилота!' : 'Watch Earth recede through the panoramic viewport from your pilot seat!'}
          </p>
        </div>
      )}

      {/* CENTER OVERLAYS: JOURNAL / CARGO / BUILD */}
      {drawer !== 'none' && (
        <div className="pointer-events-auto self-center w-full max-w-xl bg-slate-950/95 border border-slate-700 rounded-2xl p-5 shadow-2xl max-h-[58vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <h4 className="font-display font-bold text-base text-white">
              {drawer === 'journal' && txt.hud.journal}
              {drawer === 'inventory' && txt.hud.inventory}
              {drawer === 'build' && txt.hud.buildMenu}
            </h4>
            <button
              type="button"
              onClick={() => setDrawer('none')}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {drawer === 'journal' && (
            <div className="space-y-3">
              {journal.map((j) => (
                <div key={j.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <div className="text-xs font-bold text-amber-400">{j.chapter}</div>
                  <div className="font-display font-bold text-sm text-white mb-1">
                    {ru ? j.titleRu : j.titleEn}
                  </div>
                  <p className="text-xs text-slate-300 mb-2">{ru ? j.summaryRu : j.summaryEn}</p>
                  <div className="text-[11px] text-cyan-300 bg-cyan-950/40 px-2.5 py-1.5 rounded-lg">
                    {ru ? j.scienceLessonRu : j.scienceLessonEn}
                  </div>
                </div>
              ))}
            </div>
          )}

          {drawer === 'inventory' && (
            <div className="grid grid-cols-2 gap-2.5">
              {inventory.map((item) => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{ru ? item.nameRu : item.nameEn}</span>
                  <span className="font-mono-tabular font-bold text-cyan-400">×{item.qty}</span>
                </div>
              ))}
            </div>
          )}

          {drawer === 'build' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {buildingTypes.map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => {
                    soundEngine.playRepair();
                    onBuildStructure(bt);
                    setDrawer('none');
                  }}
                  className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
                >
                  <div className="flex items-center justify-between font-display font-bold text-xs text-white mb-1">
                    <span>{txt.buildings[bt].name}</span>
                    <Hammer className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[11px] text-slate-400">{txt.buildings[bt].desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* DIALOGUE PANEL */}
      {dialogue && (
        <div className="pointer-events-auto self-center w-full max-w-2xl bg-slate-950/95 border-2 border-cyan-500/60 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-start gap-4">
            {dialogue.portraitBreed === 'rover' ? (
              <img
                src="/assets/aistudio/2026-11-15_10.04.29_5d16570b.jpg"
                alt="Rover"
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover border border-amber-400 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-cyan-400 overflow-hidden shrink-0">
                <img
                  src="/assets/aistudio/catsinspace_e0224f1c.jpg"
                  alt="Speaker"
                  referrerPolicy="no-referrer"
                  className="w-[300%] h-[200%] max-w-none object-cover"
                  style={{
                    objectPosition:
                      dialogue.portraitBreed === 'director'
                        ? '100% 100%'
                        : `${(CAT_BREEDS.find((b) => b.id === dialogue.portraitBreed)?.col || 0) * 50}% ${(CAT_BREEDS.find((b) => b.id === dialogue.portraitBreed)?.row || 0) * 100}%`,
                  }}
                />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-bold text-base text-white">
                  {ru ? dialogue.speakerRu : dialogue.speakerEn}
                </span>
                <span className="text-xs text-cyan-400">
                  · {ru ? dialogue.roleRu : dialogue.roleEn}
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed mb-3">
                {ru ? dialogue.textRu : dialogue.textEn}
              </p>
              <div className="flex flex-wrap gap-2">
                {dialogue.choices && dialogue.choices.length > 0 ? (
                  dialogue.choices.map((c, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        soundEngine.playDialogueBlip();
                        if (c.action) c.action();
                        onAdvanceDialogue(c.nextIndex);
                      }}
                      className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs"
                    >
                      {ru ? c.labelRu : c.labelEn}
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playDialogueBlip();
                      onAdvanceDialogue();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-xs"
                  >
                    {txt.next}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM BAR */}
      <div className="flex items-end justify-between gap-4">
        <div className="pointer-events-auto flex items-end gap-3">
          <div
            onPointerDown={handleJoyStart}
            onPointerMove={handleJoyMove}
            onPointerUp={handleJoyEnd}
            onPointerCancel={handleJoyEnd}
            className="w-24 h-24 rounded-full bg-slate-950/85 border-2 border-slate-700 flex items-center justify-center touch-none cursor-pointer"
          >
            <div
              className="w-10 h-10 rounded-full bg-cyan-400/90 shadow-lg pointer-events-none"
              style={{ transform: `translate(${joyKnob.x}px, ${joyKnob.y}px)` }}
            />
          </div>

          {difficulty === 'engineer' && (
            <div className="hidden sm:flex items-center gap-3 bg-slate-950/92 border border-amber-500/40 rounded-2xl p-2.5 max-w-xs shadow-xl">
              <img
                src="/assets/aistudio/2026-11-15_10.04.29_5d16570b.jpg"
                alt="Helper Rover R-4"
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-xl object-cover border border-amber-400/50 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold text-xs text-amber-300 flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5" />
                    {txt.hud.roverTitle}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playClick();
                      onRoverScan();
                    }}
                    className="px-2 py-0.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px]"
                  >
                    {txt.hud.roverScan}
                  </button>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                  {roverTip || txt.hud.roverHintIdle}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden lg:block bg-slate-950/85 border border-slate-800 rounded-xl px-4 py-1.5 text-[11px] text-slate-400">
          {txt.hud.controlsHint}
        </div>

        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {sceneId === 'spacecraft' && !liveTransitMode && (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onToggleRocketCamera();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-cyan-500/60 text-cyan-200 font-display font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {rocketCameraMode === 'cockpit'
                    ? ru
                      ? 'Камера: Вид ракеты снаружи'
                      : 'Camera: Exterior Rocket'
                    : ru
                    ? 'Камера: Внутри кабины'
                    : 'Camera: Cockpit Seat'}
                </span>
              </button>
              {launchCountdown === null && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playSuccess();
                    onStartLunarDescent();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs flex items-center gap-1.5 shadow-lg"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>{ru ? 'Начать посадку на Луну' : 'Begin Moon Landing'}</span>
                </button>
              )}
            </div>
          )}

          {isSeated && sceneId === 'spacecraft' && !liveTransitMode && (
            <div className="px-3 py-1 rounded-lg bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 text-[11px] font-semibold">
              {ru
                ? '🪑 Вы сидите в кресле · WASD — рулить ракетой · E — встать'
                : '🪑 Seated pilot · WASD steer rocket · E stand up'}
            </div>
          )}

          {nearbyItem && !dialogue && !liveTransitMode && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onInteract(nearbyItem);
              }}
              className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-display font-bold text-sm shadow-xl"
            >
              <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 font-mono-tabular text-xs">E</span>
              <span>{ru ? nearbyItem.labelRu : nearbyItem.labelEn}</span>
            </button>
          )}

          {isPlanetSurface && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setDrawer(drawer === 'build' ? 'none' : 'build');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs shadow-lg"
              >
                <Building2 className="w-4 h-4" />
                <span>{txt.hud.buildMenu}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onOpenBaseConsole();
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-display font-bold text-xs shadow-lg"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>{txt.hud.baseConsole}</span>
              </button>
            </div>
          )}

          {canAdvanceChapter && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSuccess();
                onAdvanceChapter();
              }}
              className="md:hidden px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-display font-bold text-xs shadow-lg"
            >
              {advanceLabel}
            </button>
          )}
        </div>
      </div>

      {/* DEATH / CRITICAL SURVIVAL RECOVERY MODAL */}
      {showEmergencyModal && (
        <div className="pointer-events-auto fixed inset-0 z-50 bg-rose-950/90 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-2xl p-6 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="font-display text-2xl font-bold text-white mb-2">{txt.emergency.title}</h3>
            <p className="text-sm font-semibold text-rose-300 mb-1">{deathReason}</p>
            <p className="text-xs text-slate-400 mb-5">
              {ru
                ? `На счету экипажа: ${resources.credits} монет. Восстанови все ресурсы прямо сейчас или начни этап заново.`
                : `Crew Balance: ${resources.credits} Coins. Buy emergency supplies right now or restart the stage.`}
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={resources.credits < 50}
                onClick={() => {
                  soundEngine.playSuccess();
                  onEmergencyRecover();
                }}
                className="py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>{txt.emergency.recover}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  onEmergencyRestart();
                }}
                className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{txt.emergency.restart}</span>
              </button>
              {resources.credits < 50 && (
                <p className="text-xs text-slate-400">{txt.emergency.notEnough}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
