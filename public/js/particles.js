// ============================================================
// PARTICLE SYSTEM
// ============================================================

const particles = [];

function spawnParticle(x, y, type) {
  const p = { x, y, type, life: 1, maxLife: 1 };
  switch (type) {
    case 'heart':
      p.vx = rand(-30, 30); p.vy = rand(-80, -40);
      p.maxLife = 1.2; p.life = 1.2; p.size = rand(12, 20);
      break;
    case 'star':
      p.vx = rand(-60, 60); p.vy = rand(-60, 60);
      p.maxLife = 0.8; p.life = 0.8; p.size = rand(8, 16);
      break;
    case 'bubble':
      p.vx = rand(-10, 10); p.vy = rand(-50, -20);
      p.maxLife = 2.5; p.life = 2.5; p.size = rand(4, 10);
      break;
    case 'sparkle':
      p.vx = rand(-100, 100); p.vy = rand(-100, 100);
      p.maxLife = 0.6; p.life = 0.6; p.size = rand(5, 12);
      break;
  }
  particles.push(p);
}

function spawnBubbles(x, y, count) {
  for (let i = 0; i < count; i++) spawnParticle(x + rand(-20, 20), y + rand(-10, 10), 'bubble');
}

function spawnHearts(x, y, count) {
  for (let i = 0; i < count; i++) spawnParticle(x + rand(-15, 15), y + rand(-15, 15), 'heart');
}

function spawnStars(x, y, count) {
  for (let i = 0; i < count; i++) spawnParticle(x + rand(-30, 30), y + rand(-30, 30), 'star');
}

function spawnSparkles(x, y, count) {
  for (let i = 0; i < count; i++) spawnParticle(x + rand(-40, 40), y + rand(-40, 40), 'sparkle');
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function renderParticles(camX, camY) {
  particles.forEach(p => {
    const alpha = clamp(p.life / p.maxLife, 0, 1);
    const sx = p.x - camX;
    const sy = p.y - camY;
    ctx.save();
    ctx.globalAlpha = alpha;
    
    if (p.type === 'heart') {
      ctx.font = `${p.size}px Arial`;
      ctx.fillText('❤️', sx, sy);
    } else if (p.type === 'star') {
      ctx.font = `${p.size}px Arial`;
      ctx.fillText('⭐', sx, sy);
    } else if (p.type === 'bubble') {
      ctx.beginPath();
      ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.stroke();
    } else if (p.type === 'sparkle') {
      ctx.font = `${p.size}px Arial`;
      ctx.fillText('✨', sx, sy);
    }
    ctx.restore();
  });
}

// ============================================================
// AMBIENT BUBBLES (background decoration)
// ============================================================
const ambientBubbles = [];

function initAmbientBubbles() {
  for (let i = 0; i < 25; i++) {
    ambientBubbles.push({
      x: rand(0, W), y: rand(0, H),
      size: rand(3, 8), speed: rand(15, 40),
      wobble: rand(0, Math.PI * 2), wobbleAmp: rand(10, 30),
    });
  }
}

function updateAmbientBubbles(dt) {
  ambientBubbles.forEach(b => {
    b.y -= b.speed * dt;
    b.wobble += dt * 2;
    if (b.y < -20) {
      b.y = H + 20;
      b.x = rand(0, W);
    }
  });
}

function renderAmbientBubbles() {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ambientBubbles.forEach(b => {
    const bx = b.x + Math.sin(b.wobble) * b.wobbleAmp;
    ctx.beginPath();
    ctx.arc(bx, b.y, b.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.stroke();
  });
  ctx.restore();
}
