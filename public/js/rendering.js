// ============================================================
// RENDERING
// ============================================================

game.render = function() {
  const cx = this.camera.x - W/2;
  const cy = this.camera.y;
  
  // === BACKGROUND ===
  this.renderBackground(cx, cy);
  
  // === DECORATIONS ===
  this.renderDecorations(cx, cy);
  
  // === WILD FISH ===
  this.renderWildFish(cx, cy);
  
  // === BOSSES ===
  this.renderBosses(cx, cy);
  
  // === DEFEAT ANIMATIONS ===
  this.renderDefeatAnimations(cx, cy);
  
  // === FOLLOWERS ===
  this.renderFollowers(cx, cy);
  
  // === PLAYER ===
  this.renderPlayer(cx, cy);
  
  // === PARTICLES ===
  renderParticles(cx, cy);
  
  // === AMBIENT BUBBLES (screen-space) ===
  renderAmbientBubbles();
  
  // === HUD ===
  this.renderHUD();
  
  // === JOYSTICK ===
  renderJoystick();
};

game.renderBackground = function(cx, cy) {
  const bg = images.bg;
  if (!bg || !bg.complete) {
    // Fallback gradient
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#b3e5fc');
    grd.addColorStop(0.6, '#4fc3f7');
    grd.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    return;
  }
  
  const bgW = bg.width;
  const bgH = bg.height;
  // Scale bg to fill height
  const scale = H / bgH * 1.1;
  const scaledW = bgW * scale;
  
  // Tile horizontally
  const offsetX = -(cx * 0.8) % scaledW;
  const startX = offsetX - scaledW;
  
  for (let x = startX; x < W + scaledW; x += scaledW) {
    ctx.drawImage(bg, x, -cy * 0.3, scaledW, H + 100);
  }
  
  // Draw ocean floor sand
  const floorScreenY = FLOOR_Y - cy;
  if (floorScreenY < H) {
    const grd = ctx.createLinearGradient(0, floorScreenY - 30, 0, H);
    grd.addColorStop(0, 'rgba(210, 230, 245, 0.3)');
    grd.addColorStop(0.3, 'rgba(194, 215, 234, 0.6)');
    grd.addColorStop(1, 'rgba(176, 200, 224, 0.8)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, floorScreenY - 30, W, H - floorScreenY + 30);
  }
};

game.renderDecorations = function(cx, cy) {
  this.decorations.forEach(d => {
    const sx = d.x - cx;
    const sy = d.y - cy;
    if (sx > -d.width && sx < W + d.width && sy > -d.height && sy < H + d.height) {
      const img = images[d.key];
      if (img && img.complete) {
        ctx.drawImage(img, sx - d.width/2, sy - d.height/2, d.width, d.height);
      }
    }
  });
};

game.renderWildFish = function(cx, cy) {
  this.wildFish.forEach(fish => {
    const sx = fish.x - cx;
    const sy = fish.y - cy;
    if (sx < -100 || sx > W + 100 || sy < -100 || sy > H + 100) return;
    
    const s = fish.size;
    let drawX = sx - s/2;
    let drawY = sy - s/2 + Math.sin(fish.bobOffset) * 5;
    
    // Shake for sick/freezing
    if (fish.state === 'wandering') {
      if (fish.type === 'sick') drawX += Math.sin(fish.shakeTimer) * 2;
      if (fish.type === 'freezing') drawX += Math.sin(fish.shakeTimer) * 3;
    }
    
    // Draw the fish sprite
    drawSprite(fish.sprite, drawX, drawY, s, s, fish.facingRight);
    
    // Healing progress circle
    if (fish.state === 'being_healed') {
      const def = FISH_DEFS[fish.type];
      const progress = fish.healProgress / def.healTime;
      const radius = s * 0.45;
      
      ctx.save();
      ctx.beginPath();
      ctx.arc(sx, sy, radius, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * progress);
      ctx.lineWidth = 4;
      ctx.strokeStyle = fish.type === 'sick' ? '#ff5252' :
                        fish.type === 'freezing' ? '#42A5F5' : '#66BB6A';
      ctx.lineCap = 'round';
      ctx.stroke();
      
      // Background circle
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI * 2);
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.stroke();
      ctx.restore();
      
      // Small icon
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        fish.type === 'sick' ? '💊' : fish.type === 'freezing' ? '🔥' : '🍎',
        sx, sy - s * 0.45
      );
    }
    
    // Freezing effect: ice particles
    if (fish.type === 'freezing' && fish.state === 'wandering') {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(fish.bobOffset * 2) * 0.2;
      ctx.font = '10px Arial';
      ctx.fillText('❄️', sx - 15 + Math.sin(fish.bobOffset) * 8, sy - s * 0.3);
      ctx.fillText('❄️', sx + 10 + Math.cos(fish.bobOffset * 1.3) * 6, sy - s * 0.2);
      ctx.restore();
    }
  });
};

