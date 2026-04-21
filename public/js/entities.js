// ============================================================
// DIFFICULTY
// ============================================================
function getDifficulty() {
  const t = game.time;
  return {
    bossStrengthBonus: Math.floor(t / 45) + 1,
    bossSpeedMult: Math.min(1 + t / 600, 1.8),
    spawnRate: Math.max(1.5, FISH_SPAWN_INTERVAL - t / 300),
    bossInterval: Math.max(18, BOSS_SPAWN_INTERVAL - t / 60),
  };
}

function getBossStrength(baseSt) {
  return baseSt + getDifficulty().bossStrengthBonus + randInt(0, 1);
}

function getBossSpeed(baseSpd) {
  return Math.min(baseSpd * getDifficulty().bossSpeedMult, PLAYER_SPEED - 30);
}

// ============================================================
// FISH SPAWNING
// ============================================================
game.spawnFish = function() {
  if (this.wildFish.length >= MAX_WILD_FISH) return;
  
  const types = ['normal', 'sick', 'freezing'];
  const weights = [0.4, 0.3, 0.3];
  let r = Math.random(), typeIdx = 0;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) { typeIdx = i; break; }
  }
  const fishType = types[typeIdx];
  const def = FISH_DEFS[fishType];
  const variant = pick(def.variants);
  
  const side = Math.random() < 0.5 ? -1 : 1;
  const fx = this.player.x + side * rand(SPAWN_DISTANCE * 0.6, SPAWN_DISTANCE);
  const fy = rand(PLAYER_MIN_Y + 30, PLAYER_MAX_Y - 30);
  
  this.wildFish.push({
    x: fx, y: fy,
    vx: rand(-20, 20), vy: rand(-10, 10),
    type: fishType,
    sprite: variant.sprite,
    healthySprite: variant.healthySprite,
    size: variant.size,
    state: 'wandering', // wandering, being_healed, healed
    healProgress: 0,
    facingRight: Math.random() < 0.5,
    wanderTimer: rand(0, 3),
    bobOffset: rand(0, Math.PI * 2),
    shakeTimer: 0,
  });
};

// ============================================================
// BOSS SPAWNING
// ============================================================
game.spawnBoss = function() {
  if (this.bosses.length >= MAX_BOSSES) return;
  
  const def = pick(BOSS_DEFS);
  const variant = pick(def.variants);
  const side = Math.random() < 0.5 ? -1 : 1;
  const bx = this.player.x + side * rand(SPAWN_DISTANCE * 0.8, SPAWN_DISTANCE * 1.2);
  const by = rand(PLAYER_MIN_Y + 50, PLAYER_MAX_Y - 50);
  
  this.bosses.push({
    x: bx, y: by,
    vx: rand(-30, 30), vy: rand(-15, 15),
    type: def.type,
    happySprite: variant.happy,
    angrySprite: variant.angry,
    size: def.size,
    speed: getBossSpeed(def.speed),
    strength: getBossStrength(def.baseStrength),
    state: 'peaceful', // peaceful, angry, being_defeated
    facingRight: Math.random() < 0.5,
    wanderTimer: rand(0, 4),
    bobOffset: rand(0, Math.PI * 2),
  });
};

// ============================================================
// DECORATION MANAGEMENT
// ============================================================
game.fillDecorations = function(fromX, toX) {
  for (let x = fromX; x < toX; x += DECORATION_SPACING) {
    const key = pick(DECO_KEYS);
    const dSize = key.includes('boat') ? rand(80, 120) :
                  key.includes('iceberg') ? rand(70, 110) :
                  key.includes('treasure') ? rand(50, 70) :
                  rand(40, 80);
    
    // Position Y based on item type:
    // - Boat: floats near the surface (top of water)
    // - Iceberg: at the surface
    // - Bottle: floats mid-upper water
    // - Everything else (corals, shells, starfish, treasure, item): on the ocean floor
    let decoY;
    if (key.includes('boat')) {
      decoY = PLAYER_MIN_Y + rand(-10, 30);
    } else if (key.includes('iceberg')) {
      decoY = PLAYER_MIN_Y + rand(0, 50);
    } else if (key.includes('bottle')) {
      decoY = rand(PLAYER_MIN_Y + 50, PLAYER_MIN_Y + 200);
    } else {
      // Corals, shells, starfish, treasure, item → ocean floor
      decoY = FLOOR_Y - dSize * 0.3 + rand(-5, 15);
    }
    
    this.decorations.push({
      x: x + rand(-80, 80),
      y: decoY,
      key, width: dSize, height: dSize * 0.9,
    });
  }
};

