/**
 * Entities - Player, Enemy Hierarchy, Projectiles, Particle FX, and Power-ups
 * Designed according to Carrier Air Wing specifications.
 */

class PlayerAircraft {
  constructor(type = 'f18') {
    this.type = type;
    this.x = 140;
    this.y = 360;
    this.width = 68;
    this.height = 32;

    // Carrier Air Wing core survival mechanics: Fuel & Armor
    this.fuel = 100;
    this.maxFuel = 100;
    this.fuelBurnRate = 1.4; // Consumes ~1.4% per second
    this.armor = 100;
    this.maxArmor = 100;

    // Primary Vulcan Gatling (Level 1 to 5)
    this.vulcanLevel = 1;
    this.fireTimer = 0;
    this.fireRate = 0.09;

    // Sub-weapons (Sparrow, Phoenix, Cluster Bomb)
    this.subWeapon = 'sparrow';
    this.subAmmo = 20;
    this.subFireTimer = 0;
    this.subFireRate = 0.4;

    // Tactical Screen-Clearing Mega Bomb
    this.bombs = 3;

    // Dynamics
    this.speed = 380;
    this.tilt = 0;
    this.invulnerableTimer = 2.0;
    this.isDead = false;

    this.applySpecs();
  }

  applySpecs() {
    if (this.type === 'f18') {
      this.speed = 380;
      this.maxArmor = 100;
      this.armor = 100;
      this.subWeapon = 'sparrow';
      this.subAmmo = 24;
      this.fireRate = 0.085;
    } else if (this.type === 'a10') {
      this.speed = 320;
      this.maxArmor = 160;
      this.armor = 160;
      this.subWeapon = 'cluster';
      this.subAmmo = 18;
      this.fireRate = 0.11;
    } else if (this.type === 'f14') {
      this.speed = 440;
      this.maxArmor = 85;
      this.armor = 85;
      this.subWeapon = 'phoenix';
      this.subAmmo = 16;
      this.fireRate = 0.08;
    }
  }

  update(dt, input, bullets, particles, sound) {
    if (this.isDead) return;

    // 1. Fuel Depletion Clock
    this.fuel = Math.max(0, this.fuel - this.fuelBurnRate * dt);
    if (this.fuel <= 0) {
      // Out of fuel crash
      this.takeDamage(999, particles, sound);
      return;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
    }

    // 2. Flight Movement & Banking
    let vx = 0;
    let vy = 0;
    if (input.up) vy -= 1;
    if (input.down) vy += 1;
    if (input.left) vx -= 1;
    if (input.right) vx += 1;

    // Normalize diagonal velocity
    if (vx !== 0 && vy !== 0) {
      const len = Math.hypot(vx, vy);
      vx /= len;
      vy /= len;
    }

    this.x += vx * this.speed * dt;
    this.y += vy * this.speed * dt;

    // Screen bounds clamp (1280 x 720, excluding HUD)
    this.x = Math.max(40, Math.min(1240, this.x));
    this.y = Math.max(90, Math.min(660, this.y));

    // Smooth banking tilt
    const targetTilt = vy !== 0 ? vy * 0.8 : 0;
    this.tilt += (targetTilt - this.tilt) * 12 * dt;

    // 3. Primary Weapon Firing
    this.fireTimer -= dt;
    if (input.shoot && this.fireTimer <= 0) {
      this.fireTimer = this.fireRate;
      this.fireVulcan(bullets, sound);
    }

    // 4. Sub-weapon Firing
    this.subFireTimer -= dt;
    if (input.subWeapon && this.subFireTimer <= 0 && this.subAmmo > 0) {
      this.subFireTimer = this.subFireRate;
      this.subAmmo--;
      this.fireSub(bullets, sound);
    }
  }

  fireVulcan(bullets, sound) {
    sound.playShoot(this.type === 'a10' ? 'gau8' : 'vulcan');
    const lvl = this.vulcanLevel;
    const px = this.x + 30;
    const py = this.y;

    if (lvl === 1) {
      bullets.push(new Projectile(px, py, 950, 0, 18, true, 'vulcan'));
    } else if (lvl === 2) {
      bullets.push(new Projectile(px, py - 4, 980, 0, 20, true, 'vulcan'));
      bullets.push(new Projectile(px, py + 4, 980, 0, 20, true, 'vulcan'));
    } else if (lvl === 3) {
      bullets.push(new Projectile(px, py, 1000, 0, 22, true, 'vulcan'));
      bullets.push(new Projectile(px, py - 6, 960, -80, 20, true, 'vulcan'));
      bullets.push(new Projectile(px, py + 6, 960, 80, 20, true, 'vulcan'));
    } else if (lvl === 4) {
      bullets.push(new Projectile(px, py - 5, 1020, 0, 24, true, 'vulcan'));
      bullets.push(new Projectile(px, py + 5, 1020, 0, 24, true, 'vulcan'));
      bullets.push(new Projectile(px, py - 10, 980, -140, 22, true, 'vulcan'));
      bullets.push(new Projectile(px, py + 10, 980, 140, 22, true, 'vulcan'));
    } else {
      // Level 5 Apex Spread
      bullets.push(new Projectile(px, py, 1050, 0, 28, true, 'vulcan'));
      bullets.push(new Projectile(px, py - 6, 1020, -90, 25, true, 'vulcan'));
      bullets.push(new Projectile(px, py + 6, 1020, 90, 25, true, 'vulcan'));
      bullets.push(new Projectile(px, py - 14, 980, -200, 22, true, 'vulcan'));
      bullets.push(new Projectile(px, py + 14, 980, 200, 22, true, 'vulcan'));
    }
  }

