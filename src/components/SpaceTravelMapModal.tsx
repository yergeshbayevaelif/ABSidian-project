import React from 'react';
import { Compass, Lock, MapPin, Rocket, Sparkles, X } from 'lucide-react';
import { GameStateId, Language, SceneWorldId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface SpaceTravelMapModalProps {
  language: Language;
  currentScene: SceneWorldId;
  unlockedScenes: SceneWorldId[];
  onClose: () => void;
  onTravelTo: (scene: SceneWorldId, targetState: GameStateId) => void;
  onOpenDeepSpaceProbe: () => void;
}

interface MapNode {
  scene: SceneWorldId;
  state: GameStateId;
  xPct: number;
  yPct: number;
  titleEn: string;
  titleRu: string;
  subEn: string;
  subRu: string;
  lockHintEn: string;
  lockHintRu: string;
  color: string;
  size: number;
}

const MAP_NODES: MapNode[] = [
  {
    scene: 'lab_2140',
    state: 'PROLOGUE',
    xPct: 12,
    yPct: 72,
    titleEn: 'Earth Lab 2140',
    titleRu: 'Лаборатория 2140',
    subEn: 'Emergency Research Wing',
    subRu: 'Аварийный центр Земли',
    lockHintEn: 'Always open',
    lockHintRu: 'Открыто всегда',
    color: '#f59e0b',
    size: 40,
  },
  {
    scene: 'academy',
    state: 'ACADEMY',
    xPct: 27,
    yPct: 48,
    titleEn: 'ABSIDIAN Academy',
    titleRu: 'Академия ABSIDIAN',
    subEn: 'Space Prep & Simulators',
    subRu: 'Подготовка к космосу',
    lockHintEn: 'Stabilize Earth Lab 2140 first',
    lockHintRu: 'Сначала спаси Лабораторию 2140',
    color: '#38bdf8',
    size: 44,
  },
  {
    scene: 'launchpad',
    state: 'LAUNCH',
    xPct: 43,
    yPct: 68,
    titleEn: 'Spaceport Pad 39A',
    titleRu: 'Космодром 39А',
    subEn: 'Fueling & Launch Keypad',
    subRu: 'Заправка и запуск ракеты',
    lockHintEn: 'Complete Academy Mission Plan',
    lockHintRu: 'Заверши проект миссии в Академии',
    color: '#fb923c',
    size: 42,
  },
  {
    scene: 'spacecraft',
    state: 'SPACEFLIGHT',
    xPct: 57,
    yPct: 36,
    titleEn: 'Inside Rocket',
    titleRu: 'Внутри ракеты',
    subEn: 'ABSIDIAN-1 Orbit Cabin',
    subRu: 'Кабина полёта к планетам',
    lockHintEn: 'Fuel rocket & enter Launch Code',
    lockHintRu: 'Заправь ракету и введи код на космодроме',
    color: '#a855f7',
    size: 46,
  },
  {
    scene: 'moon',
    state: 'LUNAR_EXPLORATION',
    xPct: 72,
    yPct: 60,
    titleEn: 'The Moon',
    titleRu: 'Луна (База Шеклтон)',
    subEn: 'Build Base & Mine Ice',
    subRu: 'Строй базу и изучай кратеры',
    lockHintEn: 'Stabilize rocket course & land',
    lockHintRu: 'Стабилизируй курс в ракете',
    color: '#cbd5e1',
    size: 48,
  },
  {
    scene: 'mars',
    state: 'MARS_EXPEDITION',
    xPct: 87,
    yPct: 32,
    titleEn: 'Mars (Jezero)',
    titleRu: 'Марс (База Езеро)',
    subEn: 'Red Planet Colony',
    subRu: 'Колония и оранжереи',
    lockHintEn: 'Build 2+ modules on the Moon',
    lockHintRu: 'Построй 2+ модуля на Луне',
    color: '#ef4444',
    size: 54,
  },
];

export const SpaceTravelMapModal: React.FC<SpaceTravelMapModalProps> = ({
  language,
  currentScene,
  unlockedScenes,
  onClose,
  onTravelTo,
  onOpenDeepSpaceProbe,
}) => {
  const ru = language === 'ru';
  const marsUnlocked = unlockedScenes.includes('mars');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#070b14] border-2 border-cyan-500/50 rounded-2xl p-5 md:p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Compass className="w-6 h-6 text-cyan-400" />
            <div>
              <h3 className="font-display text-lg md:text-xl font-bold text-white">
                {ru ? 'Космическая карта перемещения ABSIDIAN' : 'ABSIDIAN Cosmic Travel Map'}
              </h3>
              <p className="text-xs text-slate-400">
                {ru
                  ? 'Нажми на любую открытую точку, чтобы мгновенно переместиться туда (на Землю, внутрь ракеты или на планету)'
                  : 'Click any unlocked destination to travel immediately — Earth, Academy, Inside Rocket, Moon, or Mars'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Interactive Cosmic Star Chart (inspired by user reference map) */}
        <div
          className="relative w-full h-[360px] md:h-[420px] rounded-2xl border border-slate-800 overflow-hidden"
          style={{
            background:
              'radial-gradient(circle at 20% 80%, rgba(30,58,138,0.28), transparent 45%), radial-gradient(circle at 80% 25%, rgba(153,27,27,0.22), transparent 45%), #03060d',
          }}
        >
          {/* Procedural star dots */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 500" preserveAspectRatio="none">
            {[
              [70, 50], [180, 120], [320, 75], [460, 140], [640, 80], [780, 110], [920, 70],
              [110, 410], [280, 380], [520, 420], [680, 390], [890, 430], [390, 260], [740, 260],
            ].map(([cx, cy], idx) => (
              <circle key={idx} cx={cx} cy={cy} r={idx % 3 === 0 ? 2 : 1.3} fill="#cbd5e1" opacity={0.55} />
            ))}

            {/* Dashed Trajectory Arcs connecting waypoints */}
            {MAP_NODES.slice(0, -1).map((node, idx) => {
              const next = MAP_NODES[idx + 1];
              const unlocked = unlockedScenes.includes(next.scene);
              const x1 = node.xPct * 10;
              const y1 = node.yPct * 5;
              const x2 = next.xPct * 10;
              const y2 = next.yPct * 5;
              const mx = (x1 + x2) / 2;
              const my = Math.min(y1, y2) - 45;
              return (
                <path
                  key={node.scene}
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke={unlocked ? '#38bdf8' : '#334155'}
                  strokeWidth={unlocked ? 3 : 2}
                  strokeDasharray="10 8"
                  opacity={unlocked ? 0.85 : 0.45}
                />
              );
            })}
          </svg>

          {/* Clickable Location Planets / Stations */}
          {MAP_NODES.map((node) => {
            const isCurrent = currentScene === node.scene;
            const isUnlocked = unlockedScenes.includes(node.scene);
            return (
              <button
                key={node.scene}
                type="button"
                disabled={!isUnlocked}
                onClick={() => {
                  soundEngine.playSuccess();
                  onTravelTo(node.scene, node.state);
                  onClose();
                }}
                style={{ left: `${node.xPct}%`, top: `${node.yPct}%` }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center transition-transform ${
                  isUnlocked ? 'hover:scale-110 cursor-pointer' : 'opacity-65 cursor-not-allowed'
                }`}
              >
                {isCurrent && (
                  <span className="mb-1 px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-mono-tabular font-bold text-[10px] shadow flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="w-3 h-3" />
                    {ru ? 'ВЫ ЗДЕСЬ' : 'YOU ARE HERE'}
                  </span>
                )}
                <div
                  className={`rounded-full flex items-center justify-center border-2 shadow-xl transition-all ${
                    isCurrent
                      ? 'border-amber-400 ring-4 ring-amber-400/30'
                      : isUnlocked
                      ? 'border-white/70 group-hover:border-cyan-300'
                      : 'border-slate-700 bg-slate-900'
                  }`}
                  style={{
                    width: node.size,
                    height: node.size,
                    background: isUnlocked
                      ? `radial-gradient(circle at 32% 32%, ${node.color}, #0f172a 85%)`
                      : '#0f172a',
                  }}
                >
                  {!isUnlocked ? (
                    <Lock className="w-4 h-4 text-slate-500" />
                  ) : node.scene === 'spacecraft' ? (
                    <Rocket className="w-5 h-5 text-white" />
                  ) : null}
                </div>

                <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-slate-950/95 border border-slate-800 text-center shadow-lg min-w-[115px]">
                  <div className="font-display font-bold text-xs text-white whitespace-nowrap">
                    {ru ? node.titleRu : node.titleEn}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isUnlocked ? (ru ? node.subRu : node.subEn) : ru ? node.lockHintRu : node.lockHintEn}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Deep Space Robotic Probe Node (Upper Center-Right) */}
          <button
            type="button"
            disabled={!marsUnlocked}
            onClick={() => {
              soundEngine.playClick();
              onClose();
              onOpenDeepSpaceProbe();
            }}
            style={{ left: '89%', top: '74%' }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-transform ${
              marsUnlocked ? 'hover:scale-105 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="w-11 h-11 rounded-full bg-indigo-950 border-2 border-indigo-400 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="mt-1 px-2 py-1 rounded-lg bg-slate-950/95 border border-slate-800 text-center">
              <div className="font-display font-bold text-[11px] text-indigo-200 whitespace-nowrap">
                {ru ? 'Дальний космос (Зонд)' : 'Deep Space Probe'}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
