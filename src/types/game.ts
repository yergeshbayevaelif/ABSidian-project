export type Language = 'ru' | 'en';

export type Difficulty = 'explorer' | 'engineer' | 'commander';

export type CatBreed =
  | 'tabby'
  | 'calico_bw'
  | 'cream_patch'
  | 'snow_white'
  | 'ginger_white'
  | 'tuxedo';

export type Specialization = 'systems' | 'navigation' | 'science' | 'comms';

export type TimeOfDay = 'daylight' | 'twilight' | 'night';

export type GameStateId =
  | 'TITLE_SCREEN'
  | 'PLAYER_SETUP'
  | 'INTRO_CINEMATIC'
  | 'PROLOGUE'
  | 'ACADEMY'
  | 'TRAINING'
  | 'MISSION_PLANNING'
  | 'LAUNCH'
  | 'SPACEFLIGHT'
  | 'LUNAR_EXPLORATION'
  | 'MARS_EXPEDITION'
  | 'DEEP_SPACE'
  | 'FINAL_MISSION'
  | 'RETURN_EARTH'
  | 'MISSION_DEBRIEF';

export type SceneWorldId =
  | 'lab_2140'
  | 'academy'
  | 'launchpad'
  | 'spacecraft'
  | 'moon'
  | 'mars';

export type LiveTransitMode = 'bus_drive' | 'moon_descent' | 'mars_descent' | 'earth_return' | null;
export type RocketCameraMode = 'cockpit' | 'exterior';

export type BuildingType =
  | 'solar'
  | 'habitat'
  | 'o2_station'
  | 'water_recycler'
  | 'greenhouse'
  | 'shield_dome'
  | 'science_lab';

export interface PlayerCustomization {
  id: string;
  name: string;
  breed: CatBreed;
  suitColor: string;
  accentColor: string;
  accessory: 'visor_gold' | 'antenna_comms' | 'sensor_pack' | 'none';
  skinId: string;
  decorations: string[];
  wearingSuit: boolean;
  specialization: Specialization;
  isGuest: boolean;
}

export interface ResourcesState {
  health: number; // 0-100
  oxygen: number; // 0-100
  suitEnergy: number; // 0-100
  stamina: number; // 0-100
  basePowerGenerated: number; // kW
  basePowerUsed: number; // kW
  o2Reserve: number; // %
  waterReserve: number; // %
  foodReserve: number; // %
  radiationExposure: number; // mSv (0-100)
  commsStrength: number; // 0-100
  sciencePoints: number;
  credits: number; // Coins / Монетки
}

export interface PrologueSystems {
  ventilationPower: number;
  waterPower: number;
  commsPower: number;
  labPower: number;
  generatorRepaired: boolean;
  ventCleared: boolean;
  stabilized: boolean;
}

export interface BuildingInstance {
  id: string;
  type: BuildingType;
  planet: 'moon' | 'mars';
  x: number;
  z: number;
  powered: boolean;
  health: number;
  dustLevel: number;
  builtBy: string;
}

export interface InventoryItem {
  id: string;
  nameEn: string;
  nameRu: string;
  qty: number;
  icon: string;
}

export interface JournalEntry {
  id: string;
  chapter: string;
  titleEn: string;
  titleRu: string;
  summaryEn: string;
  summaryRu: string;
  scienceLessonEn: string;
  scienceLessonRu: string;
}

export interface DialogueChoice {
  labelEn: string;
  labelRu: string;
  nextIndex?: number;
  action?: () => void;
}

export interface DialogueNode {
  speakerEn: string;
  speakerRu: string;
  roleEn: string;
  roleRu: string;
  portraitBreed: CatBreed | 'rover' | 'director';
  textEn: string;
  textRu: string;
  choices?: DialogueChoice[];
}

export interface WorldInteractable {
  id: string;
  sceneId: SceneWorldId;
  x: number;
  y: number;
  z: number;
  radius: number;
  labelEn: string;
  labelRu: string;
  kind: 'npc' | 'terminal' | 'repair' | 'door' | 'sample' | 'supply' | 'rocket' | 'build_pad';
  completed?: boolean;
  npcBreed?: CatBreed;
  suitColor?: string;
}

export interface RemotePlayer {
  id: string;
  name: string;
  breed: CatBreed;
  suitColor: string;
  accentColor: string;
  role: string;
  sceneId: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  moving: boolean;
  oxygen: number;
  health: number;
}

export interface MissionDesignConfig {
  solarPanels: number;
  o2Tanks: number;
  waterTanks: number;
  foodPacks: number;
  greenhouseKit: boolean;
  scienceRig: boolean;
  radiationShielding: number;
}

export interface SpaceWeatherData {
  source: string;
  lastUpdated: string;
  solarFlares: Array<{
    id: string;
    classType: string;
    beginTime: string;
    peakTime: string;
    sourceLocation: string;
  }>;
  geomagneticStorms: Array<{
    id: string;
    startTime: string;
    kpIndex: number;
  }>;
  realScienceNote: { en: string; ru: string };
  simulationDistinction: { en: string; ru: string };
}

export type MiniGameType =
  | 'wiring'
  | 'power_divert'
  | 'clean_vent'
  | 'calibrate_rings'
  | 'refuel_tank'
  | 'swipe_card'
  | 'download_data'
  | 'keypad_code'
  | 'stabilize_steering'
  | 'chart_course'
  | 'prime_shields'
  | 'habitat_sim'
  | 'mission_planner'
  | 'base_console'
  | 'sample_lab'
  | 'deep_space_probe'
  | 'final_crisis'
  | 'nasa_terminal';

export interface ActiveMiniGame {
  type: MiniGameType;
  contextId?: string;
}

export interface SaveProgressPayload {
  version: number;
  language: Language;
  difficulty: Difficulty;
  player: PlayerCustomization;
  gameState: GameStateId;
  sceneId: SceneWorldId;
  resources: ResourcesState;
  prologue: PrologueSystems;
  completedMissions: string[];
  buildings: BuildingInstance[];
  inventory: InventoryItem[];
  journal: JournalEntry[];
  missionDesign: MissionDesignConfig;
  timeOfDay: TimeOfDay;
  xp?: number;
  level?: number;
  streakDays?: number;
  lastStreakClaim?: string;
  ownedSkins?: string[];
  ownedDecorations?: string[];
}
