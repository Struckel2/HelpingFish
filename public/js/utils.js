// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return Math.random() * (max - min) + min; }
function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function drawSprite(spriteKey, x, y, w, h, wantFaceRight, angle) {
  const img = images[spriteKey];
  if (!img || !img.complete) return;
  const facing = SPRITE_FACING[spriteKey];
  const needsFlip = facing !== null && facing !== undefined && wantFaceRight !== undefined && facing !== wantFaceRight;
  
  ctx.save();
  ctx.translate(x + w/2, y + h/2);
  if (angle) ctx.rotate(angle);
  if (needsFlip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w/2, -h/2, w, h);
  ctx.restore();
}
