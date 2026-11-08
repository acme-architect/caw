/**
 * src/hud_overlay.js
 * Carrier Air Wing - Capcom CPS-1 Classic Inventory, Dual Radio Comms & HUD Overlay Module
 * Standard: ACME Lex Superior v3.2.0 (DoF = 0, Zero Runtime Dependency)
 * 
 * Manages:
 * 1. 3+3 Classic Weapon & Ordnance Inventory Slots (Left: Vulcan, Gatling, Laser / Right: Phoenix, Sidewinder, Napalm)
 * 2. Bottom Status Bars: Titanium Shield, Jet Fuel, Megabomb Reserve
 * 3. Dual-Avatar CRT Radio Comms Layer with Typewriter Effect and Web Audio Beeper
 * 4. Mission Vertical Progress Ticker (00:00 -> 05:00 -> 10:00) & Mission Accomplished Toast
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CAWHudOverlay = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Audio Context for Radio Comms Beeper
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playRadioBeep(freq = 880, duration = 0.05) {
    try {
      const actx = getAudioContext();
      if (!actx) return;
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, actx.currentTime);

      gain.gain.setValueAtTime(0.04, actx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + duration);

      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start();
      osc.stop(actx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  class HudOverlay {
    constructor() {
      // Weapon & Ordnance Inventory State (Capcom CPS-1 3+3 Standard)
      this.inventory = {
        leftWeapons: [
          { id: 'vulcan', name: 'M61A1 VULCAN', level: 3, maxLevel: 4, icon: '🔫', active: true },
          { id: 'gatling', name: 'PLASMA GATLING', level: 1, maxLevel: 4, icon: '⚡', active: false },
          { id: 'laser', name: 'PULSE LASER', level: 0, maxLevel: 4, icon: '🔴', active: false }
        ],
        rightOrdnance: [
          { id: 'phoenix', name: 'AIM-54 PHOENIX', count: 4, maxCount: 8, icon: '🚀', active: true },
          { id: 'sidewinder', name: 'AIM-9 SIDEWINDER', count: 8, maxCount: 16, icon: '🎯', active: false },
          { id: 'napalm', name: 'MK-77 NAPALM', count: 2, maxCount: 4, icon: '💣', active: false }
        ],
        shield: 100, // percentage 0 - 100
        fuel: 85,     // percentage 0 - 100
        megabombs: 2  // count
      };

      // Radio Comms State
      this.comms = {
        active: false,
        speaker: 'pilot', // 'pilot' | 'wingman' | 'boss'
        fullText: '',
        displayedText: '',
        charIndex: 0,
        timer: 0,
        duration: 0,
        typewriterSpeed: 2, // characters per frame
        audioTick: 0
      };

      // Mission Progress Ticker
      this.progress = {
        ratio: 0, // 0.0 - 1.0 along stage corridor
        totalLength: 5000,
        bossPos: 2500
      };

      // Mission Achievement Notification Banner
      this.achievement = {
        active: false,
        text: 'MISSION ACCOMPLISHED: AIRSPACE SECURED',
        timer: 0,
        maxTimer: 140 // ~2.3 seconds
      };
    }

    /**
     * Trigger a 4-second radio dialogue test
     */
    triggerRadioDialogue(speaker = 'wingman', message = 'FOX TWO! WATCH YOUR TAIL, ENEMY SQUADRON INBOUND!') {
      this.comms.active = true;
      this.comms.speaker = speaker;
      this.comms.fullText = message;
      this.comms.displayedText = '';
      this.comms.charIndex = 0;
      this.comms.timer = 240; // 4 seconds at 60fps
      this.comms.duration = 240;
      playRadioBeep(720, 0.12);
    }

    /**
     * Trigger Mission Accomplished toast
     */
    triggerAchievement(msg = 'TARGET DESTROYED: BRIDGEWAY SECURED') {
      this.achievement.active = true;
      this.achievement.text = msg;
      this.achievement.timer = this.achievement.maxTimer;
      playRadioBeep(1040, 0.18);
    }

    /**
     * Update animations & timers (called every frame)
     */
    update() {
      // 1. Radio Comms Typewriter Update
      if (this.comms.active) {
        if (this.comms.charIndex < this.comms.fullText.length) {
          this.comms.charIndex += this.comms.typewriterSpeed;
          this.comms.displayedText = this.comms.fullText.substring(0, Math.floor(this.comms.charIndex));

          // Beep on new characters
          this.comms.audioTick++;
          if (this.comms.audioTick % 3 === 0) {
            const freq = this.comms.speaker === 'pilot' ? 920 : 640;
            playRadioBeep(freq, 0.02);
          }
        }

        this.comms.timer--;
        if (this.comms.timer <= 0) {
          this.comms.active = false;
        }
      }

      // 2. Achievement Banner Update
      if (this.achievement.active) {
        this.achievement.timer--;
        if (this.achievement.timer <= 0) {
          this.achievement.active = false;
        }
      }
    }

    /**
     * Render full HUD onto Canvas 2D
     */
    render(ctx, W, H, cameraY, totalLength) {
      this.progress.ratio = Math.max(0, Math.min(1, cameraY / totalLength));

      ctx.save();

      // 1. Capcom Classic Left Weapon Slots (L1, L2, L3)
      this.renderLeftWeaponSlots(ctx, 16, 80);

      // 2. Capcom Classic Right Ordnance Slots (R1, R2, R3)
      this.renderRightOrdnanceSlots(ctx, W - 146, 80);

      // 3. Bottom Central Status Bars (Shield, Fuel, Megabomb)
      this.renderBottomStatusBars(ctx, W, H);

      // 4. Right Edge Stage Vertical Progress Ticker
      this.renderProgressTicker(ctx, W - 20, 80, 240);

      // 5. Dual Radio Comms HUD Layer (if active or idle overlay)
      this.renderRadioComms(ctx, W, H);

      // 6. Achievement Toast Notification Banner (Top Right)
      if (this.achievement.active) {
        this.renderAchievementBanner(ctx, W);
      }

      ctx.restore();
    }

    /**
     * Left 3 Weapon Slots
     */
    renderLeftWeaponSlots(ctx, x, y) {
      const slotW = 124;
      const slotH = 44;
      const gap = 8;

      ctx.save();
      for (let i = 0; i < this.inventory.leftWeapons.length; i++) {
        const wpn = this.inventory.leftWeapons[i];
        const sy = y + i * (slotH + gap);

        // Slot Background
        ctx.fillStyle = wpn.active ? 'rgba(7, 26, 46, 0.88)' : 'rgba(5, 12, 22, 0.75)';
        ctx.strokeStyle = wpn.active ? '#00f3ff' : '#1e3a5f';
        ctx.lineWidth = wpn.active ? 1.5 : 1;
        ctx.fillRect(x, sy, slotW, slotH);
        ctx.strokeRect(x, sy, slotW, slotH);

        // Weapon Icon
        ctx.font = '16px sans-serif';
        ctx.fillText(wpn.icon, x + 8, sy + 28);

        // Weapon Name
        ctx.fillStyle = wpn.active ? '#00f3ff' : '#64748b';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(wpn.name, x + 32, sy + 16);

        // Level Segments Bar (4 segments)
        const barX = x + 32;
        const barY = sy + 24;
        const segW = 18;
        const segH = 8;

        for (let s = 0; s < wpn.maxLevel; s++) {
          const isFilled = s < wpn.level;
          ctx.fillStyle = isFilled ? (wpn.active ? '#00f3ff' : '#0284c7') : '#0b192c';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.fillRect(barX + s * (segW + 2), barY, segW, segH);
          ctx.strokeRect(barX + s * (segW + 2), barY, segW, segH);
        }
      }
      ctx.restore();
    }

    /**
     * Right 3 Ordnance Slots
     */
    renderRightOrdnanceSlots(ctx, x, y) {
      const slotW = 124;
      const slotH = 44;
      const gap = 8;

      ctx.save();
      for (let i = 0; i < this.inventory.rightOrdnance.length; i++) {
        const ord = this.inventory.rightOrdnance[i];
        const sy = y + i * (slotH + gap);

        // Slot Background
        ctx.fillStyle = ord.active ? 'rgba(46, 26, 7, 0.88)' : 'rgba(18, 12, 6, 0.75)';
        ctx.strokeStyle = ord.active ? '#f59e0b' : '#573312';
        ctx.lineWidth = ord.active ? 1.5 : 1;
        ctx.fillRect(x, sy, slotW, slotH);
        ctx.strokeRect(x, sy, slotW, slotH);

        // Icon
        ctx.font = '16px sans-serif';
        ctx.fillText(ord.icon, x + 8, sy + 28);

        // Ordnance Name
        ctx.fillStyle = ord.active ? '#f59e0b' : '#78716c';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(ord.name, x + 32, sy + 16);

        // Ammo Counter (e.g. x04)
        ctx.fillStyle = ord.count > 0 ? '#38bdf8' : '#ef4444';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`x${ord.count.toString().padStart(2, '0')}`, x + 32, sy + 34);

        // Ammo Capacity Indicator Dots
        for (let d = 0; d < 4; d++) {
          ctx.fillStyle = (d < Math.ceil(ord.count / 2)) ? '#f59e0b' : '#292524';
          ctx.beginPath();
          ctx.arc(x + slotW - 12 - d * 8, sy + 28, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    /**
     * Bottom Status Bars (Shield, Fuel, Megabomb Reserve)
     */
    renderBottomStatusBars(ctx, W, H) {
      const barAreaW = 340;
      const startX = (W - barAreaW) / 2;
      const startY = H - 88;

      ctx.save();

      // Background Panel
      ctx.fillStyle = 'rgba(5, 10, 20, 0.85)';
      ctx.strokeStyle = '#0e243a';
      ctx.lineWidth = 1;
      ctx.fillRect(startX - 10, startY - 4, barAreaW + 20, 48);
      ctx.strokeRect(startX - 10, startY - 4, barAreaW + 20, 48);

      // 1. Titanium Shield Bar (Cyan)
      ctx.fillStyle = '#00f3ff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`TITANIUM SHIELD: ${this.inventory.shield}%`, startX, startY + 8);

      const barW = 240;
      ctx.fillStyle = '#091829';
      ctx.fillRect(startX, startY + 12, barW, 8);
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 6;
      ctx.fillRect(startX, startY + 12, (barW * this.inventory.shield) / 100, 8);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#0284c7';
      ctx.strokeRect(startX, startY + 12, barW, 8);

      // 2. Fuel Bar (Amber / Orange)
      ctx.fillStyle = '#f97316';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`JET FUEL: ${this.inventory.fuel}%`, startX, startY + 30);

      ctx.fillStyle = '#1c0f06';
      ctx.fillRect(startX, startY + 34, barW, 6);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(startX, startY + 34, (barW * this.inventory.fuel) / 100, 6);
      ctx.strokeStyle = '#9a3412';
      ctx.strokeRect(startX, startY + 34, barW, 6);

      // 3. Megabomb Reserve Icons (Right of bars)
      const bombX = startX + barW + 16;
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('MEGABOMB', bombX, startY + 10);

      for (let b = 0; b < 3; b++) {
        const isReady = b < this.inventory.megabombs;
        ctx.fillStyle = isReady ? '#ef4444' : '#292524';
        ctx.shadowColor = isReady ? '#ef4444' : 'transparent';
        ctx.shadowBlur = isReady ? 8 : 0;
        ctx.beginPath();
        ctx.arc(bombX + 8 + b * 20, startY + 26, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    /**
     * Vertical Stage Progress Ticker (Right Edge)
     */
    renderProgressTicker(ctx, x, y, height) {
      ctx.save();
      // Vertical Ruler Line
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + height);
      ctx.stroke();

      // Waypoint Ticks
      const milestones = [
        { label: '10:00 (BRIDGE)', r: 1.0, color: '#f43f5e' },
        { label: '05:00 (BOSS)',   r: 0.5, color: '#f59e0b' },
        { label: '00:00 (LAUNCH)', r: 0.0, color: '#10b981' }
      ];

      for (const m of milestones) {
        const my = y + height - m.r * height;
        ctx.strokeStyle = m.color;
        ctx.beginPath();
        ctx.moveTo(x - 5, my);
        ctx.lineTo(x + 5, my);
        ctx.stroke();

        ctx.fillStyle = m.color;
        ctx.font = '8px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(m.label, x - 8, my + 3);
      }

      // Current Aircraft Indicator (Neon Green Triangle sliding up)
      const heroY = y + height - this.progress.ratio * height;
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(x + 2, heroY);
      ctx.lineTo(x + 10, heroY - 5);
      ctx.lineTo(x + 10, heroY + 5);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
    }

    /**
     * Dual Avatar Radio Comms Panel
     */
    renderRadioComms(ctx, W, H) {
      if (!this.comms.active) return;

      const commsW = 620;
      const commsH = 74;
      const commsX = (W - commsW) / 2;
      const commsY = H - 82;

      ctx.save();

      // Main Comms Semi-Transparent Backdrop (%85 Opak)
      ctx.fillStyle = 'rgba(3, 7, 18, 0.88)';
      ctx.strokeStyle = '#00f3ff';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 10;
      ctx.fillRect(commsX, commsY, commsW, commsH);
      ctx.strokeRect(commsX, commsY, commsW, commsH);
      ctx.shadowBlur = 0;

      // 1. Sol Panel: Oyuncu Avatarı (Yeşil CRT Tonlu)
      const isPilotActive = this.comms.speaker === 'pilot';
      ctx.fillStyle = isPilotActive ? '#062d1f' : '#04140e';
      ctx.strokeStyle = isPilotActive ? '#10b981' : '#064e3b';
      ctx.lineWidth = 2;
      ctx.fillRect(commsX + 6, commsY + 6, 62, 62);
      ctx.strokeRect(commsX + 6, commsY + 6, 62, 62);

      // Pilot Avatar Pixel Silhouette (F-14 Pilot Helmet)
      ctx.fillStyle = isPilotActive ? '#34d399' : '#059669';
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👨‍✈️', commsX + 37, commsY + 44);

      // Pilot Name Tag
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('MAVERICK', commsX + 37, commsY + 64);

      // 2. Sağ Panel: Wingman / Autopilot Avatarı (Mavi/Kırmızı CRT)
      const isWingmanActive = this.comms.speaker !== 'pilot';
      ctx.fillStyle = isWingmanActive ? '#0c2444' : '#061324';
      ctx.strokeStyle = isWingmanActive ? '#38bdf8' : '#0c4a6e';
      ctx.lineWidth = 2;
      ctx.fillRect(commsX + commsW - 68, commsY + 6, 62, 62);
      ctx.strokeRect(commsX + commsW - 68, commsY + 6, 62, 62);

      // Wingman Avatar
      ctx.fillStyle = isWingmanActive ? '#38bdf8' : '#0284c7';
      ctx.font = '28px sans-serif';
      ctx.fillText('🤖', commsX + commsW - 37, commsY + 44);

      // Wingman Name Tag
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('AI-COPILOT', commsX + commsW - 37, commsY + 64);

      // 3. Orta Alan: Typewriter Metin Kutusu
      ctx.textAlign = 'left';
      const textX = commsX + 78;
      const textY = commsY + 22;

      // Header Tag
      ctx.fillStyle = isPilotActive ? '#10b981' : '#38bdf8';
      ctx.font = 'bold 10px monospace';
      const speakerTitle = isPilotActive ? '► [TAC-COM] MAVERICK (LEADER):' : '► [TAC-COM] GOOSE / COPILOT:';
      ctx.fillText(speakerTitle, textX, textY);

      // Typewriter Body Text
      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px monospace';

      // Simple word wrapping
      const maxTextW = commsW - 160;
      const words = this.comms.displayedText.split(' ');
      let line = '';
      let lineY = textY + 18;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxTextW && n > 0) {
          ctx.fillText(line, textX, lineY);
          line = words[n] + ' ';
          lineY += 15;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, textX, lineY);

      // Radio Signal Scanlines
      ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
      for (let l = commsY + 4; l < commsY + commsH - 4; l += 4) {
        ctx.beginPath();
        ctx.moveTo(textX, l);
        ctx.lineTo(commsX + commsW - 74, l);
        ctx.stroke();
      }

      ctx.restore();
    }

    /**
     * Achievement Banner (Slide down from top right)
     */
    renderAchievementBanner(ctx, W) {
      const bannerW = 320;
      const bannerH = 38;
      const bannerX = W - bannerW - 20;
      const bannerY = 44;

      ctx.save();
      ctx.fillStyle = 'rgba(6, 44, 28, 0.92)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 12;
      ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
      ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);
      ctx.shadowBlur = 0;

      // Icon & Text
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('★ TARGET ACCOMPLISHED', bannerX + 12, bannerY + 16);

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.fillText(this.achievement.text, bannerX + 12, bannerY + 30);

      ctx.restore();
    }
  }

  return HudOverlay;
}));
