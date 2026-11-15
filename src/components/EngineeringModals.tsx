import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  CreditCard,
  Download,
  Droplets,
  Fuel,
  Heart,
  Hexagon,
  Orbit,
  Radio,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Sun,
  Wind,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import {
  ActiveMiniGame,
  BuildingInstance,
  Difficulty,
  Language,
  MissionDesignConfig,
  PrologueSystems,
  ResourcesState,
  SpaceWeatherData,
} from '../types/game';
import { t } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface EngineeringModalsProps {
  active: ActiveMiniGame;
  language: Language;
  difficulty: Difficulty;
  prologue: PrologueSystems;
  resources: ResourcesState;
  buildings: BuildingInstance[];
  missionDesign: MissionDesignConfig;
  spaceWeather: SpaceWeatherData | null;
  onClose: () => void;
  onUpdatePrologue: (next: PrologueSystems) => void;
  onCompleteTraining: (missionKey: string, rewardCredits: number, rewardScience: number) => void;
  onSaveMissionDesign: (cfg: MissionDesignConfig) => void;
  onToggleBuildingPower: (id: string) => void;
  onCleanMarsDust: () => void;
  onCompleteFinalMission: () => void;
}

const MODAL_TITLES: Record<ActiveMiniGame['type'], { ru: string; en: string }> = {
  wiring: { ru: 'Проводка резервного генератора', en: 'Backup Generator Wiring' },
  power_divert: { ru: 'Распределение питания (Щиток 2140)', en: 'Emergency Power Divert Panel' },
  clean_vent: { ru: 'Очистка вентиляционной шахты', en: 'Clean O₂ Ventilation Chute' },
  calibrate_rings: { ru: 'Калибровка распределителя · В. Терешкова', en: 'Calibrate Distributor Rings · V. Tereshkova' },
  refuel_tank: { ru: 'Заправочная станция ракеты', en: 'Rocket Fuel Refuel Station' },
  swipe_card: { ru: 'Пропуск котика-астронавта', en: 'Astronaut ID Card Reader' },
  download_data: { ru: 'Загрузка телеметрии · М. Гамильтон', en: 'Download Telemetry Data · M. Hamilton' },
  keypad_code: { ru: 'Кодовая панель допуска запуска', en: 'Launch Clearance Keypad' },
  stabilize_steering: { ru: 'Стабилизация курса ракеты', en: 'Stabilize Spacecraft Steering' },
  chart_course: { ru: 'Прокладка орбиты · К. Джонсон', en: 'Chart Orbital Course · K. Johnson' },
  prime_shields: { ru: 'Активация защитных щитов · К. Кок', en: 'Prime Radiation Shields · C. Koch' },
  habitat_sim: { ru: 'Симулятор автономной базы · К. Кок', en: 'Autonomous Habitat Sim · C. Koch' },
  mission_planner: { ru: 'Голографический стол миссии ABSIDIAN', en: 'ABSIDIAN Mission Design Table' },
  base_console: { ru: 'Управление ресурсами базы', en: 'Base Engineering & Power Console' },
  sample_lab: { ru: 'Спектрометр анализа образцов', en: 'Planetary Sample Spectrometer' },
  deep_space_probe: { ru: 'Глава 9 · Зонд дальнего космоса', en: 'Chapter 9 · Deep Space Probe Designer' },
  final_crisis: { ru: 'Глава 10 · Финальное испытание', en: 'Chapter 10 · The Final Engineering Decision' },
  nasa_terminal: { ru: 'Терминал реальных данных NASA', en: 'NASA Space-Weather & Science Terminal' },
};

const WIRE_DEFS = [
  { id: 'red', color: '#ef4444', symbol: '△', labelRu: 'Красный', labelEn: 'Red' },
  { id: 'blue', color: '#3b82f6', symbol: '✕', labelRu: 'Синий', labelEn: 'Blue' },
  { id: 'yellow', color: '#eab308', symbol: '○', labelRu: 'Жёлтый', labelEn: 'Yellow' },
  { id: 'pink', color: '#ec4899', symbol: '☆', labelRu: 'Розовый', labelEn: 'Pink' },
];
const WIRE_RIGHT_ORDER = ['yellow', 'red', 'pink', 'blue'];

const RING_COLORS = ['#eab308', '#2563eb', '#22d3ee'];

