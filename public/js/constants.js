// ============================================================
// 🐟 HELPING FISH - By Sabrina & Mariana
// ============================================================
// CONSTANTS & DEFINITIONS
// ============================================================

// ============================================================
// ASSET MAP - All sprite files and their facing directions
// ============================================================
const ASSET_FILES = {
  bg: 'Background Game.png',
  playerNormal: 'Peixinha Principal - Normal.png',
  playerMedikit: 'Peixinha Principal - com Medikit Background Removed.png',
  playerFood: 'Peixinha Principal - with food Background Removed.png',
  playerHeating: 'Peixing Principal - Heating Background Removed.png',
  fishNormal1: 'Fish - Normal - 1 Background Removed.png',
  fishNormal2: 'Fish - Normal - 2 Background Removed.png',
  fishNormal3: 'Fish - Normal - 3 Background Removed.png',
  fishNormal4: 'Fish - Normal 4 Background Removed.png',
  sickFish1: 'Sick Fish - 1.png',
  sickFish2: 'Sick Fish - 2.png',
  sickFish3: 'Sick Fish - 3.png',
  sickFish1Healthy: 'Sick Fish - 1 - Healthy Background Removed.png',
  sickFish2Healthy: 'Sick Fish - 2 - Healthy Background Removed.png',
  sickFish3Healthy: 'Sick Fish - 3 - Healthy Background Removed.png',
  freezingFish1: 'Freezing Fish - 1.png',
  freezingFish2: 'Freezing Fish - 2.png',
  freezingFish3: 'Freezing Fish - 3.png',
  freezingFish1Healthy: 'Freezing Fish - 1 - Healthy Background Removed.png',
  freezingFish2Healthy: 'Freezing Fish - 2 - Healthy Background Removed.png',
  freezingFish3Healthy: 'Freezing Fish - 3 - Healthy Background Removed.png',
  shark1Happy: 'Angry Shark - 1 - Healthy Background Removed.png',
  shark1Angry: 'Angry Shark - 1.png',
  shark2Happy: 'Angry Shark - 2 - Healthy Background Removed.png',
  shark2Angry: 'Angry Shark - 2.png',
  whale1Happy: 'Angry Whale - 1 - Normal Background Removed.png',
  whale1Angry: 'Angry Whale - 1.png',
  whale2Happy: 'Angry Whale - 2 - Normal Background Removed.png',
  whale2Angry: 'Angry Whale - 2.png',
  whale3Happy: 'Angry Whale - 3 - Healthy Background Removed.png',
  whale3Angry: 'Angry Whale - 3.png',
  squid1Happy: 'Angry Squid - 1 - Normal Background Removed.png',
  squid1Angry: 'Angry Squid - 1.png',
  squid2Happy: 'Angry Squid - 2 - Normal Background Removed.png',
  squid2Angry: 'Angry Squid - 2.png',
  coral1: 'Coral - 1 Background Removed.png',
  coral2: 'Coral - 2 Background Removed.png',
  coral3: 'Coral - 3 Background Removed.png',
  shell1: 'Shell -1 Background Removed.png',
  shell2: 'Shell - 2 Background Removed.png',
  shell3: 'Shell - 3 Background Removed.png',
  boat: 'Boat Background Removed.png',
  bottle: 'Bottle Background Removed.png',
  iceberg1: 'Iceberg - 1 Background Removed.png',
  iceberg2: 'Iceberg - 2 Background Removed.png',
  item1: 'Item - 1 Background Removed.png',
  starfish: 'Starfish Background Removed.png',
  treasure: 'Treasure Chest Background Removed.png',
};

// true = faces right, false = faces left, null = frontal/symmetric
const SPRITE_FACING = {
  playerNormal: true, playerMedikit: true, playerFood: true, playerHeating: true,
  fishNormal1: false, fishNormal2: false, fishNormal3: false, fishNormal4: true,
  sickFish1: true, sickFish2: true, sickFish3: false,
  sickFish1Healthy: true, sickFish2Healthy: true, sickFish3Healthy: false,
  freezingFish1: false, freezingFish2: false, freezingFish3: false,
  freezingFish1Healthy: false, freezingFish2Healthy: false, freezingFish3Healthy: false,
  shark1Happy: false, shark1Angry: false, shark2Happy: false, shark2Angry: false,
  whale1Happy: false, whale1Angry: false, whale2Happy: false, whale2Angry: false,
  whale3Happy: false, whale3Angry: false,
  squid1Happy: null, squid1Angry: null, squid2Happy: null, squid2Angry: null,
};

