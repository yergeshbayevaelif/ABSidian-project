export interface SkinCatalogItem {
  id: string;
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  suitColor: string;
  accentColor: string;
  price: number;
  previewBadge: string;
}

export interface DecorationCatalogItem {
  id: 'crown' | 'wings' | 'halo' | 'neon_ears' | 'drone_bot';
  nameRu: string;
  nameEn: string;
  descRu: string;
  descEn: string;
  price: number;
  emoji: string;
}

export interface StreakRewardDay {
  day: number;
  coins: number;
  science: number;
  titleRu: string;
  titleEn: string;
  bonusDecoration?: string;
  bonusSkin?: string;
  isMega?: boolean;
}

export const SKIN_CATALOG: SkinCatalogItem[] = [
  {
    id: 'artemis_classic',
    nameRu: 'Классик Артемида',
    nameEn: 'Artemis Classic',
    descRu: 'Стандартный белый скафандр программы ABSIDIAN',
    descEn: 'Standard white ABSIDIAN astronaut flight suit',
    suitColor: '#f1f5f9',
    accentColor: '#06b6d4',
    price: 0,
    previewBadge: '🚀',
  },
  {
    id: 'neon_cyber',
    nameRu: 'Неон Кибер-Кот',
    nameEn: 'Neon Cyber-Cat',
    descRu: 'Тёмно-синий костюм с яркой неоновой подсветкой',
    descEn: 'Deep midnight armor with electric cyan neon trim',
    suitColor: '#0f172a',
    accentColor: '#22d3ee',
    price: 100,
    previewBadge: '⚡',
  },
  {
    id: 'emerald_ranger',
    nameRu: 'Изумрудный Рейнджер',
    nameEn: 'Emerald Bio-Ranger',
    descRu: 'Костюм исследователя оранжерей и экзопланет',
    descEn: 'Vibrant emerald biosphere expedition armor',
    suitColor: '#065f46',
    accentColor: '#34d399',
    price: 150,
    previewBadge: '🌿',
  },
  {
    id: 'apollo_gold',
    nameRu: 'Золотой Командир',
    nameEn: 'Golden Commander',
    descRu: 'Парадный золотой скафандр капитана миссии',
    descEn: 'Metallic gold commander edition spacesuit',
    suitColor: '#fef3c7',
    accentColor: '#f59e0b',
    price: 220,
    previewBadge: '🏆',
  },
  {
    id: 'nebula_galaxy',
    nameRu: 'Туманность Галактики',
    nameEn: 'Nebula Galaxy',
    descRu: 'Фиолетовая броня для полётов к далёким звёздам',
    descEn: 'Deep violet deep-space cruiser suit',
    suitColor: '#3b0764',
    accentColor: '#e879f9',
    price: 280,
    previewBadge: '🌌',
  },
];

export const DECORATION_CATALOG: DecorationCatalogItem[] = [
  {
    id: 'neon_ears',
    nameRu: 'Неоновые ушки',
    nameEn: 'Neon Cat Ears',
    descRu: 'Светящиеся неоновые вставки на ушах котика',
    descEn: 'Glowing neon ear beacons on your cat hero',
    price: 90,
    emoji: '✨',
  },
  {
    id: 'crown',
    nameRu: 'Корона Звёзд',
    nameEn: 'Star Crown',
    descRu: 'Золотая корона командира поверх шлема',
    descEn: 'Golden 3D commander crown atop your suit',
    price: 140,
    emoji: '👑',
  },
  {
    id: 'wings',
    nameRu: 'Реактивные крылья',
    nameEn: 'Jetpack Wings',
    descRu: 'Аэродинамические крылья на ранце скафандра',
    descEn: 'Sleek angled thruster wings on your backpack',
    price: 170,
    emoji: '🪽',
  },
  {
    id: 'drone_bot',
    nameRu: 'Плечевой мини-дрон',
    nameEn: 'Shoulder Mini-Drone',
    descRu: 'Парящий голографический дрон-помощник над плечом',
    descEn: 'Hovering mini telemetry drone over your shoulder',
    price: 200,
    emoji: '🛸',
  },
  {
    id: 'halo',
    nameRu: 'Космический нимб',
    nameEn: 'Cosmic Halo Ring',
    descRu: 'Парящее голубое кольцо энергии над головой',
    descEn: 'Floating glowing holographic orbit ring',
    price: 240,
    emoji: '💫',
  },
];

export const STREAK_REWARDS: StreakRewardDay[] = [
  { day: 1, coins: 60, science: 10, titleRu: 'День 1 · Старт', titleEn: 'Day 1 · Starter' },
  { day: 2, coins: 90, science: 15, titleRu: 'День 2 · Припасы', titleEn: 'Day 2 · Rations' },
  {
    day: 3,
    coins: 120,
    science: 20,
    titleRu: 'День 3 · Неоновые ушки!',
    titleEn: 'Day 3 · Neon Ears!',
    bonusDecoration: 'neon_ears',
  },
  { day: 4, coins: 150, science: 25, titleRu: 'День 4 · Энергия', titleEn: 'Day 4 · Power' },
  {
    day: 5,
    coins: 180,
    science: 30,
    titleRu: 'День 5 · Скин Кибер-Кот!',
    titleEn: 'Day 5 · Cyber-Cat Suit!',
    bonusSkin: 'neon_cyber',
  },
  { day: 6, coins: 220, science: 40, titleRu: 'День 6 · Элита', titleEn: 'Day 6 · Elite' },
  {
    day: 7,
    coins: 450,
    science: 80,
    titleRu: 'День 7 · МЕГАЯЩИК!',
    titleEn: 'Day 7 · MEGA BOX!',
    bonusDecoration: 'crown',
    isMega: true,
  },
];