export const EngineeringModals: React.FC<EngineeringModalsProps> = ({
  active,
  language,
  difficulty,
  prologue,
  resources,
  buildings,
  missionDesign,
  spaceWeather,
  onClose,
  onUpdatePrologue,
  onCompleteTraining,
  onSaveMissionDesign,
  onToggleBuildingPower,
  onCleanMarsDust,
  onCompleteFinalMission,
}) => {
  const ru = language === 'ru';
  const txt = t(language);

  // Shared 3-attempts tracker across mini-games!
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const registerMistake = (msgRu: string, msgEn: string, onResetAll: () => void) => {
    soundEngine.playAlert();
    if (attemptsLeft <= 1) {
      setAttemptsLeft(3);
      onResetAll();
      setStatusMsg(txt.outOfAttempts);
    } else {
      setAttemptsLeft((a) => a - 1);
      setStatusMsg(ru ? msgRu : msgEn);
    }
  };

  // 1. WIRING GAME
  const [selectedLeftWire, setSelectedLeftWire] = useState<string | null>(null);
  const [connectedWires, setConnectedWires] = useState<string[]>([]);

  // 2. POWER DIVERT PANEL
  const [breakers, setBreakers] = useState({
    air: prologue.ventilationPower >= 20 ? 25 : 10,
    water: prologue.waterPower >= 20 ? 25 : 10,
    comms: prologue.commsPower >= 10 ? 15 : 5,
    heater: 5,
    lights: 5,
    lab: prologue.labPower >= 10 ? 15 : 0,
  });
  const maxSupply = difficulty === 'commander' ? 65 : 75;
  const totalPower =
    breakers.air + breakers.water + breakers.comms + breakers.heater + breakers.lights + breakers.lab;

  // 3. CLEAN VENT CHUTE (leaves + live sparking coils!)
  const [ventLeaves, setVentLeaves] = useState([
    { id: 1, x: 24, y: 28, cleared: false },
    { id: 2, x: 52, y: 44, cleared: false },
    { id: 3, x: 74, y: 25, cleared: false },
    { id: 4, x: 35, y: 65, cleared: false },
    { id: 5, x: 64, y: 72, cleared: false },
    { id: 6, x: 46, y: 20, cleared: false },
    { id: 7, x: 80, y: 58, cleared: false },
  ]);

  // 4. CALIBRATE DISTRIBUTOR RINGS (3 rotating rings)
  const [ringAngles, setRingAngles] = useState([120, 240, 60]);
  const [ringLocked, setRingLocked] = useState([false, false, false]);
  const ringLockedRef = useRef(ringLocked);
  ringLockedRef.current = ringLocked;

  useEffect(() => {
    if (active.type !== 'calibrate_rings') return;
    let raf = 0;
    let last = performance.now();
    const speeds = [145, 195, 245];
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRingAngles((prev) =>
        prev.map((a, idx) => (ringLockedRef.current[idx] ? 0 : (a + speeds[idx] * dt) % 360))
      );
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active.type]);

  // 5. REFUEL TANK (Hold to Fill Canister up to 100%)
  const [fuelLevel, setFuelLevel] = useState(0);
  const [isPouring, setIsPouring] = useState(false);
  const [fuelLocked, setFuelLocked] = useState(false);

  useEffect(() => {
    if (active.type !== 'refuel_tank' || !isPouring || fuelLocked) return;
    const iv = window.setInterval(() => {
      setFuelLevel((lvl) => {
        const next = Math.min(100, lvl + 2.6);
        if (next >= 100) {
          setIsPouring(false);
          setFuelLocked(true);
          setStatusMsg(null);
          soundEngine.playSuccess();
          return 100;
        }
        return next;
      });
    }, 35);
    return () => clearInterval(iv);
  }, [active.type, isPouring, fuelLocked]);

  // 6. SWIPE ID CARD
  const [cardPos, setCardPos] = useState(0);
  const swipeStartTimeRef = useRef<number | null>(null);
  const [cardAccepted, setCardAccepted] = useState(false);

  // 7. DOWNLOAD DATA (Folder -> Tablet + Checksum Verification)
  const [dlProgress, setDlProgress] = useState(0);
  const [dlActive, setDlActive] = useState(false);
  const [dlChallengeIdx, setDlChallengeIdx] = useState<number | null>(null);
  const dlChecks = [
    { at: 35, target: 'A-07', options: ['B-14', 'A-07', 'C-91'] },
    { at: 72, target: 'X-42', options: ['X-42', 'Z-10', 'K-08'] },
  ];
  const [dlPassedChecks, setDlPassedChecks] = useState<number[]>([]);

  useEffect(() => {
    if (active.type !== 'download_data' || !dlActive || dlChallengeIdx !== null) return;
    const iv = window.setInterval(() => {
      setDlProgress((p) => {
        const next = Math.min(100, p + 3);
        const needCheck = dlChecks.findIndex((c, i) => next >= c.at && !dlPassedChecks.includes(i));
        if (needCheck !== -1) {
          setDlChallengeIdx(needCheck);
          return dlChecks[needCheck].at;
        }
        if (next >= 100) {
          setDlActive(false);
        }
        return next;
      });
    }, 80);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.type, dlActive, dlChallengeIdx, dlPassedChecks]);

  // 8. KEYPAD CODE (Sticky note 5-digit PIN)
  const [targetPin] = useState(() => String(Math.floor(10000 + Math.random() * 89999)));
  const [enteredPin, setEnteredPin] = useState('');

  // 9. STABILIZE STEERING (Drifting radar crosshair)
  const [steerPos, setSteerPos] = useState({ x: 52, y: -38 });
  const [steerLocked, setSteerLocked] = useState(false);
  useEffect(() => {
    if (active.type !== 'stabilize_steering' || steerLocked) return;
    const iv = window.setInterval(() => {
      setSteerPos((p) => {
        const nx = Math.max(-92, Math.min(92, p.x + (Math.random() - 0.48) * 7));
        const ny = Math.max(-92, Math.min(92, p.y + (Math.random() - 0.48) * 7));
        return { x: nx, y: ny };
      });
    }, 120);
    return () => clearInterval(iv);
  }, [active.type, steerLocked]);

  // 10. CHART COURSE (Click waypoints 1 -> 2 -> 3 -> 4)
  const [courseStep, setCourseStep] = useState(0);
  const courseNodes = [
    { id: 1, x: 18, y: 74, label: '1', safe: true },
    { id: 91, x: 34, y: 34, label: '☄', safe: false },
    { id: 2, x: 40, y: 58, label: '2', safe: true },
    { id: 92, x: 58, y: 78, label: '☄', safe: false },
    { id: 3, x: 64, y: 42, label: '3', safe: true },
    { id: 4, x: 84, y: 24, label: '4', safe: true },
  ];

  // 11. PRIME SHIELDS (7 Hexagons, turn all red -> cyan without clicking already-cyan!)
  const [hexShields, setHexShields] = useState<boolean[]>([true, false, true, false, false, true, false]);

  // 12. SAMPLE SPECTROMETER (Multi-band tune with 3 attempts)
  const [freqSlider, setFreqSlider] = useState(40);
  const spectrumMatch = freqSlider >= 64 && freqSlider <= 74;

  // 13. MISSION PLANNER
  const [design, setDesign] = useState<MissionDesignConfig>(missionDesign);
  const totalMass =
    design.solarPanels * 320 +
    design.o2Tanks * 350 +
    design.waterTanks * 420 +
    design.foodPacks * 240 +
    (design.greenhouseKit ? 680 : 0) +
    (design.scienceRig ? 460 : 0) +
    design.radiationShielding * 360;
  const maxMass = difficulty === 'commander' ? 4000 : 4500;
  const designValid =
    totalMass <= maxMass && design.solarPanels >= 2 && design.o2Tanks >= 1 && design.waterTanks >= 1;

  // 14. DEEP SPACE & FINAL
  const [probeAntenna, setProbeAntenna] = useState<'high_gain' | 'compact'>('high_gain');
  const [probePower, setProbePower] = useState<'rtg' | 'solar'>('rtg');
  const [finalChoice, setFinalChoice] = useState<'shield' | 'overdrive' | 'teamwork'>('teamwork');

  const hasAttemptsUI = [
    'wiring',
    'power_divert',
    'clean_vent',
    'calibrate_rings',
    'refuel_tank',
    'swipe_card',
    'download_data',
    'keypad_code',
    'stabilize_steering',
    'chart_course',
    'prime_shields',
    'sample_lab',
  ].includes(active.type);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/90 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 md:p-6 shadow-2xl max-h-[92vh] overflow-y-auto text-slate-100">
        {/* Header + 3 Attempts Indicator */}
        <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="font-display text-lg md:text-xl font-bold text-white truncate">
              {ru ? MODAL_TITLES[active.type].ru : MODAL_TITLES[active.type].en}
            </h3>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {hasAttemptsUI && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 mr-1">{txt.attemptsLeft}:</span>
                {[1, 2, 3].map((i) => (
                  <Heart
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i <= attemptsLeft ? 'text-rose-500 fill-rose-500' : 'text-slate-700'
                    }`}
                  />
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              aria-label={txt.close}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mistake / Feedback Banner */}
        {statusMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-950/60 border border-amber-500/60 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* 1. FIX WIRING (Red, Blue, Yellow, Pink with Shapes) */}
        {active.type === 'wiring' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Соедини все 4 провода резервного генератора по цвету и символу: нажми контакт слева, затем такой же справа.'
                : 'Connect all 4 backup generator wires by matching colors & symbols: click a left terminal, then its matching right terminal.'}
            </p>
            <div className="relative p-5 rounded-xl bg-[#0a0f1c] border border-slate-800 grid grid-cols-[1fr_140px_1fr] items-center gap-2">
              <div className="space-y-3 z-10">
                {WIRE_DEFS.map((w) => {
                  const done = connectedWires.includes(w.id);
                  const activeL = selectedLeftWire === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      disabled={done}
                      onClick={() => {
                        soundEngine.playClick();
                        setSelectedLeftWire(w.id);
                      }}
                      className={`w-full py-3 px-4 rounded-xl border-2 font-display font-bold text-sm flex items-center justify-between transition-all ${
                        done
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : activeL
                          ? 'border-white scale-[1.03]'
                          : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                      }`}
                      style={{ boxShadow: activeL ? `0 0 18px ${w.color}` : undefined }}
                    >
                      <span>{ru ? w.labelRu : w.labelEn}</span>
                      <span className="text-lg font-bold" style={{ color: w.color }}>
                        {w.symbol}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* SVG Live Wires */}
              <svg className="w-full h-56 pointer-events-none" viewBox="0 0 140 220" preserveAspectRatio="none">
                {connectedWires.map((id) => {
                  const leftIdx = WIRE_DEFS.findIndex((w) => w.id === id);
                  const rightIdx = WIRE_RIGHT_ORDER.indexOf(id);
                  const wire = WIRE_DEFS[leftIdx];
                  const y1 = 26 + leftIdx * 55;
                  const y2 = 26 + rightIdx * 55;
                  return (
                    <path
                      key={id}
                      d={`M 0 ${y1} C 55 ${y1}, 85 ${y2}, 140 ${y2}`}
                      fill="none"
                      stroke={wire.color}
                      strokeWidth={7}
                      strokeLinecap="round"
                    />
                  );
                })}
              </svg>

              <div className="space-y-3 z-10">
                {WIRE_RIGHT_ORDER.map((id) => {
                  const w = WIRE_DEFS.find((x) => x.id === id)!;
                  const done = connectedWires.includes(w.id);
                  return (
                    <button
                      key={w.id}
                      type="button"
                      disabled={done}
                      onClick={() => {
                        if (!selectedLeftWire) return;
                        if (selectedLeftWire === w.id) {
                          soundEngine.playRepair();
                          const next = [...connectedWires, w.id];
                          setConnectedWires(next);
                          setSelectedLeftWire(null);
                          setStatusMsg(null);
                        } else {
                          registerMistake(
                            'Неверный провод! Проверь цвет и символ.',
                            'Wrong wire match! Check the color and symbol.',
                            () => {
                              setConnectedWires([]);
                              setSelectedLeftWire(null);
                            }
                          );
                          setSelectedLeftWire(null);
                        }
                      }}
                      className={`w-full py-3 px-4 rounded-xl border-2 font-display font-bold text-sm flex items-center justify-between transition-all ${
                        done
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
                          : 'border-slate-700 bg-slate-900 hover:border-cyan-400'
                      }`}
                    >
                      <span className="text-lg font-bold" style={{ color: w.color }}>
                        {w.symbol}
                      </span>
                      <span>{done ? 'OK' : '⚡'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              disabled={connectedWires.length < 4}
              onClick={() => {
                soundEngine.playSuccess();
                onUpdatePrologue({ ...prologue, generatorRepaired: true });
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Запустить генератор (Проводка готова)' : 'Ignite Generator (Wiring Complete)'}
            </button>
          </div>
        )}

        {/* 2. DIVERT POWER BREAKER TREE */}
        {active.type === 'power_divert' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? `Мощность ограничена (${maxSupply} кВт)! Оставь максимум энергии для Воздуха (≥ 20), Воды (≥ 20) и Связи (≥ 10), снизив приборы лаборатории.`
                : `Grid capacity is limited (${maxSupply} kW)! Keep Air (≥ 20), Water (≥ 20), and Comms (≥ 10) powered by lowering non-essential lab instruments.`}
            </p>

            {/* Electrical Bus Tree Visualization */}
            <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="flex items-center gap-2 text-xs font-bold uppercase text-amber-400">
                  <Zap className="w-4 h-4" />
                  {ru ? 'Схема электросети' : 'Power Distribution Tree'}
                </span>
                <span className={`font-mono-tabular text-sm font-bold ${totalPower > maxSupply ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalPower} / {maxSupply} {ru ? 'кВт' : 'kW'}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                {[
                  { key: 'air' as const, label: ru ? 'Воздух' : 'O₂ Air', min: 20 },
                  { key: 'water' as const, label: ru ? 'Вода' : 'Water', min: 20 },
                  { key: 'comms' as const, label: ru ? 'Связь' : 'Comms', min: 10 },
                  { key: 'heater' as const, label: ru ? 'Тепло' : 'Heater', min: 0 },
                  { key: 'lights' as const, label: ru ? 'Свет' : 'Lights', min: 0 },
                  { key: 'lab' as const, label: ru ? 'Приборы' : 'Lab', min: 0 },
                ].map((col) => {
                  const val = breakers[col.key];
                  const ok = val >= col.min;
                  return (
                    <div key={col.key} className="bg-slate-950 border border-slate-800 rounded-xl p-2 flex flex-col items-center">
                      <div className="text-[10px] text-slate-400 mb-1 truncate">{col.label}</div>
                      <div className="w-5 h-20 bg-slate-900 rounded-md overflow-hidden flex flex-col justify-end border border-slate-800">
                        <div
                          className={`w-full transition-all ${ok ? 'bg-amber-400' : 'bg-rose-500'}`}
                          style={{ height: `${Math.min(100, (val / 30) * 100)}%` }}
                        />
                      </div>
                      <div className="text-[11px] font-mono-tabular font-bold mt-1 text-white">{val}</div>
                      <div className="flex gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setBreakers((b) => ({ ...b, [col.key]: Math.max(0, b[col.key] - 5) }));
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setBreakers((b) => ({ ...b, [col.key]: Math.min(30, b[col.key] + 5) }));
                          }}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  const valid =
                    totalPower <= maxSupply &&
                    breakers.air >= 20 &&
                    breakers.water >= 20 &&
                    breakers.comms >= 10;
                  if (!valid) {
                    registerMistake(
                      'Неверный баланс! Проверь лимит кВт и минимумы для Воздуха, Воды и Связи.',
                      'Invalid grid balance! Stay under max kW and keep Air ≥ 20, Water ≥ 20, Comms ≥ 10.',
                      () =>
                        setBreakers({
                          air: 10,
                          water: 10,
                          comms: 5,
                          heater: 5,
                          lights: 5,
                          lab: 15,
                        })
                    );
                    return;
                  }
                  soundEngine.playSuccess();
                  onUpdatePrologue({
                    ...prologue,
                    ventilationPower: breakers.air,
                    waterPower: breakers.water,
                    commsPower: breakers.comms,
                    labPower: breakers.lab,
                    generatorRepaired: true,
                    stabilized: true,
                  });
                  onClose();
                }}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm"
              >
                {ru ? 'Активировать питание центра' : 'Commit Power Grid'}
              </button>
            </div>
          </div>
        )}

        {/* 3. CLEAN O₂ VENTILATION CHUTE */}
        {active.type === 'clean_vent' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Убери все сухие листья из вентиляционной трубы кликом мыши — но не задень красные искры короткого замыкания!'
                : 'Click all dried leaves out of the O₂ ventilation chute without touching the red electrical sparks!'}
            </p>
            <div className="relative h-64 rounded-xl bg-[#111827] border-4 border-slate-700 overflow-hidden shadow-inner">
              {/* Spinning Vent Grille Stripes */}
              <div className="absolute inset-0 opacity-20 flex flex-col justify-evenly pointer-events-none">
                {[0, 1, 2, 3, 4].map((row) => (
                  <div key={row} className="h-3 bg-slate-950 border-y border-slate-600" />
                ))}
              </div>

              {/* Hazard Sparks */}
              {[
                { x: 18, y: 50 },
                { x: 60, y: 38 },
              ].map((sp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    registerMistake(
                      'Осторожно, искра! Кликай только по листьям.',
                      'Zap! Avoid red sparks and click only the leaves.',
                      () => setVentLeaves((ls) => ls.map((l) => ({ ...l, cleared: false })))
                    )
                  }
                  style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-rose-600/30 border border-rose-400 text-rose-300 flex items-center justify-center animate-pulse"
                >
                  ⚡
                </button>
              ))}

              {/* Leaves */}
              {ventLeaves.map(
                (leaf) =>
                  !leaf.cleared && (
                    <button
                      key={leaf.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        setVentLeaves((prev) =>
                          prev.map((l) => (l.id === leaf.id ? { ...l, cleared: true } : l))
                        );
                      }}
                      style={{ left: `${leaf.x}%`, top: `${leaf.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-2 rounded-xl bg-amber-800/90 hover:bg-amber-700 border border-amber-500/70 text-amber-200 text-lg shadow-lg transition-transform hover:scale-110"
                    >
                      🍂
                    </button>
                  )
              )}

              {ventLeaves.every((l) => l.cleared) && (
                <div className="absolute inset-0 flex items-center justify-center bg-emerald-950/40">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-display font-bold text-sm">
                    <Wind className="w-5 h-5 animate-spin" />
                    <span>{ru ? 'Воздушный поток чист на 100%!' : 'Airflow 100% Clear!'}</span>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={!ventLeaves.every((l) => l.cleared)}
              onClick={() => {
                soundEngine.playSuccess();
                onUpdatePrologue({ ...prologue, ventCleared: true });
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Запустить вентилятор О₂' : 'Restart O₂ Fan'}
            </button>
          </div>
        )}

        {/* 4. CALIBRATE DISTRIBUTOR RINGS (3 Rotating Rings) */}
        {active.type === 'calibrate_rings' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Валентина Терешкова учила сохранять хладнокровие! Останови каждое из 3 вращающихся колец в тот момент, когда чёрный контакт совместится с разъёмом справа.'
                : 'Stop each rotating ring right when its black connector tab aligns with the right-hand wire contact!'}
            </p>
            <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              {[0, 1, 2].map((idx) => {
                const locked = ringLocked[idx];
                const ang = ringAngles[idx];
                return (
                  <div key={idx} className="flex items-center justify-between gap-4">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <div
                        className="w-16 h-16 rounded-full border-[6px] flex items-center justify-center relative"
                        style={{
                          borderColor: RING_COLORS[idx],
                          transform: `rotate(${ang}deg)`,
                        }}
                      >
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-sm bg-slate-950 border-2 border-white" />
                      </div>
                      <span className="absolute font-display font-bold text-lg text-white">{idx + 1}</span>
                    </div>

                    <div className="flex-1 h-2 bg-slate-800 rounded-full relative">
                      <div
                        className={`h-full rounded-full ${locked ? 'bg-emerald-400' : 'bg-cyan-400/50'}`}
                        style={{ width: locked ? '100%' : '25%' }}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => {
                        const diff = Math.min(ang, 360 - ang);
                        if (diff <= 34) {
                          soundEngine.playRepair();
                          const next = [...ringLocked];
                          next[idx] = true;
                          setRingLocked(next);
                          setStatusMsg(null);
                        } else {
                          registerMistake(
                            `Кольцо #${idx + 1} не совпало! Лови момент, когда метка справа.`,
                            `Ring #${idx + 1} misaligned! Press when the black tab reaches 3 o'clock.`,
                            () => setRingLocked([false, false, false])
                          );
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl font-display font-bold text-xs ${
                        locked
                          ? 'bg-emerald-600/30 border border-emerald-500 text-emerald-300'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      }`}
                    >
                      {locked ? 'LOCKED' : ru ? `Стоп #${idx + 1}` : `Lock #${idx + 1}`}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!ringLocked.every(Boolean)}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('train_emergency', 55, 30);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Подтвердить калибровку систем' : 'Confirm System Calibration'}
            </button>
          </div>
        )}

        {/* 5. REFUEL TANK (Hold to Fill Fuel Canister) */}
        {active.type === 'refuel_tank' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Удерживай кнопку заправки, пока уровень топлива не заполнится полностью до 100%!'
                : 'Hold the fuel lever until the rocket tank reaches 100%!'}
            </p>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-around gap-6">
              <div className="relative w-32 h-52 rounded-2xl border-4 border-orange-500 bg-slate-900 overflow-hidden flex flex-col justify-end">
                <div className="absolute left-0 right-0 top-0 h-3 bg-emerald-500/35 border-b-2 border-emerald-400 z-10 pointer-events-none" />
                <div
                  className={`w-full transition-all ${
                    fuelLevel >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                  style={{ height: `${Math.min(100, fuelLevel)}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                  <Fuel className="w-10 h-10 text-white/80" />
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="text-center">
                  <div className="text-xs text-slate-400">{ru ? 'Уровень криогенного топлива' : 'Cryo-Fuel Level'}</div>
                  <div className="font-mono-tabular text-3xl font-bold text-amber-400">
                    {Math.round(fuelLevel)}%
                  </div>
                </div>
                <button
                  type="button"
                  disabled={fuelLocked}
                  onPointerDown={() => {
                    if (!fuelLocked) setIsPouring(true);
                  }}
                  onPointerUp={() => {
                    if (!isPouring) return;
                    setIsPouring(false);
                    if (fuelLevel >= 98) {
                      soundEngine.playSuccess();
                      setFuelLevel(100);
                      setFuelLocked(true);
                      setStatusMsg(null);
                    }
                  }}
                  onPointerLeave={() => {
                    if (isPouring) setIsPouring(false);
                  }}
                  className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:bg-emerald-600 text-slate-950 font-display font-bold text-sm select-none touch-none"
                >
                  {fuelLocked
                    ? ru
                      ? 'Бак заправлен на 100%!'
                      : 'Tank Fueled to 100%!'
                    : ru
                    ? 'УДЕРЖИВАЙ: ЗАПРАВИТЬ ДО 100%'
                    : 'HOLD TO FILL TO 100%'}
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!fuelLocked}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('launchpad_fuel', 50, 20);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Отсоединить топливный шланг' : 'Disconnect Fuel Hose'}
            </button>
          </div>
        )}

        {/* 6. SWIPE ID CARD */}
        {active.type === 'swipe_card' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Плавно проведи карту астронавта по считывателю слева направо (не слишком быстро и не слишком медленно)!'
                : 'Slide the Cat Astronaut ID card smoothly across the reader at a steady speed!'}
            </p>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 font-mono-tabular text-xs">
                <span className="flex items-center gap-2 text-cyan-300">
                  <CreditCard className="w-4 h-4" />
                  ABSIDIAN SECURITY GATE
                </span>
                <span className={cardAccepted ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                  {cardAccepted ? 'ACCEPTED' : 'READY'}
                </span>
              </div>

              <input
                type="range"
                min={0}
                max={100}
                disabled={cardAccepted}
                value={cardPos}
                onPointerDown={() => {
                  swipeStartTimeRef.current = performance.now();
                }}
                onChange={(e) => setCardPos(Number(e.target.value))}
                onPointerUp={() => {
                  const dt = swipeStartTimeRef.current ? performance.now() - swipeStartTimeRef.current : 0;
                  if (cardPos < 88) {
                    setCardPos(0);
                    return;
                  }
                  if (dt < 220) {
                    registerMistake(
                      'Слишком быстро! Проведи карту чуть плавнее.',
                      'Too fast! Swipe the card smoothly.',
                      () => setCardPos(0)
                    );
                    setCardPos(0);
                  } else if (dt > 1750) {
                    registerMistake(
                      'Слишком медленно! Сделай уверенное движение.',
                      'Too slow! Use a steady swipe.',
                      () => setCardPos(0)
                    );
                    setCardPos(0);
                  } else {
                    soundEngine.playSuccess();
                    setCardAccepted(true);
                    setStatusMsg(null);
                  }
                }}
                className="w-full h-10 accent-cyan-400 cursor-grab"
              />
            </div>

            <button
              type="button"
              disabled={!cardAccepted}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('academy_card', 40, 15);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Подтвердить допуск в Академию' : 'Confirm Academy Clearance'}
            </button>
          </div>
        )}

        {/* 7. DOWNLOAD DATA (Folder -> Tablet Checksum Verify) */}
        {active.type === 'download_data' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Запусти передачу полётного ПО Маргарет Гамильтон на планшет и подтверждай контрольные пакеты!'
                : 'Download Margaret Hamilton’s flight telemetry to the tablet and verify matching checksum packets!'}
            </p>
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between px-4">
                <div className="px-4 py-3 rounded-xl bg-amber-500/20 border border-amber-500 text-amber-300 font-bold text-xs">
                  📁 FLIGHT_OS.BIN
                </div>
                <div className="flex-1 mx-4 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                  <div className="h-full bg-cyan-400 transition-all" style={{ width: `${dlProgress}%` }} />
                </div>
                <div className="px-4 py-3 rounded-xl bg-cyan-500/20 border border-cyan-500 text-cyan-300 font-bold text-xs flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {dlProgress}%
                </div>
              </div>

              {dlChallengeIdx !== null && (
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500 text-center space-y-3">
                  <div className="text-xs font-bold text-amber-300">
                    {ru
                      ? `Подтверди пакет: [${dlChecks[dlChallengeIdx].target}]`
                      : `Verify Telemetry Checksum: [${dlChecks[dlChallengeIdx].target}]`}
                  </div>
                  <div className="flex justify-center gap-3">
                    {dlChecks[dlChallengeIdx].options.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          if (opt === dlChecks[dlChallengeIdx].target) {
                            soundEngine.playRepair();
                            setDlPassedChecks((p) => [...p, dlChallengeIdx]);
                            setDlChallengeIdx(null);
                            setStatusMsg(null);
                          } else {
                            registerMistake(
                              'Неверный пакет! Выбери совпадающий код.',
                              'Checksum mismatch! Click the matching code.',
                              () => {
                                setDlProgress(0);
                                setDlActive(false);
                                setDlChallengeIdx(null);
                                setDlPassedChecks([]);
                              }
                            );
                          }
                        }}
                        className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 font-mono-tabular font-bold text-xs"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {dlProgress < 100 && !dlActive && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setDlActive(true);
                  }}
                  className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-sm"
                >
                  {ru ? 'Начать загрузку данных' : 'Start Telemetry Download'}
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={dlProgress < 100}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('train_software', 45, 25);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'ПО загружено на бортовой компьютер!' : 'Flight Software Verified!'}
            </button>
          </div>
        )}

        {/* 8. KEYPAD CODE (Sticky Note 5-digit PIN) */}
        {active.type === 'keypad_code' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Введи 5-значный код допуска с жёлтой памятки инженера на панели ракеты!'
                : 'Enter the 5-digit launch clearance code shown on the sticky note!'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 bg-slate-950 p-5 rounded-xl border border-slate-800">
              {/* Keypad */}
              <div className="w-56 bg-slate-800 p-3 rounded-xl border border-slate-600 space-y-3">
                <div className="h-10 bg-emerald-950 border border-emerald-600 rounded-lg flex items-center justify-center font-mono-tabular text-xl tracking-[0.25em] text-emerald-300">
                  {enteredPin.padEnd(5, '_')}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        if (k === 'C') {
                          setEnteredPin('');
                        } else if (k === '✓') {
                          if (enteredPin === targetPin) {
                            soundEngine.playSuccess();
                            onCompleteTraining('launchpad_keypad', 45, 20);
                            onClose();
                          } else {
                            registerMistake(
                              'Неверный код! Посмотри на жёлтую записку.',
                              'Wrong launch code! Check the sticky note.',
                              () => setEnteredPin('')
                            );
                            setEnteredPin('');
                          }
                        } else if (enteredPin.length < 5) {
                          setEnteredPin((p) => p + k);
                        }
                      }}
                      className={`py-2.5 rounded-lg font-mono-tabular font-bold text-base ${
                        k === '✓'
                          ? 'bg-emerald-500 text-slate-950'
                          : k === 'C'
                          ? 'bg-rose-500 text-white'
                          : 'bg-slate-700 hover:bg-slate-600 text-white'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sticky Note */}
              <div className="w-40 h-32 bg-amber-200 text-slate-900 p-4 rounded-sm shadow-lg rotate-3 flex flex-col justify-between">
                <div className="text-[11px] font-bold uppercase text-amber-900">
                  {ru ? 'Код старта:' : 'Launch PIN:'}
                </div>
                <div className="font-mono-tabular text-3xl font-extrabold tracking-widest text-center">
                  {targetPin}
                </div>
                <div className="text-[10px] text-amber-800 text-right">ABSIDIAN-1</div>
              </div>
            </div>
          </div>
        )}

        {/* 9. STABILIZE STEERING (Drifting Radar Bullseye) */}
        {active.type === 'stabilize_steering' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Космический ветер уводит ракету! Кликай в центр радара или выровняй прицел, чтобы поймать зелёную отметку в центре круга.'
                : 'Solar wind pushes the ship off course! Click or steer the drifting marker back into the center bullseye!'}
            </p>
            <div className="flex justify-center">
              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dx = e.clientX - (rect.left + rect.width / 2);
                  const dy = e.clientY - (rect.top + rect.height / 2);
                  const next = {
                    x: steerPos.x - dx * 0.45,
                    y: steerPos.y - dy * 0.45,
                  };
                  setSteerPos(next);
                  const dist = Math.hypot(next.x, next.y);
                  if (dist < 18) {
                    soundEngine.playSuccess();
                    setSteerLocked(true);
                  }
                }}
                className="relative w-64 h-64 rounded-full bg-[#1a2e22] border-4 border-emerald-500/70 cursor-crosshair overflow-hidden"
              >
                <div className="absolute inset-0 border border-emerald-400/20 rounded-full m-8 pointer-events-none" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-400/30 pointer-events-none" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-400/30 pointer-events-none" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full border-2 border-emerald-300 pointer-events-none" />
                <div
                  className="absolute w-7 h-7 rounded-full border-2 border-amber-400 bg-amber-400/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: `calc(50% + ${steerPos.x}px)`, top: `calc(50% + ${steerPos.y}px)` }}
                />
              </div>
            </div>
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playRepair();
                  setSteerPos({ x: 0, y: 0 });
                  setSteerLocked(true);
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300"
              >
                {ru ? 'Авто-триммер курса' : 'Engage Auto-Trim'}
              </button>
            </div>
            <button
              type="button"
              disabled={!steerLocked}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('spacecraft_steer', 55, 30);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Курс стабилизирован!' : 'Steering Locked!'}
            </button>
          </div>
        )}

        {/* 10. CHART COURSE (Click Orbital Constellation 1->2->3->4) */}
        {active.type === 'chart_course' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Кэтрин Джонсон учила точности! Нажимай безопасные маяки орбиты по порядку 1 → 2 → 3 → 4 и избегай метеоритов (☄).'
                : 'Click the safe orbital waypoints in exact sequence 1 → 2 → 3 → 4 while avoiding asteroid hazards (☄)!'}
            </p>
            <div className="relative h-64 rounded-xl bg-[#050a18] border border-cyan-500/40 overflow-hidden">
              {courseNodes.map((node) => {
                const done = node.safe && courseStep >= node.id;
                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => {
                      if (!node.safe) {
                        registerMistake(
                          'Столкновение с метеоритом! Выбирай только числа 1→2→3→4.',
                          'Asteroid hazard! Follow numbered waypoints 1→2→3→4.',
                          () => setCourseStep(0)
                        );
                        return;
                      }
                      if (node.id === courseStep + 1) {
                        soundEngine.playRepair();
                        setCourseStep(node.id);
                        setStatusMsg(null);
                      } else if (node.id > courseStep + 1) {
                        registerMistake(
                          `Сначала выбери точку #${courseStep + 1}!`,
                          `Click waypoint #${courseStep + 1} first!`,
                          () => setCourseStep(0)
                        );
                      }
                    }}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full font-display font-bold text-sm border-2 transition-transform hover:scale-110 ${
                      !node.safe
                        ? 'bg-rose-950 border-rose-500 text-rose-300'
                        : done
                        ? 'bg-emerald-500 border-white text-slate-950'
                        : 'bg-cyan-950 border-cyan-400 text-cyan-200'
                    }`}
                  >
                    {node.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              disabled={courseStep < 4}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('train_orbital', 45, 25);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Орбитальный маршрут проложен!' : 'Orbital Course Locked!'}
            </button>
          </div>
        )}

        {/* 11. PRIME RADIATION SHIELDS (Hexagons Red -> Cyan) */}
        {active.type === 'prime_shields' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Нажми только на КРАСНЫЕ сектора защитного щита, чтобы зарядить их! Не нажимай уже активные голубые.'
                : 'Click only the RED unprimed hex panels to activate the shield dome! Avoid clicking already-charged cyan panels.'}
            </p>
            <div className="flex flex-wrap justify-center gap-3 p-5 rounded-xl bg-[#071124] border border-slate-800">
              {hexShields.map((isRed, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (isRed) {
                      soundEngine.playRepair();
                      const next = [...hexShields];
                      next[idx] = false;
                      setHexShields(next);
                      setStatusMsg(null);
                    } else {
                      registerMistake(
                        'Этот сектор уже активен — перезагрузка щита!',
                        'Panel already charged — shield surge!',
                        () => setHexShields([true, false, true, false, false, true, false])
                      );
                    }
                  }}
                  className={`w-20 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                    isRed
                      ? 'bg-rose-600/35 border-rose-500 text-rose-200 hover:bg-rose-600/50'
                      : 'bg-cyan-500/25 border-cyan-300 text-cyan-200'
                  }`}
                >
                  <Hexagon className="w-8 h-8" />
                  <span className="text-[10px] font-bold mt-1">
                    {isRed ? (ru ? 'СБОЙ' : 'OFF') : 'OK'}
                  </span>
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={hexShields.some(Boolean)}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('train_habitat', 70, 35);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Радиационные щиты заряжены на 100%!' : 'Shields 100% Online!'}
            </button>
          </div>
        )}

        {/* MISSION PAYLOAD DESIGNER (CHAPTER 3) */}
        {active.type === 'mission_planner' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-xs text-slate-400">{ru ? 'Масса груза ракеты:' : 'Rocket Payload Mass:'}</span>
              <span className={`font-mono-tabular text-base font-bold ${totalMass > maxMass ? 'text-rose-400' : 'text-emerald-400'}`}>
                {totalMass} / {maxMass} {ru ? 'кг' : 'kg'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span>{ru ? 'Солнечные батареи' : 'Solar Arrays'}</span>
                  <span className="font-mono-tabular text-amber-400">{design.solarPanels}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={design.solarPanels}
                  onChange={(e) => setDesign({ ...design, solarPanels: Number(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span>{ru ? 'Баллоны О₂' : 'O₂ Tanks'}</span>
                  <span className="font-mono-tabular text-cyan-400">{design.o2Tanks}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={design.o2Tanks}
                  onChange={(e) => setDesign({ ...design, o2Tanks: Number(e.target.value) })}
                  className="w-full accent-cyan-400"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span>{ru ? 'Баки воды' : 'Water Tanks'}</span>
                  <span className="font-mono-tabular text-blue-400">{design.waterTanks}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={design.waterTanks}
                  onChange={(e) => setDesign({ ...design, waterTanks: Number(e.target.value) })}
                  className="w-full accent-blue-400"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex justify-between mb-1">
                  <span>{ru ? 'Радиационная защита' : 'Radiation Shielding'}</span>
                  <span className="font-mono-tabular text-emerald-400">Lvl {design.radiationShielding}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  value={design.radiationShielding}
                  onChange={(e) => setDesign({ ...design, radiationShielding: Number(e.target.value) })}
                  className="w-full accent-emerald-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setDesign({ ...design, greenhouseKit: !design.greenhouseKit })}
                className={`p-3 rounded-xl border font-semibold ${
                  design.greenhouseKit ? 'border-emerald-500 bg-emerald-500/15 text-emerald-200' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {ru ? 'Модуль оранжереи (+680 кг)' : 'Greenhouse Dome Kit (+680 kg)'}
              </button>
              <button
                type="button"
                onClick={() => setDesign({ ...design, scienceRig: !design.scienceRig })}
                className={`p-3 rounded-xl border font-semibold ${
                  design.scienceRig ? 'border-purple-500 bg-purple-500/15 text-purple-200' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {ru ? 'Научный спектрометр (+460 кг)' : 'Science Rig (+460 kg)'}
              </button>
            </div>
            <button
              type="button"
              disabled={!designValid}
              onClick={() => {
                soundEngine.playSuccess();
                onSaveMissionDesign(design);
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {totalMass > maxMass
                ? ru
                  ? 'Слишком большой вес! Уменьши груз'
                  : 'Payload Too Heavy! Reduce Cargo'
                : ru
                  ? 'Утвердить проект и ехать на космодром!'
                  : 'Approve Mission & Go to Spaceport!'}
            </button>
          </div>
        )}

        {/* BASE CONSOLE */}
        {active.type === 'base_console' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">{txt.hud.power}</div>
                <div className="font-mono-tabular text-lg font-bold text-amber-400">
                  {resources.basePowerUsed} / {resources.basePowerGenerated} {ru ? 'кВт' : 'kW'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">{txt.hud.water}</div>
                <div className="font-mono-tabular text-lg font-bold text-cyan-400">{Math.round(resources.waterReserve)}%</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-[11px] text-slate-400">{txt.hud.food}</div>
                <div className="font-mono-tabular text-lg font-bold text-emerald-400">{Math.round(resources.foodReserve)}%</div>
              </div>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {buildings.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">
                  {ru ? 'Пока нет построенных модулей. Используй «Строить базу»!' : 'No modules built yet. Use the Build Base menu!'}
                </div>
              ) : (
                buildings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{txt.buildings[b.type].name}</div>
                      <div className="text-slate-400">
                        {b.planet.toUpperCase()} · {ru ? 'Пыль' : 'Dust'}: {Math.round(b.dustLevel)}%
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playClick();
                        onToggleBuildingPower(b.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold ${
                        b.powered ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {b.powered ? (ru ? 'ВКЛ' : 'ON') : ru ? 'ВЫКЛ' : 'OFF'}
                    </button>
                  </div>
                ))
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playRepair();
                onCleanMarsDust();
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Sun className="w-4 h-4" />
              <span>{ru ? 'Очистить солнечные панели от пыли' : 'Clean Dust From Solar Panels'}</span>
            </button>
          </div>
        )}

        {/* SAMPLE SPECTROMETER LAB */}
        {active.type === 'sample_lab' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Настрой частоту лазера в окно 640–740 nm, чтобы подтвердить кристаллы воды H₂O!'
                : 'Tune the spectrometer laser into 640–740 nm to confirm H₂O ice crystals!'}
            </p>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex justify-between text-xs mb-2">
                <span>{ru ? 'Длина волны анализа' : 'Analysis Wavelength'}</span>
                <span className="font-mono-tabular text-cyan-400">{freqSlider}0 nm</span>
              </div>
              <input
                type="range"
                min={20}
                max={95}
                value={freqSlider}
                onChange={(e) => setFreqSlider(Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                if (!spectrumMatch) {
                  registerMistake(
                    'Частота вне окна 640–740 nm!',
                    'Frequency outside 640–740 nm H₂O peak!',
                    () => setFreqSlider(40)
                  );
                  return;
                }
                soundEngine.playSuccess();
                onCompleteTraining(active.contextId || 'sample_analyzed', 55, 45);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-display font-bold text-sm"
            >
              {ru ? 'Записать научное открытие (+55 монет, +45 Науки)' : 'Record Scientific Discovery (+55 Coins)'}
            </button>
          </div>
        )}

        {/* DEEP SPACE PROBE DESIGNER */}
        {active.type === 'deep_space_probe' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-300">
              {ru
                ? 'Выбери антенну и питание для робота-разведчика в глубоком космосе (где солнечный свет слишком слабый):'
                : 'Pick the antenna & power source for deep space where sunlight is too faint:'}
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setProbeAntenna('high_gain')}
                className={`p-3 rounded-xl border font-bold ${
                  probeAntenna === 'high_gain' ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {ru ? 'Большая параболическая антенна' : 'Deep-Space High-Gain Dish'}
              </button>
              <button
                type="button"
                onClick={() => setProbeAntenna('compact')}
                className={`p-3 rounded-xl border font-bold ${
                  probeAntenna === 'compact' ? 'border-cyan-400 bg-cyan-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {ru ? 'Короткая городская антенна' : 'Short-Range Compact Whip'}
              </button>
              <button
                type="button"
                onClick={() => setProbePower('rtg')}
                className={`p-3 rounded-xl border font-bold ${
                  probePower === 'rtg' ? 'border-amber-400 bg-amber-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {ru ? 'Радиоизотопный генератор (РИТЭГ)' : 'Radioisotope Power (RTG)'}
              </button>
              <button
                type="button"
                onClick={() => setProbePower('solar')}
                className={`p-3 rounded-xl border font-bold ${
                  probePower === 'solar' ? 'border-amber-400 bg-amber-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-400'
                }`}
              >
                {ru ? 'Обычные солнечные батареи' : 'Standard Solar Panels'}
              </button>
            </div>
            <button
              type="button"
              disabled={probeAntenna !== 'high_gain' || probePower !== 'rtg'}
              onClick={() => {
                soundEngine.playSuccess();
                onCompleteTraining('deep_space_probe', 90, 65);
                onClose();
              }}
              className="w-full py-3 rounded-xl bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Запустить зонд дальнего космоса!' : 'Launch Robotic Deep-Space Probe!'}
            </button>
          </div>
        )}

        {/* FINAL CRISIS */}
        {active.type === 'final_crisis' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-700 text-xs text-rose-200 flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0" />
              <span>
                {ru
                  ? 'Солнечная буря приближается к сети баз! Выбери верную стратегию выживания экипажа:'
                  : 'Solar storm warning! Choose how the ABSIDIAN crew survives the crisis:'}
              </span>
            </div>
            <div className="space-y-2.5 text-xs">
              {[
                {
                  id: 'teamwork' as const,
                  en: 'Protocol A: Prioritize O₂, move crew to Radiation Shield, pause science rigs.',
                  ru: 'Протокол А: Укрыть экипаж под радиационным куполом, отключить лишние приборы и сохранить О₂.',
                },
                {
                  id: 'shield' as const,
                  en: 'Protocol B: Keep Science Lab at 100% power and rely only on suit batteries.',
                  ru: 'Протокол Б: Оставить научные приборы на 100%, надеясь только на батарейки.',
                },
                {
                  id: 'overdrive' as const,
                  en: 'Protocol C: Run everything simultaneously without shielding.',
                  ru: 'Протокол В: Включить всё сразу без защиты от радиации.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFinalChoice(opt.id)}
                  className={`w-full p-3.5 rounded-xl border text-left ${
                    finalChoice === opt.id ? 'border-emerald-400 bg-emerald-500/15 text-white' : 'border-slate-800 bg-slate-950 text-slate-300'
                  }`}
                >
                  {ru ? opt.ru : opt.en}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (finalChoice === 'teamwork') {
                  soundEngine.playSuccess();
                  onCompleteFinalMission();
                  onClose();
                } else {
                  registerMistake(
                    'Опасно! При буре главное — защита экипажа и кислород.',
                    'Unsafe choice! Crew shielding and O₂ always come first.',
                    () => setFinalChoice('teamwork')
                  );
                }
              }}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm"
            >
              {ru ? 'Выполнить финальное решение!' : 'Execute Final Survival Decision!'}
            </button>
          </div>
        )}

        {/* NASA REAL DATA TERMINAL */}
        {active.type === 'nasa_terminal' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-700/60 flex items-start gap-3">
              <Radio className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-blue-300 mb-1">
                  {ru ? 'Живые данные NASA DONKI vs Сюжет 2140 года' : 'Real NASA DONKI Data vs 2140 Story Simulation'}
                </div>
                <p className="text-slate-300">
                  {spaceWeather ? (ru ? spaceWeather.realScienceNote.ru : spaceWeather.realScienceNote.en) : 'Loading...'}
                </p>
                <p className="text-amber-300 mt-1.5">
                  {spaceWeather ? (ru ? spaceWeather.simulationDistinction.ru : spaceWeather.simulationDistinction.en) : ''}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-amber-400 mb-2">
                  {ru ? 'Реальные вспышки (NASA DONKI)' : 'Real Solar Flares (NASA DONKI)'}
                </div>
                {(spaceWeather?.solarFlares || []).map((f) => (
                  <div key={f.id} className="flex justify-between py-1 border-b border-slate-800/70">
                    <span className="font-mono-tabular font-bold text-white">{f.classType}</span>
                    <span className="text-slate-400">{f.peakTime.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-cyan-400 mb-2">
                  {ru ? 'Геомагнитные бури (Kp-индекс)' : 'Geomagnetic Storms (Kp Index)'}
                </div>
                {(spaceWeather?.geomagneticStorms || []).map((g) => (
                  <div key={g.id} className="flex justify-between py-1 border-b border-slate-800/70">
                    <span className="font-mono-tabular font-bold text-white">Kp {g.kpIndex}</span>
                    <span className="text-slate-400">{g.startTime.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