game.renderBosses = function(cx, cy) {
  this.bosses.forEach(boss => {
    const sx = boss.x - cx;
    const sy = boss.y - cy;
    if (sx < -boss.size && sx > W + boss.size) return;
    
    const s = boss.size;
    const bob = Math.sin(boss.bobOffset) * 8;
    const sprite = boss.state === 'angry' ? boss.angrySprite : boss.happySprite;
    
    drawSprite(sprite, sx - s/2, sy - s/2 + bob, s, s, boss.facingRight);
    
    // Angry indicator
    if (boss.state === 'angry') {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(boss.bobOffset * 2) * 0.3;
      ctx.font = '22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('😡', sx, sy - s * 0.45 + bob);
      ctx.restore();
    }
    
    // Strength label
    if (boss.state === 'angry') {
      ctx.save();
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 3;
      const label = `💪 ${boss.strength}`;
      ctx.strokeText(label, sx, sy + s * 0.45 + bob);
      ctx.fillText(label, sx, sy + s * 0.45 + bob);
      ctx.restore();
    }
  });
};

game.renderDefeatAnimations = function(cx, cy) {
  this.defeatAnimations.forEach(anim => {
    const boss = anim.boss;
    const sx = boss.x - cx;
    const sy = boss.y - cy;
    const s = boss.size;
    
    // Boss (possibly flipped)
    const flipAngle = (boss.flipProgress || 0) * Math.PI;
    drawSprite(boss.angrySprite, sx - s/2, sy - s/2, s, s, boss.facingRight || false, flipAngle);
    
    // Attacker fish
    const fishSize = 30;
    anim.attackers.forEach(att => {
      const ax = att.x - cx;
      const ay = att.y - cy;
      drawSprite(att.sprite, ax - fishSize/2, ay - fishSize/2, fishSize, fishSize, att.x < boss.x);
    });
  });
};

game.renderFollowers = function(cx, cy) {
  const sizeBase = Math.max(20, 42 - this.followers.length * 1.2);
  
  this.followers.forEach((f, i) => {
    const sx = f.x - cx;
    const sy = f.y - cy + Math.sin(f.bobOffset + i * 0.5) * 4;
    const s = f.size || sizeBase;
    
    if (sx > -s && sx < W + s && sy > -s && sy < H + s) {
      drawSprite(f.sprite, sx - s/2, sy - s/2, s, s, f.facingRight);
    }
  });
};

game.renderPlayer = function(cx, cy) {
  const p = this.player;
  const sx = p.x - cx;
  const sy = p.y - cy + Math.sin(p.bobOffset) * 6;
  const s = PLAYER_SIZE;
  
  // Invincibility flashing
  if (p.state === 'invincible' && Math.floor(p.invTimer * 10) % 2 === 0) {
    ctx.save();
    ctx.globalAlpha = 0.4;
  }
  
  drawSprite(p.spriteKey, sx - s/2, sy - s/2, s, s, p.facingRight);
  
  if (p.state === 'invincible') {
    ctx.restore();
  }
  
  // Strength indicator above player
  if (this.followers.length > 0) {
    ctx.save();
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 3;
    const str = `🐟 ${this.followers.length}`;
    ctx.strokeText(str, sx, sy - s * 0.5);
    ctx.fillText(str, sx, sy - s * 0.5);
    ctx.restore();
  }
};