  fireSub(bullets, sound) {
    sound.playMissileLaunch();
    const px = this.x;
    const py = this.y;

    if (this.subWeapon === 'sparrow') {
      bullets.push(new Projectile(px, py - 12, 750, -40, 75, true, 'missile'));
      bullets.push(new Projectile(px, py + 12, 750, 40, 75, true, 'missile'));
    } else if (this.subWeapon === 'phoenix') {
      bullets.push(new Projectile(px, py - 15, 900, 0, 120, true, 'missile'));
      bullets.push(new Projectile(px, py + 15, 900, 0, 120, true, 'missile'));
    } else if (this.subWeapon === 'cluster') {
      // Heavy downward carpet bomb
      bullets.push(new Projectile(px, py + 10, 380, 260, 140, true, 'missile'));
      bullets.push(new Projectile(px + 20, py + 10, 450, 320, 140, true, 'missile'));
    }
  }

  takeDamage(amount, particles, sound) {
    if (this.invulnerableTimer > 0 || this.isDead) return;

    this.armor -= amount;
    sound.playExplosion('small');

    // Spawn sparks
    for (let i = 0; i < 12; i++) {
      particles.push(new Particle(this.x, this.y, '#00ddff', 3, 0.4));
    }

    if (this.armor <= 0) {
      this.isDead = true;
      sound.playExplosion('medium');
      for (let i = 0; i < 35; i++) {
        particles.push(new Particle(this.x, this.y, '#ff4400', 5, 0.8));
      }
    } else {
      this.invulnerableTimer = 1.0;
    }
  }
}

class Projectile {
  constructor(x, y, vx, vy, damage, isPlayer = true, subType = 'vulcan') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.subType = subType;
    this.active = true;
    this.radius = subType === 'missile' ? 8 : 4;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    if (this.x < -50 || this.x > 1330 || this.y < -50 || this.y > 770) {
      this.active = false;
    }
  }
}

class EnemyUnit {
  constructor(opts) {
    this.x = opts.x || 1350;
    this.y = opts.y || 360;
    this.type = opts.type || 'mig21';
    this.subType = opts.subType || '';
    this.hp = opts.hp || 25;
    this.maxHp = this.hp;
    this.speed = opts.speed || 240;
    this.aiPattern = opts.aiPattern || 'straight'; // 'straight', 'sine', 'dive'
    this.dropItem = opts.dropItem || null;
    this.scoreVal = opts.score || 200;

    this.active = true;
    this.age = 0;
    this.startY = this.y;
    this.shootTimer = 1.2 + Math.random() * 1.5;

    // Collision Box
    if (this.type === 'boss') {
      this.width = 240;
      this.height = 120;
    } else if (this.type === 'stealth_bomber') {
      this.width = 80;
      this.height = 50;
    } else {
      this.width = 54;
      this.height = 28;
    }
  }

  update(dt, playerX, playerY, bullets) {
    this.age += dt;

    if (this.type === 'boss') {
      // Boss Hovering Movement
      if (this.x > 1020) {
        this.x -= 120 * dt;
      } else {
        this.y = this.startY + Math.sin(this.age * 1.2) * 140;
      }

      // Multi-turret bullet salvos
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = 1.1;
        // Fire spread at player
        const angle = Math.atan2(playerY - this.y, playerX - this.x);
        for (let a = -0.3; a <= 0.3; a += 0.3) {
          const spd = 360;
          bullets.push(new Projectile(this.x - 30, this.y, Math.cos(angle + a) * spd, Math.sin(angle + a) * spd, 15, false));
        }
      }
      return;
    }

    // Standard Enemies
    if (this.aiPattern === 'straight') {
      this.x -= this.speed * dt;
    } else if (this.aiPattern === 'sine') {
      this.x -= this.speed * dt;
      this.y = this.startY + Math.sin(this.age * 4) * 80;
    } else if (this.aiPattern === 'dive') {
      this.x -= this.speed * dt;
      if (this.x < 800) {
        this.y += 180 * dt;
      }
    }

    // Aimed Shot
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && this.x < 1200 && this.x > playerX + 60) {
      this.shootTimer = 2.0 + Math.random() * 2.0;
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      bullets.push(new Projectile(this.x, this.y, Math.cos(angle) * 340, Math.sin(angle) * 340, 12, false));
    }

    if (this.x < -100 || this.y < -100 || this.y > 820) {
      this.active = false;
    }
  }
}

class ItemLoot {
  constructor(x, y, type = 'gold') {
    this.x = x;
    this.y = y;
    this.type = type; // 'gold', 'fuel', 'powder'
    this.active = true;
    this.radius = 16;
  }

  update(dt) {
    this.x -= 90 * dt; // Drifts slowly left
    if (this.x < -40) this.active = false;
  }
}

class Particle {
  constructor(x, y, color, size, life) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const spd = 40 + Math.random() * 180;
    this.vx = Math.cos(angle) * spd;
    this.vy = Math.sin(angle) * spd;
    this.color = color;
    this.size = size;
    this.life = life;
    this.maxLife = life;
    this.alpha = 1.0;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    this.alpha = this.life / this.maxLife;
  }
}

window.PlayerAircraft = PlayerAircraft;
window.Projectile = Projectile;
window.EnemyUnit = EnemyUnit;
window.ItemLoot = ItemLoot;
window.Particle = Particle;
