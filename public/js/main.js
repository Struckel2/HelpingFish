// ============================================================
// MAIN UPDATE
// ============================================================
game.update = function(dt) {
  if (this.state !== 'playing') return;
  
  this.time += dt;
  this.updatePlayer(dt);
  this.updateCamera();
  this.updateFollowers(dt);
  this.updateWildFish(dt);
  this.updateBosses(dt);
  this.updateDefeatAnimations(dt);
  this.manageSpawns(dt);
  this.updateDecorations();
  updateParticles(dt);
  updateAmbientBubbles(dt);
  
  // Occasional bubbles from player
  if (Math.random() < 0.02) {
    spawnBubbles(
      this.player.x + (this.player.facingRight ? -20 : 20),
      this.player.y - 10, 1
    );
  }
};

// ============================================================
// GAME LOOP
// ============================================================
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;
  
  // Resize canvas if needed
  if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    W = canvas.width;
    H = canvas.height;
    input.fixedX = Math.min(100, W * 0.15);
    input.fixedY = H - Math.min(120, H * 0.18);
  }
  
  ctx.clearRect(0, 0, W, H);
  
  if (game.state === 'title') {
    updateAmbientBubbles(dt);
    renderTitleScreen();
  } else if (game.state === 'playing') {
    game.update(dt);
    game.render();
  }
  
  requestAnimationFrame(gameLoop);
}

// ============================================================
// KEYBOARD TITLE SCREEN START
// ============================================================
window.addEventListener('keydown', (e) => {
  if (game.state === 'title') {
    game.startGame();
  }
});

// ============================================================
// INITIALIZATION
// ============================================================
async function init() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  W = canvas.width;
  H = canvas.height;
  
  game.state = 'loading';
  await loadAssets();
  
  initInput();
  initAmbientBubbles();
  
  game.state = 'title';
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Polyfill roundRect for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
    if (typeof r === 'number') r = { tl: r, tr: r, br: r, bl: r };
    this.moveTo(x + r.tl, y);
    this.lineTo(x + w - r.tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + r.tr);
    this.lineTo(x + w, y + h - r.br);
    this.quadraticCurveTo(x + w, y + h, x + w - r.br, y + h);
    this.lineTo(x + r.bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r.bl);
    this.lineTo(x, y + r.tl);
    this.quadraticCurveTo(x, y, x + r.tl, y);
    this.closePath();
    return this;
  };
}

// START!
init();