// ============================================================
// GAME CONSTANTS
// ============================================================
const WORLD_HEIGHT = 1100;
const FLOOR_Y = 920;
const PLAYER_MIN_Y = 60;
const PLAYER_MAX_Y = 750;
const PLAYER_SPEED = 230;
const PLAYER_SIZE = 90;
const HEAL_RANGE = 100;
const HEAL_TIME_FOOD = 1.0;
const HEAL_TIME_MEDIKIT = 1.5;
const HEAL_TIME_HEATING = 1.5;
const INVINCIBLE_TIME = 2.0;
const MAX_WILD_FISH = 12;
const MAX_BOSSES = 3;
const FISH_SPAWN_INTERVAL = 2.5;
const BOSS_SPAWN_INTERVAL = 28;
const SPAWN_DISTANCE = 800;
const DESPAWN_DISTANCE = 2000;
const BOSS_AGGRO_RANGE = 120;
const BOSS_DEAGGRO_DISTANCE = 2000;
const DECORATION_SPACING = 250;
const FOLLOWER_TRAIL_SPACING = 15;

// ============================================================
// FISH & BOSS DEFINITIONS
// ============================================================
const FISH_DEFS = {
  normal: {
    variants: [
      { sprite: 'fishNormal1', healthySprite: 'fishNormal1', size: 55 },
      { sprite: 'fishNormal2', healthySprite: 'fishNormal2', size: 50 },
      { sprite: 'fishNormal3', healthySprite: 'fishNormal3', size: 50 },
      { sprite: 'fishNormal4', healthySprite: 'fishNormal4', size: 50 },
    ],
    healTime: HEAL_TIME_FOOD,
    playerSprite: 'playerFood',
  },
  sick: {
    variants: [
      { sprite: 'sickFish1', healthySprite: 'sickFish1Healthy', size: 55 },
      { sprite: 'sickFish2', healthySprite: 'sickFish2Healthy', size: 55 },
      { sprite: 'sickFish3', healthySprite: 'sickFish3Healthy', size: 60 },
    ],
    healTime: HEAL_TIME_MEDIKIT,
    playerSprite: 'playerMedikit',
  },
  freezing: {
    variants: [
      { sprite: 'freezingFish1', healthySprite: 'freezingFish1Healthy', size: 60 },
      { sprite: 'freezingFish2', healthySprite: 'freezingFish2Healthy', size: 55 },
      { sprite: 'freezingFish3', healthySprite: 'freezingFish3Healthy', size: 55 },
    ],
    healTime: HEAL_TIME_HEATING,
    playerSprite: 'playerHeating',
  },
};

const BOSS_DEFS = [
  {
    type: 'shark', variants: [
      { happy: 'shark1Happy', angry: 'shark1Angry' },
      { happy: 'shark2Happy', angry: 'shark2Angry' },
    ], size: 160, speed: 110, baseStrength: 3,
  },
  {
    type: 'whale', variants: [
      { happy: 'whale1Happy', angry: 'whale1Angry' },
      { happy: 'whale2Happy', angry: 'whale2Angry' },
      { happy: 'whale3Happy', angry: 'whale3Angry' },
    ], size: 210, speed: 85, baseStrength: 5,
  },
  {
    type: 'squid', variants: [
      { happy: 'squid1Happy', angry: 'squid1Angry' },
      { happy: 'squid2Happy', angry: 'squid2Angry' },
    ], size: 140, speed: 125, baseStrength: 2,
  },
];

const DECO_KEYS = [
  'coral1','coral2','coral3','shell1','shell2','shell3',
  'boat','bottle','iceberg1','iceberg2','item1','starfish','treasure'
];
