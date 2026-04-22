// ============================================================
// GLOBALS
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const images = {};
let W, H;

// ============================================================
// GAME STATE
// ============================================================
const game = {
  state: 'loading', // loading, title, playing, gameover
  time: 0,
  fishSaved: 0,
  bossesDefeated: 0,
  lastFishSpawn: 0,
  lastBossSpawn: 0,
  
  player: null,
  wildFish: [],
  bosses: [],
  decorations: [],
  defeatAnimations: [],
  followers: [],
  positionHistory: [],
  
  camera: { x: 0, y: 0 },
  decoLeftBound: 0,
  decoRightBound: 0,
  
  startGame() {
    this.state = 'playing';
    this.time = 0;
    this.fishSaved = 0;
    this.bossesDefeated = 0;
    this.lastFishSpawn = -FISH_SPAWN_INTERVAL;
    this.lastBossSpawn = 0;
    this.wildFish = [];
    this.bosses = [];
    this.defeatAnimations = [];
    this.followers = [];
    this.positionHistory = [];
    this.decorations = [];
    
    this.player = {
      x: 0, y: 300,
      vx: 0, vy: 0,
      facingRight: true,
      state: 'swimming', // swimming, healing, invincible
      spriteKey: 'playerNormal',
      invTimer: 0,
      healTarget: null,
      healProgress: 0,
      healTime: 0,
      bobOffset: 0,
      lives: 3,
      maxLives: 3,
    };
    
    this.camera.x = 0;
    // Start camera aligned with player position
    const yOffset = Math.max(H * 0.3, PLAYER_SIZE + 20);
    this.camera.y = clamp(this.player.y - yOffset, 0, WORLD_HEIGHT - H);
    
    // Initial decorations
    this.decoLeftBound = -W;
    this.decoRightBound = W;
    this.fillDecorations(this.decoLeftBound, this.decoRightBound);
    
    // Spawn a few initial fish
    for (let i = 0; i < 5; i++) this.spawnFish();
  },
};
