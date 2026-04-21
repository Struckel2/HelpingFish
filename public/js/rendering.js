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
  
  // === BOSS DIRECTION INDICATORS ===
  this.renderBossIndicators(cx, cy);
  
  // === HUD ===
  this.renderHUD();
  
  // === JOYSTICK ===
  if (this.state === 'playing') renderJoystick();
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
    const fontSize = Math.max(12, Math.min(16, W * 0.025));
    ctx.font = `bold ${fontSize}px Arial`;
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
// BOSS DIRECTION INDICATORS (arrows pointing to off-screen bosses)
// ============================================================
game.renderBossIndicators = function(cx, cy) {
  const margin = 50;
  const indicatorSize = 30;
  
  this.bosses.forEach(boss => {
    const sx = boss.x - cx;
    const sy = boss.y - cy;
    
    // Only show indicator if boss is off-screen
    if (sx >= -boss.size && sx <= W + boss.size && sy >= -boss.size && sy <= H + boss.size) return;
    
    // Calculate clamped position on screen edge
    const clampedX = clamp(sx, margin, W - margin);
    const clampedY = clamp(sy, margin, H - margin);
    
    // Calculate angle to boss
    const playerScreenX = this.player.x - cx;
    const playerScreenY = this.player.y - cy;
    const angle = Math.atan2(sy - playerScreenY, sx - playerScreenX);
    
    // Distance for alpha
    const bDist = dist(boss, this.player);
    const alpha = clamp(1 - bDist / DESPAWN_DISTANCE, 0.3, 0.9);
    
    ctx.save();
    ctx.translate(clampedX, clampedY);
    ctx.rotate(angle);
    
    // Pulsing effect
    const pulse = 1 + Math.sin(Date.now() * 0.006) * 0.15;
    ctx.scale(pulse, pulse);
    
    // Arrow color based on state
    const isAngry = boss.state === 'angry';
    ctx.globalAlpha = alpha;
    
    // Draw arrow
    ctx.beginPath();
    ctx.moveTo(indicatorSize, 0);
    ctx.lineTo(-indicatorSize * 0.5, -indicatorSize * 0.5);
    ctx.lineTo(-indicatorSize * 0.2, 0);
    ctx.lineTo(-indicatorSize * 0.5, indicatorSize * 0.5);
    ctx.closePath();
    
    ctx.fillStyle = isAngry ? '#ff1744' : '#FF9800';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
    
    // Boss emoji near arrow
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${Math.max(16, indicatorSize * 0.7)}px Arial`;
    ctx.textAlign = 'center';
    const emoji = boss.type === 'shark' ? '🦈' : boss.type === 'whale' ? '🐋' : '🦑';
    const labelX = clampedX - Math.cos(angle) * 25;
    const labelY = clampedY - Math.sin(angle) * 25 + 6;
    ctx.fillText(emoji, labelX, labelY);
    
    // Show strength if angry
    if (isAngry) {
      ctx.font = `bold ${Math.max(10, indicatorSize * 0.4)}px Arial`;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#d32f2f';
      ctx.lineWidth = 2;
      ctx.strokeText(`💪${boss.strength}`, labelX, labelY + 18);
      ctx.fillText(`💪${boss.strength}`, labelX, labelY + 18);
    }
    ctx.restore();
  });
};

// ============================================================
// HUD - Responsive
// ============================================================
game.renderHUD = function() {
  if (this.state === 'gameover') return; // Game over screen handles its own UI
  
  const p = this.player;
  const isMobile = W < 800;
  const scale = isMobile ? Math.max(0.65, W / 800) : 1;
  const pad = Math.max(8, 12 * scale);
  const fontSize = Math.max(12, Math.floor(18 * scale));
  const smallFont = Math.max(10, Math.floor(14 * scale));
  
  ctx.save();
  
  // ── TOP LEFT: Stats box ──
  const boxW = Math.max(180, 260 * scale);
  const boxH = Math.max(55, 80 * scale);
  
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.roundRect(pad, pad, boxW, boxH, 12 * scale);
  ctx.fill();
  
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#fff';
  
  const lineH = fontSize + 4;
  const textX = pad + 10 * scale;
  const textY = pad + lineH;
  
  ctx.fillText(`🐟 Salvos: ${this.fishSaved}`, textX, textY);
  ctx.fillText(`🏆 Chefões: ${this.bossesDefeated}`, textX, textY + lineH);
  
  // Timer
  const mins = Math.floor(this.time / 60);
  const secs = Math.floor(this.time % 60);
  if (!isMobile) {
    ctx.fillText(`⏱️ ${mins}:${secs.toString().padStart(2, '0')}`, textX, textY + lineH * 2);
  }
  
  // ── TOP CENTER: Lives (hearts) ──
  const heartSize = Math.max(18, 26 * scale);
  const heartsW = p.maxLives * (heartSize + 6);
  const heartsX = W / 2 - heartsW / 2;
  const heartsY = pad + 4;
  
  // Heart background
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(heartsX - 10, heartsY - 4, heartsW + 20, heartSize + 12, 10 * scale);
  ctx.fill();
  
  ctx.font = `${heartSize}px Arial`;
  ctx.textAlign = 'center';
  for (let i = 0; i < p.maxLives; i++) {
    const hx = heartsX + i * (heartSize + 6) + heartSize / 2 + 2;
    const hy = heartsY + heartSize;
    ctx.fillText(i < p.lives ? '❤️' : '🖤', hx, hy);
  }
  
  // ── TOP RIGHT: Strength ──
  const strength = this.getPlayerStrength();
  const barW = Math.max(100, 160 * scale);
  const barH = Math.max(16, 22 * scale);
  const barX = W - barW - pad - 8;
  const barY = pad + 4;
  const barBoxH = barH + Math.max(24, 32 * scale);
  
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.roundRect(barX - 8, barY - 4, barW + 16, barBoxH + 8, 10 * scale);
  ctx.fill();
  
  ctx.font = `bold ${smallFont}px Arial`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  ctx.fillText(`💪 Força: ${strength}`, barX + barW/2, barY + smallFont + 2);
  
  // Bar background
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.roundRect(barX, barY + smallFont + 8, barW, barH, 6);
  ctx.fill();
  
  // Bar fill
  const maxDisplay = Math.max(strength, 8);
  const fill = Math.min(strength / maxDisplay, 1);
  const barColor = strength >= 5 ? '#66BB6A' : strength >= 3 ? '#FFA726' : '#EF5350';
  if (fill > 0) {
    ctx.fillStyle = barColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY + smallFont + 8, barW * fill, barH, 6);
    ctx.fill();
  }
  
  // Timer on mobile (compact, bottom of stats box)
  if (isMobile) {
    ctx.font = `${smallFont}px Arial`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`⏱️ ${mins}:${secs.toString().padStart(2, '0')}`, textX, textY + lineH + smallFont + 6);
  }
  
  // ── BOTTOM CENTER: Boss warning ──
  const angryBoss = this.bosses.find(b => b.state === 'angry');
  if (angryBoss) {
    const bDist = dist(angryBoss, this.player);
    if (bDist < 700) {
      ctx.save();
      ctx.globalAlpha = 0.6 + Math.sin(this.time * 6) * 0.3;
      const warnFont = Math.max(14, Math.floor(20 * scale));
      ctx.font = `bold ${warnFont}px Arial`;
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff1744';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      const emoji = angryBoss.type === 'shark' ? '🦈' : angryBoss.type === 'whale' ? '🐋' : '🦑';
      const warnText = `⚠️ ${emoji} Precisa de ${angryBoss.strength} peixes!`;
      const warnY = H - Math.max(30, 45 * scale);
      ctx.strokeText(warnText, W/2, warnY);
      ctx.fillText(warnText, W/2, warnY);
      ctx.restore();
    }
  }
  
  ctx.restore();
};

// ============================================================
// GAME OVER SCREEN
// ============================================================
function renderGameOverScreen() {
  // Dark overlay
  ctx.save();
  ctx.fillStyle = 'rgba(0, 20, 60, 0.7)';
  ctx.fillRect(0, 0, W, H);
  
  const centerX = W / 2;
  const isMobile = W < 800;
  const scale = isMobile ? Math.max(0.6, W / 800) : 1;
  
  // Panel
  const panelW = Math.min(W * 0.85, 450 * scale);
  const panelH = Math.min(H * 0.8, 380 * scale);
  const panelX = centerX - panelW / 2;
  const panelY = H / 2 - panelH / 2;
  
  // Panel background
  ctx.fillStyle = 'rgba(13, 71, 161, 0.9)';
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 24 * scale);
  ctx.fill();
  
  // Panel border
  ctx.strokeStyle = '#4FC3F7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 24 * scale);
  ctx.stroke();
  
  ctx.textAlign = 'center';
  
  // Sad fish
  const fishBob = Math.sin(Date.now() * 0.003) * 8;
  const fishSize = Math.min(80, panelW * 0.2);
  const playerImg = images.playerNormal;
  if (playerImg && playerImg.complete) {
    ctx.globalAlpha = 0.8;
    ctx.drawImage(playerImg, centerX - fishSize/2, panelY + 15 * scale + fishBob, fishSize, fishSize);
    ctx.globalAlpha = 1;
  }
  
  // Title
  const titleSize = Math.max(20, Math.floor(38 * scale));
  ctx.font = `bold ${titleSize}px Arial`;
  ctx.fillStyle = '#FFEB3B';
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 3;
  ctx.strokeText('Fim do Jogo! 😢', centerX, panelY + fishSize + 35 * scale);
  ctx.fillText('Fim do Jogo! 😢', centerX, panelY + fishSize + 35 * scale);
  
  // Stats
  const statSize = Math.max(14, Math.floor(20 * scale));
  const statLineH = statSize + 10;
  let statY = panelY + fishSize + 60 * scale;
  
  ctx.font = `${statSize}px Arial`;
  ctx.fillStyle = '#E1F5FE';
  ctx.lineWidth = 0;
  
  const mins = Math.floor(game.gameOverTime / 60);
  const secs = Math.floor(game.gameOverTime % 60);
  
  ctx.fillText(`🐟 Peixinhos Salvos: ${game.fishSaved}`, centerX, statY += statLineH);
  ctx.fillText(`🏆 Chefões Derrotados: ${game.bossesDefeated}`, centerX, statY += statLineH);
  ctx.fillText(`⏱️ Tempo: ${mins}:${secs.toString().padStart(2, '0')}`, centerX, statY += statLineH);
  
  // Motivational message
  statY += statLineH * 0.8;
  const msgSize = Math.max(12, Math.floor(16 * scale));
  ctx.font = `bold ${msgSize}px Arial`;
  ctx.fillStyle = '#81D4FA';
  
  let message;
  if (game.fishSaved >= 15) {
    message = '🌟 Incrível! Você é uma heroína do mar! 🌟';
  } else if (game.fishSaved >= 8) {
    message = '💪 Muito bem! Os peixinhos agradecem! 💪';
  } else if (game.fishSaved >= 3) {
    message = '🌊 Bom trabalho! Tente salvar mais! 🌊';
  } else {
    message = '💕 Não desista! Os peixinhos precisam de você! 💕';
  }
  ctx.fillText(message, centerX, statY);
  
  // Restart button
  statY += statLineH * 1.5;
  const btnW = Math.min(panelW * 0.7, 280 * scale);
  const btnH = Math.max(36, 48 * scale);
  const btnX = centerX - btnW / 2;
  const btnY = statY - btnH / 2;
  
  // Button pulse
  const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.04;
  
  ctx.save();
  ctx.translate(centerX, statY);
  ctx.scale(pulse, pulse);
  ctx.translate(-centerX, -statY);
  
  // Button bg
  ctx.fillStyle = '#43A047';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12 * scale);
  ctx.fill();
  
  ctx.strokeStyle = '#81C784';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12 * scale);
  ctx.stroke();
  
  const btnFontSize = Math.max(14, Math.floor(22 * scale));
  ctx.font = `bold ${btnFontSize}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.fillText('🎮 Jogar de Novo! 🎮', centerX, statY + btnFontSize * 0.35);
  
  ctx.restore();
  ctx.restore();
}

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
  
  const isMobile = W < 800;
  const scale = isMobile ? Math.max(0.6, W / 800) : 1;
  
  // Main character
  const playerImg = images.playerNormal;
  if (playerImg && playerImg.complete) {
    const pSize = Math.min(W * 0.3, 220 * scale);
    const bob = Math.sin(Date.now() * 0.003) * 15;
    ctx.drawImage(playerImg, W/2 - pSize/2, H * 0.28 + bob - pSize/2, pSize, pSize);
  }
  
  // Title
  ctx.save();
  ctx.textAlign = 'center';
  
  const titleSize = Math.max(28, Math.min(W * 0.09, 60 * scale));
  
  // Title shadow
  ctx.font = `bold ${titleSize}px Arial`;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillText('Helping Fish! 🐟', W/2 + 3, H * 0.12 + 3);
  
  // Title
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#0277BD';
  ctx.lineWidth = 4;
  ctx.strokeText('Helping Fish! 🐟', W/2, H * 0.12);
  ctx.fillText('Helping Fish! 🐟', W/2, H * 0.12);
  
  // Authors
  const authSize = Math.max(14, Math.min(W * 0.035, 22 * scale));
  ctx.font = `bold ${authSize}px Arial`;
  ctx.fillStyle = '#E1F5FE';
  ctx.fillText('Criado por Sabrina & Mariana 💕', W/2, H * 0.19);
  
  // Instructions
  const instrSize = Math.max(12, Math.min(W * 0.03, 18 * scale));
  const instrY = H * 0.56;
  const instrLineH = instrSize + 10;
  ctx.font = `${instrSize}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.fillText('🕹️  Use o joystick para nadar', W/2, instrY);
  ctx.fillText('💊  Chegue perto dos peixinhos para ajudar', W/2, instrY + instrLineH);
  ctx.fillText('⚠️  Cuidado com os chefões!', W/2, instrY + instrLineH * 2);
  ctx.fillText('💪  Junte peixes para ficar mais forte', W/2, instrY + instrLineH * 3);
  ctx.fillText('❤️  Você tem 3 vidas — cuidado!', W/2, instrY + instrLineH * 4);
  
  // Start button
  const btnPulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
  const btnSize = Math.max(18, Math.min(W * 0.055, 34 * scale));
  ctx.font = `bold ${btnSize * btnPulse}px Arial`;
  ctx.fillStyle = '#FFEB3B';
  ctx.strokeStyle = '#F57F17';
  ctx.lineWidth = 3;
  const startText = '🎮 Toque para Jogar! 🎮';
  ctx.strokeText(startText, W/2, H * 0.82);
  ctx.fillText(startText, W/2, H * 0.82);
  
  // iOS PWA install tutorial (only if on iOS and not installed as PWA)
  if (typeof shouldShowIOSHint === 'function' && shouldShowIOSHint()) {
    renderIOSInstallHint(scale);
  }
  
  ctx.restore();
}

// ============================================================
// iOS PWA INSTALL TUTORIAL
// ============================================================
function renderIOSInstallHint(scale) {
  const boxW = Math.min(W * 0.9, 420 * scale);
  const boxH = Math.max(70, 90 * scale);
  const boxX = W / 2 - boxW / 2;
  const boxY = H * 0.88 - boxH / 2;
  
  // Animated glow border
  const glowAlpha = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
  
  // Background box
  ctx.save();
  ctx.fillStyle = 'rgba(0, 40, 100, 0.85)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 14 * scale);
  ctx.fill();
  
  // Glow border
  ctx.strokeStyle = `rgba(79, 195, 247, ${glowAlpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 14 * scale);
  ctx.stroke();
  
  ctx.textAlign = 'center';
  
  // Title
  const titleSize = Math.max(11, Math.floor(14 * scale));
  ctx.font = `bold ${titleSize}px Arial`;
  ctx.fillStyle = '#FFEB3B';
  ctx.fillText('📱 Para tela cheia no iPhone:', W / 2, boxY + titleSize + 8);
  
  // Steps - laid out horizontally
  const stepSize = Math.max(10, Math.floor(12 * scale));
  const stepY = boxY + titleSize + 8 + stepSize + 12;
  const stepSpacing = boxW / 3;
  const startX = boxX + stepSpacing / 2;
  
  ctx.font = `${stepSize}px Arial`;
  ctx.fillStyle = '#E1F5FE';
  
  // Step 1
  const emojiSize = Math.max(16, Math.floor(22 * scale));
  ctx.font = `${emojiSize}px Arial`;
  ctx.fillText('⬆️', startX, stepY - 2);
  ctx.font = `${stepSize}px Arial`;
  ctx.fillText('Compartilhar', startX, stepY + stepSize + 6);
  
  // Arrow 1→2
  ctx.fillStyle = '#4FC3F7';
  ctx.font = `${Math.max(14, 18 * scale)}px Arial`;
  ctx.fillText('→', startX + stepSpacing * 0.5, stepY);
  
  // Step 2
  ctx.fillStyle = '#E1F5FE';
  ctx.font = `${emojiSize}px Arial`;
  ctx.fillText('➕', startX + stepSpacing, stepY - 2);
  ctx.font = `${stepSize}px Arial`;
  ctx.fillText('Tela Inicial', startX + stepSpacing, stepY + stepSize + 6);
  
  // Arrow 2→3
  ctx.fillStyle = '#4FC3F7';
  ctx.font = `${Math.max(14, 18 * scale)}px Arial`;
  ctx.fillText('→', startX + stepSpacing * 1.5, stepY);
  
  // Step 3
  ctx.fillStyle = '#E1F5FE';
  ctx.font = `${emojiSize}px Arial`;
  ctx.fillText('🐟', startX + stepSpacing * 2, stepY - 2);
  ctx.font = `${stepSize}px Arial`;
  ctx.fillStyle = '#81C784';
  ctx.fillText('Tela cheia!', startX + stepSpacing * 2, stepY + stepSize + 6);
  
  ctx.restore();
}

// ============================================================
// LANDSCAPE REMINDER (shown in portrait mode)
// ============================================================
function renderLandscapeReminder() {
  if (W >= H) return; // Already landscape
  
  ctx.save();
  ctx.fillStyle = 'rgba(0, 30, 80, 0.95)';
  ctx.fillRect(0, 0, W, H);
  
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff';
  
  ctx.font = `bold ${Math.max(20, W * 0.06)}px Arial`;
  ctx.fillText('📱 Vire o celular! 📱', W/2, H * 0.4);
  
  ctx.font = `${Math.max(14, W * 0.04)}px Arial`;
  ctx.fillStyle = '#81D4FA';
  ctx.fillText('Para uma experiência melhor,', W/2, H * 0.5);
  ctx.fillText('jogue com o celular deitado! 🐟', W/2, H * 0.56);
  
  // Rotating phone emoji
  const angle = Math.sin(Date.now() * 0.003) * 0.3;
  ctx.save();
  ctx.translate(W/2, H * 0.7);
  ctx.rotate(angle);
  ctx.font = `${Math.max(40, W * 0.1)}px Arial`;
  ctx.fillText('📱', 0, 0);
  ctx.restore();
  
  ctx.restore();
}
