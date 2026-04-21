// ============================================================
// INPUT SYSTEM - Virtual Joystick + Keyboard
// ============================================================

const input = {
  // Joystick state
  active: false,
  startX: 0, startY: 0,
  currentX: 0, currentY: 0,
  dx: 0, dy: 0,
  // Keyboard
  keys: {},
  // Combined movement vector
  moveX: 0, moveY: 0,
  
  // Joystick config
  baseRadius: 65,
  knobRadius: 28,
  fixedX: 0, fixedY: 0,
  touchId: null,
};

function initInput() {
  // Fixed joystick position (bottom-left, proportional to screen)
  input.fixedX = Math.max(90, W * 0.12);
  input.fixedY = H - Math.max(90, H * 0.15);
  
  // Scale joystick size for mobile
  if (W < 800) {
    input.baseRadius = Math.max(45, Math.min(65, W * 0.09));
    input.knobRadius = Math.max(18, Math.min(28, W * 0.04));
  }
  
  // Touch events
  canvas.addEventListener('touchstart', onTouchStart, { passive: false });
  canvas.addEventListener('touchmove', onTouchMove, { passive: false });
  canvas.addEventListener('touchend', onTouchEnd, { passive: false });
  canvas.addEventListener('touchcancel', onTouchEnd, { passive: false });
  
  // Mouse events (for desktop)
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  
  // Keyboard
  window.addEventListener('keydown', (e) => { input.keys[e.key] = true; });
  window.addEventListener('keyup', (e) => { input.keys[e.key] = false; });
}

function onTouchStart(e) {
  e.preventDefault();
  
  if (game.state === 'title') {
    requestFullscreen();
    game.startGame();
    return;
  }
  
  if (game.state === 'gameover') {
    game.startGame();
    return;
  }
  
  for (const touch of e.changedTouches) {
    const rect = canvas.getBoundingClientRect();
    const tx = (touch.clientX - rect.left) * (W / rect.width);
    const ty = (touch.clientY - rect.top) * (H / rect.height);
    // Only left 45% of screen activates joystick
    if (tx < W * 0.45 && input.touchId === null) {
      input.touchId = touch.identifier;
      input.active = true;
      input.startX = input.fixedX;
      input.startY = input.fixedY;
      input.currentX = tx;
      input.currentY = ty;
      updateJoystick();
    }
  }
}

function onTouchMove(e) {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (touch.identifier === input.touchId) {
      const rect = canvas.getBoundingClientRect();
      input.currentX = (touch.clientX - rect.left) * (W / rect.width);
      input.currentY = (touch.clientY - rect.top) * (H / rect.height);
      updateJoystick();
    }
  }
}

function onTouchEnd(e) {
  e.preventDefault();
  for (const touch of e.changedTouches) {
    if (touch.identifier === input.touchId) {
      input.touchId = null;
      input.active = false;
      input.dx = 0;
      input.dy = 0;
    }
  }
}

function onMouseDown(e) {
  if (game.state === 'title') { game.startGame(); return; }
  if (game.state === 'gameover') { game.startGame(); return; }
  
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top) * (H / rect.height);
  if (mx < W * 0.45) {
    input.active = true;
    input.startX = input.fixedX;
    input.startY = input.fixedY;
    input.currentX = mx;
    input.currentY = my;
    updateJoystick();
  }
}

function onMouseMove(e) {
  if (!input.active) return;
  const rect = canvas.getBoundingClientRect();
  input.currentX = (e.clientX - rect.left) * (W / rect.width);
  input.currentY = (e.clientY - rect.top) * (H / rect.height);
  updateJoystick();
}

function onMouseUp() {
  input.active = false;
  input.dx = 0;
  input.dy = 0;
}

function updateJoystick() {
  let dx = input.currentX - input.startX;
  let dy = input.currentY - input.startY;
  const distance = Math.hypot(dx, dy);
  const maxDist = input.baseRadius;
  
  if (distance > maxDist) {
    dx = (dx / distance) * maxDist;
    dy = (dy / distance) * maxDist;
  }
  
  input.dx = dx / maxDist; // -1 to 1
  input.dy = dy / maxDist; // -1 to 1
}

function getInput() {
  let mx = input.dx;
  let my = input.dy;
  
  // Keyboard overrides if pressed
  const k = input.keys;
  let kx = 0, ky = 0;
  if (k['ArrowLeft'] || k['a'] || k['A']) kx -= 1;
  if (k['ArrowRight'] || k['d'] || k['D']) kx += 1;
  if (k['ArrowUp'] || k['w'] || k['W']) ky -= 1;
  if (k['ArrowDown'] || k['s'] || k['S']) ky += 1;
  
  if (kx !== 0 || ky !== 0) {
    const mag = Math.hypot(kx, ky);
    mx = kx / mag;
    my = ky / mag;
  }
  
  input.moveX = mx;
  input.moveY = my;
}

function renderJoystick() {
  const bx = input.fixedX;
  const by = input.fixedY;
  const br = input.baseRadius;
  const kr = input.knobRadius;
  
  // Outer ring
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(bx, by, br, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  
  // Inner knob
  ctx.globalAlpha = 0.5;
  const knobX = bx + input.dx * br;
  const knobY = by + input.dy * br;
  ctx.beginPath();
  ctx.arc(knobX, knobY, kr, 0, Math.PI * 2);
  ctx.fillStyle = '#4FC3F7';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.restore();
}
