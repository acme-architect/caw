/**
 * GameEngine - Master Game Controller & Loop
 * Integrates Vector Rendering, WebAudio Procedural Synthesizer,
 * Object Pooling, Shop Mechanics, Collision Detection, and State Management.
 */

class GameEngine {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new VectorRenderEngine(this.canvas);
    this.sound = window.soundEngine;
    this.stageManager = new CampaignStageManager();

    this.playerType = 'f18';
    this.player = null;
    this.enemies = [];
    this.bullets = [];
    this.items = [];
    this.particles = [];

    this.score = 0;
    this.funds = 1500; // Starting Bounty
    this.highscore = parseInt(localStorage.getItem('caw_apex_hi') || '75000', 10);

    this.gameState = 'TITLE'; // 'TITLE', 'PLAYING', 'SHOP', 'GAMEOVER', 'VICTORY'
    this.scrollX = 0;
    this.scrollSpeed = 220;

    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      shoot: false,
      subWeapon: false,
      bomb: false
    };

    this.lastTime = performance.now();
    this.initDOM();
    this.bindEvents();

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  initDOM() {
    this.dom = {
      score: document.getElementById('hud-score'),
      highScore: document.getElementById('hud-highscore'),
      funds: document.getElementById('hud-gold'),
      callsign: document.getElementById('hud-callsign'),
      fuelBar: document.getElementById('hud-fuel'),
      fuelText: document.getElementById('hud-fuel-text'),
      shieldBar: document.getElementById('hud-shield'),
      shieldText: document.getElementById('hud-shield-text'),
      vulcanLevel: document.getElementById('hud-vulcan-level'),
      subName: document.getElementById('hud-sub-name'),
      subAmmo: document.getElementById('hud-sub-ammo'),
      bombs: document.getElementById('hud-bombs'),
      commSpeaker: document.getElementById('comm-speaker'),
      commText: document.getElementById('comm-text'),
      bossWarning: document.getElementById('boss-warning'),
      bossSub: document.getElementById('boss-warning-sub'),
      bossHealthBar: document.getElementById('boss-health-bar'),
      bossName: document.getElementById('boss-name'),
      bossFill: document.getElementById('boss-health-fill'),

      // Modals
      titleScreen: document.getElementById('title-screen'),
      shopScreen: document.getElementById('shop-screen'),
      gameOverScreen: document.getElementById('game-over-screen'),
      victoryScreen: document.getElementById('victory-screen'),
      shopFunds: document.getElementById('shop-funds'),
      finalScore: document.getElementById('final-score'),
      victoryScore: document.getElementById('victory-score')
    };

    if (this.dom.highScore) {
      this.dom.highScore.textContent = this.scorePad(this.highscore);
    }
  }

  bindEvents() {
    window.addEventListener('keydown', e => {
      this.sound.init();
      this.sound.resume();

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
      if (e.code === 'KeyJ' || e.code === 'KeyZ') this.input.shoot = true;
      if (e.code === 'KeyK' || e.code === 'KeyX') this.input.subWeapon = true;
      if (e.code === 'Space' || e.code === 'KeyC') {
        if (!this.input.bomb && this.gameState === 'PLAYING') {
          this.triggerTacticalBomb();
        }
        this.input.bomb = true;
      }
    });

    window.addEventListener('keyup', e => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'KeyJ' || e.code === 'KeyZ') this.input.shoot = false;
      if (e.code === 'KeyK' || e.code === 'KeyX') this.input.subWeapon = false;
      if (e.code === 'Space' || e.code === 'KeyC') this.input.bomb = false;
    });

    // Aircraft Select Cards
    document.querySelectorAll('.plane-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.plane-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.playerType = card.dataset.plane;
        this.sound.playShoot('vulcan');
      });
    });

    // Start Button
    document.getElementById('btn-launch').addEventListener('click', () => {
      this.startNewCampaign();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.startNewCampaign();
    });

    document.getElementById('btn-victory-restart').addEventListener('click', () => {
      this.startNewCampaign();
    });

    // Shop Purchase Buttons
    document.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost, 10);
        this.purchaseShopItem(item, cost);
      });
    });

    document.getElementById('btn-shop-continue').addEventListener('click', () => {
      this.closeShopAndResume();
    });
  }

  scorePad(num) {
    return num.toString().padStart(7, '0');
  }

  startNewCampaign() {
    this.sound.init();
    this.sound.resume();
    this.score = 0;
    this.funds = 1500;
    this.player = new PlayerAircraft(this.playerType);
    this.enemies = [];
    this.bullets = [];
    this.items = [];
    this.particles = [];

    this.dom.titleScreen.classList.add('hidden');
    this.dom.gameOverScreen.classList.add('hidden');
    this.dom.victoryScreen.classList.add('hidden');
    this.dom.shopScreen.classList.add('hidden');

    this.gameState = 'PLAYING';
    this.stageManager.startStage(0);
    this.sound.startBGM(false);
  }

  openShop() {
    this.gameState = 'SHOP';
    this.sound.stopBGM();
    this.dom.shopFunds.textContent = `$${this.funds}`;
    this.dom.shopScreen.classList.remove('hidden');
    this.updateShopButtons();
  }

  updateShopButtons() {
    document.querySelectorAll('.btn-buy').forEach(btn => {
      const cost = parseInt(btn.dataset.cost, 10);
      btn.disabled = this.funds < cost;
    });
  }

  purchaseShopItem(item, cost) {
    if (this.funds < cost) return;
    this.funds -= cost;
    this.sound.playItemPickup('gold');
    this.dom.shopFunds.textContent = `$${this.funds}`;

    if (item === 'vulcan') {
      this.player.vulcanLevel = Math.min(5, this.player.vulcanLevel + 1);
    } else if (item === 'missile') {
      this.player.subAmmo += 20;
    } else if (item === 'bomb') {
      this.player.bombs = Math.min(5, this.player.bombs + 1);
    } else if (item === 'armor') {
      this.player.armor = this.player.maxArmor;
    } else if (item === 'fuel') {
      this.player.fuel = this.player.maxFuel;
    }

    this.updateShopButtons();
    this.updateHUD();
  }

  closeShopAndResume() {
    this.dom.shopScreen.classList.add('hidden');
    this.gameState = 'PLAYING';
    const nextIdx = this.stageManager.stageIndex + 1;

    if (nextIdx >= this.stageManager.stages.length) {
      // Completed all stages!
      this.triggerVictory();
      return;
    }

    this.stageManager.startStage(nextIdx);
    this.sound.startBGM(false);
  }

  triggerVictory() {
    this.gameState = 'VICTORY';
    this.sound.stopBGM();
    this.sound.playExplosion('boss');
    this.dom.victoryScore.textContent = this.scorePad(this.score);
    this.dom.victoryScreen.classList.remove('hidden');
  }

  triggerGameOver() {
    this.gameState = 'GAMEOVER';
    this.sound.stopBGM();
    this.dom.finalScore.textContent = this.scorePad(this.score);
    this.dom.gameOverScreen.classList.remove('hidden');
  }

  triggerTacticalBomb() {
    if (!this.player || this.player.bombs <= 0) return;
    this.player.bombs--;
    this.sound.playBombBlast();
    this.renderer.addShake(25);

    // Destroy all regular enemy bullets and damage enemies
    this.bullets = this.bullets.filter(b => b.isPlayer);
    for (const e of this.enemies) {
      e.hp -= 200;
      for (let i = 0; i < 15; i++) {
        this.particles.push(new Particle(e.x, e.y, '#ffaa00', 4, 0.6));
      }
    }
  }

  loop(timestamp) {
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    if (dt > 0.05) dt = 0.05; // Prevent spiral of death on tab unfocus

    if (this.gameState === 'PLAYING') {
      this.update(dt);
    }

    this.draw();
    requestAnimationFrame(this.loop);
  }

  update(dt) {
    this.scrollX += this.scrollSpeed * dt;
    this.renderer.update(dt);

    const theme = this.stageManager.getCurrentStage().theme;

    // 1. Stage update
    this.stageManager.update(
      dt,
      this.enemies,
      (speaker, text) => {
        this.dom.commSpeaker.textContent = speaker + ':';
        this.dom.commText.textContent = text;
      },
      (bossName, subType) => {
        this.dom.bossWarning.classList.add('active');
        this.dom.bossSub.textContent = `TARGET: ${bossName}`;
        this.dom.bossHealthBar.classList.add('active');
        this.dom.bossName.textContent = bossName;
        this.sound.setBossMode(true);
        setTimeout(() => {
          this.dom.bossWarning.classList.remove('active');
        }, 3200);
      }
    );

    // 2. Player update
    this.player.update(dt, this.input, this.bullets, this.particles, this.sound);
    if (this.player.isDead) {
      setTimeout(() => this.triggerGameOver(), 1200);
    }

    // 3. Enemies update
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.update(dt, this.player.x, this.player.y, this.bullets);
      if (!e.active) {
        this.enemies.splice(i, 1);
      }
    }

    // 4. Projectiles update
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.update(dt);
      if (!b.active) {
        this.bullets.splice(i, 1);
      }
    }

    // 5. Items update
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      it.update(dt);
      if (!it.active) {
        this.items.splice(i, 1);
      }
    }

    // 6. Particles update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 7. Collisions
    this.checkCollisions();

    // 8. Update HUD
    this.updateHUD();
  }

  checkCollisions() {
    const p = this.player;

    // Player bullets vs Enemies
    for (const b of this.bullets) {
      if (!b.isPlayer || !b.active) continue;

      for (const e of this.enemies) {
        if (!e.active) continue;

        const dx = Math.abs(b.x - e.x);
        const dy = Math.abs(b.y - e.y);
        if (dx < e.width * 0.5 + b.radius && dy < e.height * 0.5 + b.radius) {
          b.active = false;
          e.hp -= b.damage;
          this.sound.playExplosion('small');

          for (let k = 0; k < 4; k++) {
            this.particles.push(new Particle(b.x, b.y, '#ffd700', 2.5, 0.25));
          }

          if (e.hp <= 0) {
            e.active = false;
            this.sound.playExplosion(e.type === 'boss' ? 'boss' : 'medium');
            this.renderer.addShake(e.type === 'boss' ? 18 : 6);
            this.score += e.scoreVal;
            this.funds += Math.floor(e.scoreVal * 0.4);

            // Explosion particles
            for (let k = 0; k < (e.type === 'boss' ? 80 : 20); k++) {
              this.particles.push(new Particle(e.x, e.y, '#ff4400', 4.5, 0.7));
            }

            // Drop loot
            if (e.dropItem) {
              this.items.push(new ItemLoot(e.x, e.y, e.dropItem));
            } else if (Math.random() < 0.3) {
              this.items.push(new ItemLoot(e.x, e.y, 'gold'));
            }

            // Boss defeated transition
            if (e.type === 'boss') {
              this.stageManager.bossDefeated = true;
              this.dom.bossHealthBar.classList.remove('active');
              setTimeout(() => this.openShop(), 2200);
            }
          }
          break;
        }
      }
    }

    // Enemy bullets vs Player
    if (!p.isDead && p.invulnerableTimer <= 0) {
      for (const b of this.bullets) {
        if (b.isPlayer || !b.active) continue;

        const dist = Math.hypot(b.x - p.x, b.y - p.y);
        if (dist < 22) {
          b.active = false;
          p.takeDamage(b.damage, this.particles, this.sound);
          this.renderer.addShake(9);
          break;
        }
      }

      // Enemy crash vs Player
      for (const e of this.enemies) {
        if (!e.active) continue;
        const dx = Math.abs(e.x - p.x);
        const dy = Math.abs(e.y - p.y);
        if (dx < 35 + e.width * 0.4 && dy < 18 + e.height * 0.4) {
          p.takeDamage(35, this.particles, this.sound);
          this.renderer.addShake(12);
          if (e.type !== 'boss') {
            e.active = false;
            this.sound.playExplosion('medium');
          }
          break;
        }
      }
    }

    // Player vs Item Loot
    if (!p.isDead) {
      for (const it of this.items) {
        if (!it.active) continue;
        const dist = Math.hypot(it.x - p.x, it.y - p.y);
        if (dist < 36) {
          it.active = false;
          this.sound.playItemPickup(it.type);

          if (it.type === 'fuel') {
            p.fuel = Math.min(p.maxFuel, p.fuel + 40);
          } else if (it.type === 'powder') {
            p.vulcanLevel = Math.min(5, p.vulcanLevel + 1);
            p.subAmmo += 8;
          } else if (it.type === 'gold') {
            this.funds += 1000;
            this.score += 2500;
          }
        }
      }
    }
  }

  updateHUD() {
    const p = this.player;
    if (!p) return;

    this.dom.score.textContent = this.scorePad(this.score);
    this.dom.funds.textContent = `$${this.funds}`;

    // Fuel Bar
    const fuelPct = Math.max(0, Math.min(100, (p.fuel / p.maxFuel) * 100));
    this.dom.fuelBar.style.width = `${fuelPct}%`;
    this.dom.fuelText.textContent = `${Math.round(fuelPct)}%`;
    if (fuelPct < 25) {
      this.dom.fuelBar.classList.add('critical');
    } else {
      this.dom.fuelBar.classList.remove('critical');
    }

    // Armor Bar
    const armorPct = Math.max(0, Math.min(100, (p.armor / p.maxArmor) * 100));
    this.dom.shieldBar.style.width = `${armorPct}%`;
    this.dom.shieldText.textContent = `${Math.round(armorPct)}%`;
    if (armorPct < 25) {
      this.dom.shieldBar.classList.add('critical');
    } else {
      this.dom.shieldBar.classList.remove('critical');
    }

    // Weapons
    this.dom.vulcanLevel.textContent = `MK-${p.vulcanLevel} LVL ${p.vulcanLevel}`;
    this.dom.subName.textContent = p.subWeapon.toUpperCase();
    this.dom.subAmmo.textContent = p.subAmmo;
    this.dom.bombs.textContent = p.bombs;

    // Boss Health Bar
    const boss = this.enemies.find(e => e.type === 'boss' && e.active);
    if (boss && this.dom.bossFill) {
      const bossPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
      this.dom.bossFill.style.width = `${bossPct}%`;
    }
  }

  draw() {
    this.renderer.clear();

    const theme = this.stageManager.getCurrentStage()?.theme || 'ocean';
    this.renderer.drawParallax(theme, this.scrollX);

    // Draw Items
    for (const it of this.items) {
      this.renderer.drawItem(it);
    }

    // Draw Enemies
    for (const e of this.enemies) {
      this.renderer.drawEnemy(e);
    }

    // Draw Player
    if (this.player && !this.player.isDead) {
      this.renderer.drawPlayerJet(this.player);
    }

    // Draw Bullets
    for (const b of this.bullets) {
      this.renderer.drawBullet(b);
    }

    // Draw Particles
    for (const p of this.particles) {
      this.renderer.drawParticle(p);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.gameEngine = new GameEngine();
});