// ============================================================
// HUD
// ============================================================
game.renderHUD = function() {
  const pad = 15;
  const y = pad;
  
  ctx.save();
  
  // Semi-transparent background bar
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(pad, y, 280, 90, 15);
  ctx.fill();
  
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  
  // Fish saved
  ctx.fillText(`🐟 Peixinhos Salvos: ${this.fishSaved}`, pad + 12, y + 25);
  
  // Bosses defeated
  ctx.fillText(`🏆 Chefões Derrotados: ${this.bossesDefeated}`, pad + 12, y + 52);
  
  // Timer
  const mins = Math.floor(this.time / 60);
  const secs = Math.floor(this.time % 60);
  ctx.fillText(`⏱️ ${mins}:${secs.toString().padStart(2, '0')}`, pad + 12, y + 79);
  
  // Strength bar (top right)
  const strength = this.getPlayerStrength();
  const barW = 180;
  const barH = 28;
  const barX = W - barW - pad - 10;
  const barY = pad + 5;
  
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(barX - 10, barY - 8, barW + 20, barH + 36, 15);
  ctx.fill();
  
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(`💪 Força: ${strength}`, barX + barW/2, barY + 12);
  
  // Bar background
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(barX, barY + 20, barW, barH, 8);
  ctx.fill();
  
  // Bar fill
  const maxDisplay = Math.max(strength, 10);
  const fill = Math.min(strength / maxDisplay, 1);
  const barColor = strength >= 5 ? '#66BB6A' : strength >= 3 ? '#FFA726' : '#EF5350';
  ctx.fillStyle = barColor;
  ctx.beginPath();
  ctx.roundRect(barX, barY + 20, barW * fill, barH, 8);
  ctx.fill();
  
  // Warning if boss is angry nearby
  const angryBoss = this.bosses.find(b => b.state === 'angry');
  if (angryBoss) {
    const bDist = dist(angryBoss, this.player);
    if (bDist < 600) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 6) * 0.3;
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff1744';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      const warnText = `⚠️ ${angryBoss.type === 'shark' ? '🦈' : angryBoss.type === 'whale' ? '🐋' : '🦑'} Chefão! Precisa de ${angryBoss.strength} peixes!`;
      ctx.strokeText(warnText, W/2, H - 40);
      ctx.fillText(warnText, W/2, H - 40);
      ctx.restore();
    }
  }
  
  ctx.restore();
};

// ============================================================
// TITLE SCREEN
// ============================================================
function renderTitleScreen() {
  // Ocean gradient background
  const grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#b3e5fc');
  grd.addColorStop(0.5, '#4fc3f7');
  grd.addColorStop(1, '#0288d1');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  
  renderAmbientBubbles();
  
  // Main character
  const playerImg = images.playerNormal;
  if (playerImg && playerImg.complete) {
    const pSize = Math.min(W * 0.35, 250);
    const bob = Math.sin(Date.now() * 0.003) * 15;
    ctx.drawImage(playerImg, W/2 - pSize/2, H * 0.28 + bob - pSize/2, pSize, pSize);
  }
  
  // Title
  ctx.save();
  ctx.textAlign = 'center';
  
  // Title shadow
  ctx.font = `bold ${Math.min(W * 0.1, 64)}px Arial`;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillText('Helping Fish! 🐟', W/2 + 3, H * 0.12 + 3);
  
  // Title
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#0277BD';
  ctx.lineWidth = 4;
  ctx.strokeText('Helping Fish! 🐟', W/2, H * 0.12);
  ctx.fillText('Helping Fish! 🐟', W/2, H * 0.12);
  
  // Authors
  ctx.font = `bold ${Math.min(W * 0.04, 24)}px Arial`;
  ctx.fillStyle = '#E1F5FE';
  ctx.fillText('Criado por Sabrina & Mariana 💕', W/2, H * 0.19);
  
  // Instructions
  const instrY = H * 0.58;
  ctx.font = `${Math.min(W * 0.035, 20)}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.fillText('🕹️  Use o joystick para nadar', W/2, instrY);
  ctx.fillText('💊  Chegue perto dos peixinhos para ajudar', W/2, instrY + 30);
  ctx.fillText('⚠️  Cuidado com os chefões!', W/2, instrY + 60);
  ctx.fillText('💪  Junte peixes para ficar mais forte', W/2, instrY + 90);
  
  // Start button
  const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
  ctx.font = `bold ${Math.min(W * 0.06, 36) * pulse}px Arial`;
  ctx.fillStyle = '#FFEB3B';
  ctx.strokeStyle = '#F57F17';
  ctx.lineWidth = 3;
  const startText = '🎮 Toque para Jogar! 🎮';
  ctx.strokeText(startText, W/2, H * 0.82);
  ctx.fillText(startText, W/2, H * 0.82);
  
  ctx.restore();
}
