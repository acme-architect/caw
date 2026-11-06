/**
 * TSK-05: KineticJuiceEngine - Hit-Stop FSM, Camera Shake, & Impact Juice
 * Standard: Lex Superior v3.2.0 (DoF = 0)
 * Invariants: INV-JUICE-01 (Deterministic Freeze, Capped Shake Intensity <= 30px)
 * 
 * VIA NEGATIVA:
 * - No asynchronous setTimeout/setInterval.
 * - All timers advance strictly via deterministic dt passed by FixedTimestepClock.
 */

class KineticJuiceEngine {
  constructor() {
    // Hit-stop freeze timer in seconds (e.g. 0.05s = 3 frames @ 60FPS)
    this.freezeTimer = 0.0;

    // Camera shake physics
    this.shakeIntensity = 0.0;
    this.shakeDecay = 0.88; // Per-frame decay multiplier (settles comfortably within <= 50 frames)
    this.shakeOffsetX = 0.0;
    this.shakeOffsetY = 0.0;
    this.maxShakeIntensity = 30.0; // Hard clamp ceiling (INV-JUICE-01)

    // Flash overlay alpha for explosions / mega bomb
    this.flashAlpha = 0.0;
    this.flashDecay = 8.0; // Decay rate per second
  }

  /**
   * Triggers a hit-stop freeze window.
   * @param {number} duration - Freeze time in seconds (default 0.05s = 3 frames)
   */
  triggerHitStop(duration = 0.05) {
    this.freezeTimer = Math.max(this.freezeTimer, duration);
  }

  /**
   * Adds an impulse to camera screen shake.
   * @param {number} amount - Shake intensity to add
   */
  addShake(amount) {
    this.shakeIntensity = Math.min(this.maxShakeIntensity, this.shakeIntensity + amount);
  }

  /**
   * Triggers a full-screen white/amber blast flash.
   * @param {number} intensity - Initial alpha (0.0 to 1.0)
   */
  triggerFlash(intensity = 0.6) {
    this.flashAlpha = Math.min(1.0, Math.max(this.flashAlpha, intensity));
  }

  /**
   * Updates shake physics, flash decay, and hit-stop countdown.
   * @param {number} dt - Fixed delta time in seconds
   * @returns {boolean} True if the game world is FROZEN (skip world entity updates)
   */
  update(dt) {
    // 1. Update Camera Shake
    if (this.shakeIntensity > 0.05) {
      this.shakeOffsetX = (Math.random() * 2.0 - 1.0) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() * 2.0 - 1.0) * this.shakeIntensity;
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0.0;
      this.shakeOffsetX = 0.0;
      this.shakeOffsetY = 0.0;
    }

    // 2. Update Screen Flash Decay
    if (this.flashAlpha > 0.001) {
      this.flashAlpha = Math.max(0.0, this.flashAlpha - this.flashDecay * dt);
    } else {
      this.flashAlpha = 0.0;
    }

    // 3. Process Hit-Stop Freeze Window
    if (this.freezeTimer > 1e-6) {
      this.freezeTimer -= dt;
      return true; // Simulation frozen for this step
    }

    this.freezeTimer = 0.0;
    return false; // Simulation active
  }

  /**
   * Applies camera shake transform to canvas context.
   * @param {CanvasRenderingContext2D} ctx 
   */
  applyTransform(ctx) {
    ctx.translate(this.shakeOffsetX, this.shakeOffsetY);
  }

  /**
   * Renders the impact flash overlay if active.
   * @param {CanvasRenderingContext2D} ctx 
   * @param {number} width 
   * @param {number} height 
   */
  renderFlashOverlay(ctx, width, height) {
    if (this.flashAlpha > 0.01) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }
}

// Module export & browser registration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KineticJuiceEngine };
} else if (typeof window !== 'undefined') {
  window.KineticJuiceEngine = KineticJuiceEngine;
}
