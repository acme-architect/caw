/**
 * VectorRenderEngine - AAA Procedural Military Air Warfare Renderer
 * Renders aircraft, ordnance, parallax skies, oceans, volumetric flak,
 * afterburners, bullet glow, and screen-shake without external image assets.
 */
class VectorRenderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.shakeIntensity = 0;
    this.shakeDecay = 0.91;
    this.shakeX = 0;
    this.shakeY = 0;
    this.time = 0;
  }

  addShake(val) {
    this.shakeIntensity = Math.min(this.shakeIntensity + val, 30);
  }

  update(dt) {
    this.time += dt;
    if (this.shakeIntensity > 0.05) {
      this.shakeX = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeY = (Math.random() * 2 - 1) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeIntensity = 0;
    }
  }

  clear() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.translate(this.shakeX, this.shakeY);
  }

  // --- MULTI-LAYER PARALLAX BACKGROUNDS ---
  drawParallax(theme, scrollX) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    if (theme === 'ocean') {
      // 1. Sky Gradient
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.65);
      sky.addColorStop(0, '#06162a');
      sky.addColorStop(0.5, '#133966');
      sky.addColorStop(1, '#568cb9');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.65);

      // 2. High Altitude Cirrus Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      const offC1 = (scrollX * 0.12) % 900;
      for (let x = -offC1; x < w + 900; x += 300) {
        this.drawCloud(ctx, x, 60, 220, 40);
      }

      // 3. Horizon Islands / Mountain Silhouettes
      ctx.fillStyle = '#0f2638';
      const offM = (scrollX * 0.35) % 1200;
      ctx.beginPath();
      ctx.moveTo(-offM, h * 0.65);
      for (let x = -offM; x < w + 1200; x += 150) {
        ctx.lineTo(x + 75, h * 0.65 - 35 - Math.sin(x * 0.02) * 25);
        ctx.lineTo(x + 150, h * 0.65);
      }
      ctx.fill();

      // 4. Ocean Gradient & Waves
      const ocean = ctx.createLinearGradient(0, h * 0.65, 0, h);
      ocean.addColorStop(0, '#10395c');
      ocean.addColorStop(0.3, '#0b2640');
      ocean.addColorStop(1, '#04121e');
      ctx.fillStyle = ocean;
      ctx.fillRect(0, h * 0.65, w, h * 0.35);

      // Ocean wave highlights
      ctx.strokeStyle = 'rgba(0, 221, 255, 0.2)';
      ctx.lineWidth = 1.5;
      const offW = (scrollX * 1.8) % 180;
      for (let y = h * 0.67; y < h; y += 18) {
        const rowSpeed = 1 + (y - h * 0.67) / (h * 0.33) * 2;
        const rowOff = (scrollX * rowSpeed) % 240;
        ctx.beginPath();
        for (let x = -rowOff; x < w + 240; x += 80) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 35, y);
        }
        ctx.stroke();
      }
    } else {
      // Desert / Canyon Theme
      const sky = ctx.createLinearGradient(0, 0, 0, h * 0.55);
      sky.addColorStop(0, '#1a0e05');
      sky.addColorStop(0.5, '#4a2810');
      sky.addColorStop(1, '#a66838');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h * 0.55);

      // Distant Canyon Mesas
      ctx.fillStyle = '#3a1f10';
      const offMesa = (scrollX * 0.3) % 1000;
      for (let x = -offMesa; x < w + 1000; x += 320) {
        ctx.fillRect(x, h * 0.55 - 70, 160, 70);
      }

      // Ground canyon floor
      const ground = ctx.createLinearGradient(0, h * 0.55, 0, h);
      ground.addColorStop(0, '#542d17');
      ground.addColorStop(0.4, '#381e0e');
      ground.addColorStop(1, '#1b0e06');
      ctx.fillStyle = ground;
      ctx.fillRect(0, h * 0.55, w, h * 0.45);

      // Rocky strata ridges
      ctx.strokeStyle = 'rgba(230, 140, 70, 0.25)';
      ctx.lineWidth = 2;
      for (let y = h * 0.58; y < h; y += 22) {
        const offRidge = (scrollX * 2.2) % 300;
        ctx.beginPath();
        for (let x = -offRidge; x < w + 300; x += 110) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + 55, y);
        }
        ctx.stroke();
      }
    }
  }

  drawCloud(ctx, x, y, w, h) {
    ctx.beginPath();
    ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.5, h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- FIGHTER JETS PROCEDURAL VECTOR RENDERING ---

  drawPlayerJet(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Banking tilt rotation
    ctx.rotate((p.tilt || 0) * 0.25);

    // Invulnerability blinking
    if (p.invulnerableTimer > 0 && Math.floor(this.time * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    if (p.type === 'f18') {
      this.renderF18(ctx, p);
    } else if (p.type === 'a10') {
      this.renderA10(ctx, p);
    } else if (p.type === 'f14') {
      this.renderF14(ctx, p);
    }

    // Engine Afterburner Flame
    this.renderAfterburner(ctx, -26, 0, p.speedBoost ? 1.6 : 1.0);

    ctx.restore();
  }

  renderF18(ctx, p) {
    // F/A-18 Hornet: Sleek naval strike fighter, canted twin tails, LEX wings
    // Main fuselage
    ctx.fillStyle = '#6f8396';
    ctx.strokeStyle = '#2d3d4d';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(34, 0); // Radome nose
    ctx.lineTo(12, -7);
    ctx.lineTo(-24, -8);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-24, 8);
    ctx.lineTo(12, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wings
    ctx.fillStyle = '#5c7083';
    ctx.beginPath();
    ctx.moveTo(8, -6);
    ctx.lineTo(-12, -26);
    ctx.lineTo(-22, -26);
    ctx.lineTo(-16, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wingtip Sidewinder Rail
    ctx.fillStyle = '#abbecf';
    ctx.fillRect(-22, -28, 14, 3);

    // Canopy (Tinted Gold Glass)
    const glass = ctx.createLinearGradient(4, -5, 20, 0);
    glass.addColorStop(0, '#ffd700');
    glass.addColorStop(0.7, '#ff8800');
    glass.addColorStop(1, '#332200');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();

    // Twin canted tails
    ctx.fillStyle = '#3f5367';
    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-26, -18);
    ctx.lineTo(-32, -18);
    ctx.lineTo(-26, -4);
    ctx.closePath();
    ctx.fill();
  }

  renderA10(ctx, p) {
    // A-10 Thunderbolt II: Heavy rugged armored hull, twin high-mounted turbofans, straight wings
    ctx.fillStyle = '#4c5c4c';
    ctx.strokeStyle = '#1b241b';
    ctx.lineWidth = 1.5;

    // Rugged fuselage
    ctx.beginPath();
    ctx.moveTo(32, 0);
    ctx.lineTo(14, -8);
    ctx.lineTo(-26, -9);
    ctx.lineTo(-28, 0);
    ctx.lineTo(-26, 9);
    ctx.lineTo(14, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 30mm Avenger Gatling muzzle at the nose
    ctx.fillStyle = '#111';
    ctx.fillRect(28, 1, 8, 3);

    // Straight wide wings
    ctx.fillStyle = '#3d4b3d';
    ctx.beginPath();
    ctx.moveTo(4, -8);
    ctx.lineTo(-8, -28);
    ctx.lineTo(-22, -28);
    ctx.lineTo(-16, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High twin engines pod
    ctx.fillStyle = '#2b362b';
    ctx.fillRect(-22, -18, 18, 8);
    ctx.fillStyle = '#111';
    ctx.fillRect(-4, -17, 3, 6); // Intake

    // Armored Cockpit
    ctx.fillStyle = '#8bc34a';
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(8, -6);
    ctx.lineTo(2, 0);
    ctx.closePath();
    ctx.fill();
  }

  renderF14(ctx, p) {
    // F-14 Tomcat: Variable-sweep supersonic interceptor, twin engines, needle nose
    ctx.fillStyle = '#7a8699';
    ctx.strokeStyle = '#273344';
    ctx.lineWidth = 1.5;

    // Chiseled fuselage
    ctx.beginPath();
    ctx.moveTo(38, 0);
    ctx.lineTo(14, -6);
    ctx.lineTo(-26, -9);
    ctx.lineTo(-30, 0);
    ctx.lineTo(-26, 9);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Swept wings
    ctx.fillStyle = '#657388';
    ctx.beginPath();
    ctx.moveTo(10, -6);
    ctx.lineTo(-16, -26);
    ctx.lineTo(-24, -26);
    ctx.lineTo(-18, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Dual intake vents
    ctx.fillStyle = '#1a2430';
    ctx.fillRect(-10, 4, 12, 4);

    // Long Tandem Cockpit
    const glass = ctx.createLinearGradient(4, -5, 24, 0);
    glass.addColorStop(0, '#00ddff');
    glass.addColorStop(1, '#003366');
    ctx.fillStyle = glass;
    ctx.beginPath();
    ctx.moveTo(26, 0);
    ctx.lineTo(12, -5);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();

    // Twin upright rudders
    ctx.fillStyle = '#4c586c';
    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-28, -20);
    ctx.lineTo(-34, -20);
    ctx.lineTo(-28, -5);
    ctx.closePath();
    ctx.fill();
  }

  renderAfterburner(ctx, x, y, scale = 1.0) {
    const flicker = 0.8 + Math.random() * 0.4;
    const len = 22 * scale * flicker;

    const grad = ctx.createLinearGradient(x, y, x - len, y);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.2, '#00ddff');
    grad.addColorStop(0.6, '#ff6600');
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x - len, y);
    ctx.lineTo(x, y + 4);
    ctx.closePath();
    ctx.fill();
  }

  // --- ENEMY VECTOR RENDERING ---

  drawEnemy(e) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(e.x, e.y);

    if (e.type === 'mig21') {
      // Classic Fishbed fighter: Delta wing, nose cone intake
      ctx.fillStyle = '#a63b32';
      ctx.strokeStyle = '#4a100a';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(-28, 0); // Pointing left towards player
      ctx.lineTo(-10, -5);
      ctx.lineTo(24, -6);
      ctx.lineTo(24, 6);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Delta wings
      ctx.beginPath();
      ctx.moveTo(-6, -5);
      ctx.lineTo(18, -22);
      ctx.lineTo(22, -5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Red star insignia
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(6, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.type === 'hind') {
      // Mi-24 Hind Gunship: Twin bubble canopy, stub wings, dual rotors
      ctx.fillStyle = '#455938';
      ctx.strokeStyle = '#1d2b15';
      ctx.lineWidth = 1.5;

      // Heavy body
      ctx.beginPath();
      ctx.ellipse(0, 0, 26, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Rotor blur spinning
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -14, 38, 4, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Gun turret
      ctx.fillStyle = '#111';
      ctx.fillRect(-28, 2, 8, 3);
    } else if (e.type === 'stealth_bomber') {
      // Heavy Delta Wing Stealth Bomber
      ctx.fillStyle = '#22262c';
      ctx.strokeStyle = '#444d5a';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.lineTo(36, -34);
      ctx.lineTo(20, -12);
      ctx.lineTo(36, 0);
      ctx.lineTo(20, 12);
      ctx.lineTo(36, 34);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (e.type === 'boss') {
      this.drawBoss(ctx, e);
    }

    ctx.restore();
  }

  drawBoss(ctx, b) {
    if (b.subType === 'behemoth') {
      // Stratospheric Superfortress
      ctx.fillStyle = '#313947';
      ctx.strokeStyle = '#ff3b30';
      ctx.lineWidth = 2;

      // Fortress fuselage
      ctx.beginPath();
      ctx.moveTo(-110, 0);
      ctx.lineTo(-40, -45);
      ctx.lineTo(120, -65);
      ctx.lineTo(140, 0);
      ctx.lineTo(120, 65);
      ctx.lineTo(-40, 45);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Glowing Reactor Core
      const coreGrad = ctx.createRadialGradient(20, 0, 5, 20, 0, 25);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.4, '#ff3b30');
      coreGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(20, 0, 25, 0, Math.PI * 2);
      ctx.fill();

      // Multi-turrets
      ctx.fillStyle = '#1b1f28';
      [-35, 35].forEach(y => {
        ctx.beginPath();
        ctx.arc(-20, y, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
    } else if (b.subType === 'yamato_carrier') {
      // Aerial Dreadnought Flagship
      ctx.fillStyle = '#28323a';
      ctx.strokeStyle = '#ff9900';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-130, 20);
      ctx.lineTo(-50, -50);
      ctx.lineTo(130, -50);
      ctx.lineTo(150, 40);
      ctx.lineTo(-80, 50);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Bridge Tower
      ctx.fillStyle = '#1c242a';
      ctx.fillRect(40, -85, 35, 35);
      ctx.strokeStyle = '#00ddff';
      ctx.strokeRect(40, -85, 35, 35);
    }
  }

  // --- PROJECTILES, EXPLOSIONS, ITEMS ---

  drawBullet(b) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(b.x, b.y);

    if (b.isPlayer) {
      if (b.subType === 'vulcan') {
        ctx.fillStyle = '#ffea00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 8;
        ctx.fillRect(-8, -2, 16, 4);
      } else if (b.subType === 'missile') {
        // Guided Missile
        ctx.fillStyle = '#e0e6ed';
        ctx.fillRect(-10, -3, 20, 6);
        ctx.fillStyle = '#ff3b30';
        ctx.fillRect(6, -3, 4, 6); // Warhead
        // Smoke exhaust
        this.renderAfterburner(ctx, -10, 0, 0.7);
      } else if (b.subType === 'bomb') {
        // Tactical Nuke shockwave
        ctx.strokeStyle = 'rgba(255, 200, 50, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius || 20, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      // Enemy laser / bullet (Bright red/magenta plasma sphere)
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0033';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawItem(it) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(it.x, it.y);

    // Floating bobbing motion
    const bob = Math.sin(this.time * 6) * 3;
    ctx.translate(0, bob);

    if (it.type === 'fuel') {
      // Jerrycan Fuel Tank
      ctx.fillStyle = '#ff9500';
      ctx.fillRect(-10, -12, 20, 24);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GAS', 0, 4);
    } else if (it.type === 'powder' || it.type === 'vulcan') {
      // Weapon POW Icon
      ctx.fillStyle = '#00ddff';
      ctx.fillRect(-11, -11, 22, 22);
      ctx.fillStyle = '#000';
      ctx.font = '900 10px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('POW', 0, 3);
    } else if (it.type === 'gold') {
      // Gold Bullion Bar
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 10;
      ctx.fillRect(-12, -7, 24, 14);
      ctx.fillStyle = '#806000';
      ctx.font = '900 8px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('$1000', 0, 3);
    }

    ctx.restore();
  }

  drawParticle(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

window.VectorRenderEngine = VectorRenderEngine;