game.updateDecorations = function() {
  const viewLeft = this.camera.x - W/2 - 200;
  const viewRight = this.camera.x + W/2 + 200;
  
  // Extend decorations to the right
  while (this.decoRightBound < viewRight + 500) {
    this.fillDecorations(this.decoRightBound, this.decoRightBound + 500);
    this.decoRightBound += 500;
  }
  // Extend decorations to the left
  while (this.decoLeftBound > viewLeft - 500) {
    this.fillDecorations(this.decoLeftBound - 500, this.decoLeftBound);
    this.decoLeftBound -= 500;
  }
  
  // Cull far decorations
  this.decorations = this.decorations.filter(d =>
    d.x > this.player.x - DESPAWN_DISTANCE &&
    d.x < this.player.x + DESPAWN_DISTANCE
  );
};

// ============================================================
// PLAYER UPDATE
// ============================================================
game.updatePlayer = function(dt) {
  const p = this.player;
  getInput();
  
  const mag = Math.hypot(input.moveX, input.moveY);
  if (mag > 0.1) {
    p.vx = input.moveX * PLAYER_SPEED;
    p.vy = input.moveY * PLAYER_SPEED;
    if (Math.abs(input.moveX) > 0.15) {
      p.facingRight = input.moveX > 0;
    }
  } else {
    p.vx *= 0.85;
    p.vy *= 0.85;
  }
  
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.y = clamp(p.y, PLAYER_MIN_Y, PLAYER_MAX_Y);
  
  // Bobbing animation
  p.bobOffset += dt * 3;
  
  // Invincibility timer
  if (p.state === 'invincible') {
    p.invTimer -= dt;
    if (p.invTimer <= 0) {
      p.state = 'swimming';
    }
  }
  
  // Healing logic
  if (p.state === 'healing') {
    const target = p.healTarget;
    if (!target || target.state !== 'being_healed' || dist(p, target) > HEAL_RANGE * 1.8) {
      // Cancel healing
      p.state = 'swimming';
      p.spriteKey = 'playerNormal';
      if (target && target.state === 'being_healed') {
        target.state = 'wandering';
        target.healProgress = 0;
      }
    } else {
      target.healProgress += dt;
      if (target.healProgress >= p.healTime) {
        // Fish healed!
        target.state = 'healed';
        p.state = 'swimming';
        p.spriteKey = 'playerNormal';
        this.fishSaved++;
        
        // Spawn effects
        spawnHearts(target.x, target.y - 20, 5);
        spawnSparkles(target.x, target.y, 8);
        
        // Add to followers after a brief delay
        setTimeout(() => {
          if (target.state === 'healed') {
            this.addFollower(target);
          }
        }, 300);
      }
    }
  }
  
  // Auto-detect nearby fish to heal
  if (p.state === 'swimming') {
    p.spriteKey = 'playerNormal';
    let closest = null;
    let closestDist = HEAL_RANGE;
    
    for (const fish of this.wildFish) {
      if (fish.state !== 'wandering') continue;
      const d = dist(p, fish);
      if (d < closestDist) {
        closest = fish;
        closestDist = d;
      }
    }
    
    if (closest) {
      p.state = 'healing';
      p.healTarget = closest;
      p.healProgress = 0;
      closest.state = 'being_healed';
      closest.healProgress = 0;
      
      const def = FISH_DEFS[closest.type];
      p.healTime = def.healTime;
      p.spriteKey = def.playerSprite;
    }
  }
  
  // Record position history for followers
  this.positionHistory.unshift({ x: p.x, y: p.y });
  if (this.positionHistory.length > 2000) this.positionHistory.length = 2000;
};

