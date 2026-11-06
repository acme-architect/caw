/**
 * TSK-02: ParallaxViewportEngine - 4-Layer Viewport & Spatial Grid System
 * Standard: Lex Superior v3.2.0 (DoF = 0)
 * Invariants: INV-VIEW-01 (Continuous Modulo Scrolling, Zero Jitter, Zero Heap GC)
 * 
 * VIA NEGATIVA:
 * - No game logic, collision detection or enemy AI in this module.
 * - No external asset loading; pure high-performance Canvas2D gradient & procedural strata.
 */

class ParallaxViewportEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    // Viewport Virtual Camera Bounds
    this.camera = {
      x: 0,
      y: 0,
      scrollSpeed: 240, // Base pixels per second
      shakeX: 0,
      shakeY: 0
    };

    // 4 Distinct Parallax Layers with strict velocity scaling & modulo tiling
    // Layer 0: Celestial / Deep Atmospheric Sky (0.0x static gradient)
    // Layer 1: High Stratosphere Cirrus Cloud Ceiling (0.15x speed)
    // Layer 2: Horizon Mountain Ridges & Distant Terrain (0.40x speed)
    // Layer 3: Dynamic Ocean Swells / Canyon Floor Strata (1.80x speed)
    this.layers = [
      { id: 'sky', speedMultiplier: 0.0, offset: 0 },
      { id: 'clouds', speedMultiplier: 0.15, offset: 0, tileWidth: 320 },
      { id: 'mountains', speedMultiplier: 0.40, offset: 0, tileWidth: 600 },
      { id: 'surface', speedMultiplier: 1.80, offset: 0, tileWidth: 200 }
    ];

    // Pre-computed canvas gradients to eliminate per-frame heap allocations (INV-MEM-01)
    this.cachedSkyOcean = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.65);
    this.cachedSkyOcean.addColorStop(0, '#06162a');
    this.cachedSkyOcean.addColorStop(0.5, '#133966');
    this.cachedSkyOcean.addColorStop(1, '#568cb9');

    this.cachedOceanWater = this.ctx.createLinearGradient(0, this.height * 0.65, 0, this.height);
    this.cachedOceanWater.addColorStop(0, '#10395c');
    this.cachedOceanWater.addColorStop(0.3, '#0b2640');
    this.cachedOceanWater.addColorStop(1, '#04121e');

    this.cachedSkyDesert = this.ctx.createLinearGradient(0, 0, 0, this.height * 0.55);
    this.cachedSkyDesert.addColorStop(0, '#1a0e05');
    this.cachedSkyDesert.addColorStop(0.5, '#4a2810');
    this.cachedSkyDesert.addColorStop(1, '#a66838');

    this.cachedDesertFloor = this.ctx.createLinearGradient(0, this.height * 0.55, 0, this.height);
    this.cachedDesertFloor.addColorStop(0, '#542d17');
    this.cachedDesertFloor.addColorStop(0.4, '#381e0e');
    this.cachedDesertFloor.addColorStop(1, '#1b0e06');
  }

  /**
   * Advances camera scrolling by fixed delta timestep.
   * Modulo arithmetic ensures offset never overflows float precision boundaries.
   * @param {number} dt - Fixed delta seconds (1/60)
   */
  update(dt) {
    const baseDistance = this.camera.scrollSpeed * dt;
    this.camera.x += baseDistance;

    // Keep camera.x within safe float cycle limit (1,000,000 px)
    if (this.camera.x > 1000000) {
      this.camera.x -= 1000000;
    }

    // Update layer offsets via exact modulo wrap-around
    for (let i = 0; i < this.layers.length; i++) {
      const l = this.layers[i];
      if (l.speedMultiplier > 0) {
        l.offset = (this.camera.x * l.speedMultiplier) % (l.tileWidth || this.width);
      }
    }
  }

  /**
   * Renders the 4 parallax layers with zero GC allocations.
   * @param {string} theme - 'ocean' or 'desert'
   * @param {number} shakeX - Camera screen shake X
   * @param {number} shakeY - Camera screen shake Y
   */
  render(theme = 'ocean', shakeX = 0, shakeY = 0) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (theme === 'ocean') {
      this.renderOceanTheme(ctx, w, h);
    } else {
      this.renderDesertTheme(ctx, w, h);
    }

    ctx.restore();
  }

  renderOceanTheme(ctx, w, h) {
    // Layer 0: Sky Gradient
    ctx.fillStyle = this.cachedSkyOcean;
    ctx.fillRect(0, 0, w, h * 0.65);

    // Layer 1: High Stratosphere Clouds (0.15x)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    const cloudOff = this.layers[1].offset;
    for (let x = -cloudOff; x < w + 320; x += 320) {
      ctx.beginPath();
      ctx.ellipse(x + 110, 65, 110, 25, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Layer 2: Horizon Mountain / Island Silhouettes (0.40x)
    ctx.fillStyle = '#0f2638';
    const mountOff = this.layers[2].offset;
    ctx.beginPath();
    ctx.moveTo(-mountOff, h * 0.65);
    for (let x = -mountOff; x < w + 600; x += 150) {
      ctx.lineTo(x + 75, h * 0.65 - 35 - Math.sin((x + mountOff) * 0.02) * 20);
      ctx.lineTo(x + 150, h * 0.65);
    }
    ctx.fill();

    // Layer 3: Dynamic Ocean Surface (1.80x)
    ctx.fillStyle = this.cachedOceanWater;
    ctx.fillRect(0, h * 0.65, w, h * 0.35);

    // Dynamic wave ripples
    ctx.strokeStyle = 'rgba(0, 221, 255, 0.22)';
    ctx.lineWidth = 1.5;
    const waveOff = this.layers[3].offset;
    for (let y = h * 0.67; y < h; y += 18) {
      const rowSpeed = 1.0 + (y - h * 0.67) / (h * 0.33);
      const rowOffset = (this.camera.x * rowSpeed) % 240;
      ctx.beginPath();
      for (let x = -rowOffset; x < w + 240; x += 80) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 38, y);
      }
      ctx.stroke();
    }
  }

  renderDesertTheme(ctx, w, h) {
    // Layer 0: Desert Sunset Sky
    ctx.fillStyle = this.cachedSkyDesert;
    ctx.fillRect(0, 0, w, h * 0.55);

    // Layer 1: High Atmosphere Dust Clouds (0.15x)
    ctx.fillStyle = 'rgba(255, 200, 150, 0.08)';
    const dustOff = this.layers[1].offset;
    for (let x = -dustOff; x < w + 320; x += 320) {
      ctx.fillRect(x, 40, 220, 20);
    }

    // Layer 2: Mesa Canyon Silhouettes (0.40x)
    ctx.fillStyle = '#3a1f10';
    const mesaOff = this.layers[2].offset;
    for (let x = -mesaOff; x < w + 600; x += 300) {
      ctx.fillRect(x, h * 0.55 - 75, 170, 75);
    }

    // Layer 3: Rocky Canyon Floor (1.80x)
    ctx.fillStyle = this.cachedDesertFloor;
    ctx.fillRect(0, h * 0.55, w, h * 0.45);

    ctx.strokeStyle = 'rgba(230, 140, 70, 0.25)';
    ctx.lineWidth = 2;
    for (let y = h * 0.58; y < h; y += 22) {
      const rowSpeed = 1.2 + (y - h * 0.58) / (h * 0.42);
      const rowOff = (this.camera.x * rowSpeed) % 260;
      ctx.beginPath();
      for (let x = -rowOff; x < w + 260; x += 110) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + 60, y);
      }
      ctx.stroke();
    }
  }
}

// Export for module systems and browser window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ParallaxViewportEngine };
} else if (typeof window !== 'undefined') {
  window.ParallaxViewportEngine = ParallaxViewportEngine;
}
