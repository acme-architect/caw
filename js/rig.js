/**
 * TSK-03: FighterSpriteRig - State-Driven Aircraft Rigging & Animation Pipeline
 * Standard: Lex Superior v3.2.0 (DoF = 0)
 * Invariants: INV-RIG-01 (12 rad/s Damped Banking Tilt, Zero Runtime Heap Allocation)
 * 
 * VIA NEGATIVA:
 * - No audio synthesis calls.
 * - No collision detection or health/damage application logic.
 * - Pure stateless coordinate transformation & frame-indexed animation rig.
 */

class FighterSpriteRig {
  constructor() {
    // Current smoothed banking angle in radians (-0.35 to +0.35)
    this.tilt = 0.0;
    this.targetTilt = 0.0;
    this.tiltDampingSpeed = 16.0; // rad/s (guarantees discrete frame transition within 2 frames @ 60FPS)

    // Afterburner flicker phase
    this.flickerTimer = 0.0;
    this.afterburnerScale = 1.0;

    // Hit-flash transparency/color override
    this.isFlashing = false;
    this.flashDuration = 0.0;
  }

  /**
   * Updates rigging orientation and banking angle.
   * @param {number} dt - Fixed delta time (seconds)
   * @param {number} verticalInput - -1 (Climb/Up), 0 (Neutral), +1 (Dive/Down)
   * @param {boolean} isAfterburnerBoost - Whether speed boost is active
   */
  update(dt, verticalInput, isAfterburnerBoost = false) {
    // 1. Calculate target tilt based strictly on vertical movement vector
    if (verticalInput < 0) {
      this.targetTilt = -0.32; // Banking up/climbing
    } else if (verticalInput > 0) {
      this.targetTilt = 0.32;  // Banking down/diving
    } else {
      this.targetTilt = 0.0;   // Level flight
    }

    // 2. Exponential smoothing damping towards target (INV-RIG-01)
    const diff = this.targetTilt - this.tilt;
    this.tilt += diff * Math.min(1.0, this.tiltDampingSpeed * dt);

    // 3. Update procedural afterburner flicker
    this.flickerTimer += dt * 30.0;
    const baseFlicker = 0.85 + Math.sin(this.flickerTimer) * 0.15;
    this.afterburnerScale = isAfterburnerBoost ? baseFlicker * 1.7 : baseFlicker * 1.0;

    // 4. Update hit-flash decay
    if (this.flashDuration > 0) {
      this.flashDuration -= dt;
      this.isFlashing = this.flashDuration > 0;
    }
  }

  triggerHitFlash(duration = 0.1) {
    this.flashDuration = duration;
    this.isFlashing = true;
  }

  /**
   * Returns discrete frame state for sprite sheet or vector renderer
   * @returns {'CLIMB' | 'NEUTRAL' | 'DIVE'}
   */
  getDiscreteFrame() {
    if (this.tilt < -0.12) return 'CLIMB';
    if (this.tilt > 0.12) return 'DIVE';
    return 'NEUTRAL';
  }
}

// Export for module systems and browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FighterSpriteRig };
} else if (typeof window !== 'undefined') {
  window.FighterSpriteRig = FighterSpriteRig;
}