// ============================================================
// FOLLOWER MANAGEMENT
// ============================================================
game.addFollower = function(fish) {
  // Remove from wild fish
  const idx = this.wildFish.indexOf(fish);
  if (idx >= 0) this.wildFish.splice(idx, 1);
  
  this.followers.push({
    x: fish.x, y: fish.y,
    sprite: fish.healthySprite,
    facingRight: true,
    bobOffset: rand(0, Math.PI * 2),
  });
};

game.updateFollowers = function(dt) {
  const sizeBase = Math.max(20, 42 - this.followers.length * 1.2);
  
  for (let i = 0; i < this.followers.length; i++) {
    const f = this.followers[i];
    const histIdx = Math.min((i + 1) * FOLLOWER_TRAIL_SPACING, this.positionHistory.length - 1);
    const target = this.positionHistory[histIdx] || this.player;
    
    f.x = lerp(f.x, target.x, 0.08);
    f.y = lerp(f.y, target.y, 0.08);
    f.size = sizeBase;
    
    // Face the same direction as movement
    const prevIdx = Math.min((i + 1) * FOLLOWER_TRAIL_SPACING + 5, this.positionHistory.length - 1);
    const prevPos = this.positionHistory[prevIdx] || target;
    if (Math.abs(target.x - prevPos.x) > 0.5) {
      f.facingRight = target.x > prevPos.x;
    }
    
    f.bobOffset += dt * 2.5;
  }
};

game.getPlayerStrength = function() {
  return this.followers.length;
};

// ============================================================
// WILD FISH UPDATE
// ============================================================
game.updateWildFish = function(dt) {
  for (let i = this.wildFish.length - 1; i >= 0; i--) {
    const fish = this.wildFish[i];
    
    // Despawn if too far
    if (dist(fish, this.player) > DESPAWN_DISTANCE) {
      this.wildFish.splice(i, 1);
      continue;
    }
    
    if (fish.state === 'wandering') {
      // Wander behavior
      fish.wanderTimer -= dt;
      if (fish.wanderTimer <= 0) {
        fish.vx = rand(-25, 25);
        fish.vy = rand(-15, 15);
        fish.wanderTimer = rand(2, 5);
        if (Math.abs(fish.vx) > 5) fish.facingRight = fish.vx > 0;
      }
      
      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;
      fish.y = clamp(fish.y, PLAYER_MIN_Y + 20, PLAYER_MAX_Y);
      
      fish.bobOffset += dt * 3;
      
      // Shake for sick/freezing
      if (fish.type === 'sick') {
        fish.shakeTimer += dt * 15;
      } else if (fish.type === 'freezing') {
        fish.shakeTimer += dt * 20;
      }
    }
    
    if (fish.state === 'being_healed') {
      // Stay still, slight wobble
      fish.bobOffset += dt * 5;
    }
  }
  
  // Remove healed fish that were converted to followers
  this.wildFish = this.wildFish.filter(f => f.state !== 'healed' || dist(f, this.player) < HEAL_RANGE * 3);
};

// ============================================================
// BOSS UPDATE
// ============================================================
game.updateBosses = function(dt) {
  for (let i = this.bosses.length - 1; i >= 0; i--) {
    const boss = this.bosses[i];
    
    // Despawn peaceful bosses too far away
    if (boss.state === 'peaceful' && dist(boss, this.player) > DESPAWN_DISTANCE) {
      this.bosses.splice(i, 1);
      continue;
    }
    
    if (boss.state === 'peaceful') {
      // Wander
      boss.wanderTimer -= dt;
      if (boss.wanderTimer <= 0) {
        boss.vx = rand(-35, 35);
        boss.vy = rand(-15, 15);
        boss.wanderTimer = rand(3, 6);
        if (Math.abs(boss.vx) > 5) boss.facingRight = boss.vx > 0;
      }
      boss.x += boss.vx * dt;
      boss.y += boss.vy * dt;
      boss.y = clamp(boss.y, PLAYER_MIN_Y, PLAYER_MAX_Y);
      boss.bobOffset += dt * 2;
      
      // Check if player touches boss
      const touchDist = (PLAYER_SIZE + boss.size) * 0.35;
      if (dist(boss, this.player) < touchDist) {
        boss.state = 'angry';
        boss.aggroTimer = 2.5; // Grace period before boss can hit player
        spawnStars(boss.x, boss.y - boss.size * 0.3, 5);
        
        // Push player away with strong force so they can escape
        const dx = this.player.x - boss.x;
        const dy = this.player.y - boss.y;
        const d = Math.hypot(dx, dy) || 1;
        this.player.vx = (dx / d) * 400;
        this.player.vy = (dy / d) * 280;
      }
    }
    
    if (boss.state === 'angry') {
      // Aggro grace period countdown
      if (boss.aggroTimer > 0) {
        boss.aggroTimer -= dt;
      }
      
      const dx = this.player.x - boss.x;
      const dy = this.player.y - boss.y;
      const d = Math.hypot(dx, dy);
      
      // Only chase AFTER grace period ends (gives player time to escape)
      if (boss.aggroTimer <= 0) {
        if (d > 0) {
          boss.x += (dx / d) * boss.speed * dt;
          boss.y += (dy / d) * boss.speed * dt;
        }
      }
      boss.y = clamp(boss.y, PLAYER_MIN_Y, PLAYER_MAX_Y);
      boss.facingRight = dx > 0;
      boss.bobOffset += dt * 4;
      
      // De-aggro if too far
      if (d > BOSS_DEAGGRO_DISTANCE) {
        boss.state = 'peaceful';
      }
      
      // Check collision with player (only after grace period)
      if (boss.aggroTimer <= 0) {
        const hitDist = (PLAYER_SIZE + boss.size) * 0.3;
        if (dist(boss, this.player) < hitDist && this.player.state !== 'invincible') {
          if (this.getPlayerStrength() >= boss.strength) {
            // DEFEAT THE BOSS!
            this.startDefeatAnimation(boss, i);
          } else {
            // Player gets bumped!
            this.playerBumped(boss);
          }
        }
      }
    }
  }
};

game.playerBumped = function(boss) {
  const p = this.player;
  p.state = 'invincible';
  p.invTimer = INVINCIBLE_TIME;
  p.spriteKey = 'playerNormal';
  
  // Push player away from boss
  const dx = p.x - boss.x;
  const dy = p.y - boss.y;
  const d = Math.hypot(dx, dy) || 1;
  p.vx = (dx / d) * 350;
  p.vy = (dy / d) * 250;
  
  if (this.followers.length > 0) {
    // Lose 1-2 followers
    const lose = Math.min(this.followers.length, randInt(1, 2));
    for (let i = 0; i < lose; i++) {
      const f = this.followers.pop();
      if (f) {
        spawnBubbles(f.x, f.y, 3);
      }
    }
  } else {
    // No followers — lose a life!
    p.lives--;
    spawnStars(p.x, p.y, 8);
    
    if (p.lives <= 0) {
      // GAME OVER!
      this.state = 'gameover';
      this.gameOverTime = this.time;
      return;
    }
  }
  
  spawnStars(p.x, p.y, 3);
};

// ============================================================
// BOSS DEFEAT ANIMATION
// ============================================================
game.startDefeatAnimation = function(boss, bossIndex) {
  // Remove boss from active list
  this.bosses.splice(bossIndex, 1);
  
  // Take N followers where N = boss strength
  const n = Math.min(boss.strength, this.followers.length);
  const attackers = this.followers.splice(this.followers.length - n, n);
  
  this.defeatAnimations.push({
    boss: { ...boss, state: 'being_defeated' },
    attackers: attackers.map(f => ({
      x: f.x, y: f.y,
      sprite: f.sprite,
      targetX: 0, targetY: 0, // will be set per phase
    })),
    phase: 0, // 0=surround, 1=push, 2=flip, 3=carry away
    timer: 0,
    bossOrigY: boss.y,
    done: false,
  });
  
  this.bossesDefeated++;
};

game.updateDefeatAnimations = function(dt) {
  for (let i = this.defeatAnimations.length - 1; i >= 0; i--) {
    const anim = this.defeatAnimations[i];
    anim.timer += dt;
    const boss = anim.boss;
    const n = anim.attackers.length;
    
    if (anim.phase === 0) {
      // Phase 0: Fish surround the boss (0-1.5s) - SLOW
      const progress = Math.min(anim.timer / 1.5, 1);
      for (let j = 0; j < n; j++) {
        const angle = (j / n) * Math.PI * 2;
        const radius = boss.size * 0.5;
        const tx = boss.x + Math.cos(angle) * radius;
        const ty = boss.y + Math.sin(angle) * radius;
        anim.attackers[j].x = lerp(anim.attackers[j].x, tx, 0.06);
        anim.attackers[j].y = lerp(anim.attackers[j].y, ty, 0.06);
      }
      if (anim.timer >= 1.5) { anim.phase = 1; anim.timer = 0; }
    }
    
    if (anim.phase === 1) {
      // Phase 1: Fish push closer, boss shakes (0-1s)
      const progress = Math.min(anim.timer / 1.0, 1);
      boss.x += Math.sin(anim.timer * 30) * 2;
      for (let j = 0; j < n; j++) {
        const angle = (j / n) * Math.PI * 2;
        const radius = boss.size * 0.3 * (1 - progress * 0.5);
        anim.attackers[j].x = lerp(anim.attackers[j].x, boss.x + Math.cos(angle) * radius, 0.1);
        anim.attackers[j].y = lerp(anim.attackers[j].y, boss.y + Math.sin(angle) * radius, 0.1);
      }
      if (progress >= 1) {
        spawnSparkles(boss.x, boss.y, 12);
        spawnStars(boss.x, boss.y, 8);
        anim.phase = 2;
        anim.timer = 0;
      }
    }
    
    if (anim.phase === 2) {
      // Phase 2: Boss flips upside down (0-0.5s)
      boss.flipProgress = Math.min(anim.timer / 0.5, 1);
      if (anim.timer >= 0.5) { anim.phase = 3; anim.timer = 0; }
    }
    
    if (anim.phase === 3) {
      // Phase 3: Fish carry boss to the LEFT quickly (0-1.5s)
      const speed = 500 + anim.timer * 200;
      boss.x -= speed * dt;
      boss.y = anim.bossOrigY + Math.sin(anim.timer * 5) * 10;
      
      for (let j = 0; j < n; j++) {
        const angle = (j / n) * Math.PI * 2;
        const radius = boss.size * 0.25;
        anim.attackers[j].x = lerp(anim.attackers[j].x, boss.x + Math.cos(angle) * radius, 0.15);
        anim.attackers[j].y = lerp(anim.attackers[j].y, boss.y + Math.sin(angle) * radius, 0.15);
      }
      
      // Check if off-screen
      const screenX = boss.x - game.camera.x;
      if (screenX < -boss.size * 2) {
        anim.done = true;
      }
    }
    
    if (anim.done) {
      this.defeatAnimations.splice(i, 1);
    }
  }
};

// ============================================================
// SPAWNING MANAGER
// ============================================================
game.manageSpawns = function(dt) {
  const diff = getDifficulty();
  
  // Fish spawning
  if (this.time - this.lastFishSpawn > diff.spawnRate) {
    this.spawnFish();
    this.lastFishSpawn = this.time;
  }
  
  // Boss spawning
  if (this.time - this.lastBossSpawn > diff.bossInterval && this.time > BOSS_FIRST_SPAWN_DELAY) {
    this.spawnBoss();
    this.lastBossSpawn = this.time;
  }
};

// ============================================================
// CAMERA
// ============================================================
game.updateCamera = function() {
  const p = this.player;
  this.camera.x = lerp(this.camera.x, p.x, 0.08);
  this.camera.y = lerp(this.camera.y, p.y - H * 0.1, 0.05);
  // Clamp camera vertically to keep world in view
  this.camera.y = clamp(this.camera.y, 0, WORLD_HEIGHT - H);
};
