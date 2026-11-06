/**
 * TSK-01: Engine Core - Deterministic Clock & Zero-Allocation Object Pools
 * Standard: Lex Superior v3.2.0 (DoF = 0)
 * Invariants: INV-FPS-01 (16.666ms Accumulator), INV-MEM-01 (Zero-GC Allocation)
 * 
 * VIA NEGATIVA: No Canvas rendering, No DOM mutation, No WebAudio, No external libraries.
 */

/**
 * Deterministic Fixed-Timestep Simulation Clock
 * Solves monitor refresh variance (60Hz, 120Hz, 144Hz) using fixed delta-accumulator.
 */
class FixedTimestepClock {
  constructor(fixedStep = 1 / 60, maxSubSteps = 5) {
    this.fixedStep = fixedStep; // 0.016666... s (60 Hz)
    this.maxSubSteps = maxSubSteps;
    this.accumulator = 0;
    this.lastTimestamp = 0;
    this.ticks = 0;
    this.simulatedTime = 0;
  }

  reset(timestamp = 0) {
    this.lastTimestamp = timestamp;
    this.accumulator = 0;
    this.ticks = 0;
    this.simulatedTime = 0;
  }

  /**
   * Advances the clock and invokes the tickCallback strictly for each fixed step.
   * @param {number} currentTimestamp - Milliseconds (from performance.now())
   * @param {function(number)} tickCallback - Receives fixed delta step in seconds
   * @returns {number} The interpolation alpha (0.0 to 1.0) for smooth visual interpolation
   */
  update(currentTimestamp, tickCallback) {
    if (this.lastTimestamp === 0) {
      this.lastTimestamp = currentTimestamp;
      return 0;
    }

    let deltaMs = currentTimestamp - this.lastTimestamp;
    this.lastTimestamp = currentTimestamp;

    // Guard against background tab freezing spiral-of-death (cap at 100ms)
    if (deltaMs > 100) {
      deltaMs = 100;
    }

    const deltaSec = deltaMs / 1000;
    this.accumulator += deltaSec;

    const EPSILON = 1e-9;
    let subSteps = 0;
    while (this.accumulator >= this.fixedStep - EPSILON && subSteps < this.maxSubSteps) {
      tickCallback(this.fixedStep);
      this.accumulator -= this.fixedStep;
      if (this.accumulator < 0) this.accumulator = 0;
      this.simulatedTime += this.fixedStep;
      this.ticks++;
      subSteps++;
    }

    // Return interpolation factor for renderer
    return this.accumulator / this.fixedStep;
  }
}

/**
 * Zero-Allocation Static Object Pool
 * All items are pre-allocated during instancing.
 * Zero array expansion, zero runtime allocation, O(1) acquire and release.
 */
class ObjectPool {
  /**
   * @param {function(): Object} factoryFn - Instantiates one reusable item
   * @param {function(Object): void} resetFn - Resets state on acquire
   * @param {number} capacity - Fixed pre-allocated slot count
   */
  constructor(factoryFn, resetFn, capacity = 1000) {
    this.capacity = capacity;
    this.resetFn = resetFn;

    // Pre-allocate contiguous array
    this.items = new Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.items[i] = factoryFn();
      this.items[i].__poolIndex = i;
      this.items[i].active = false;
    }

    // Int32Array stack tracking free slot indices
    this.freeIndices = new Int32Array(capacity);
    for (let i = 0; i < capacity; i++) {
      this.freeIndices[i] = i;
    }
    this.freeCount = capacity;
    this.activeCount = 0;
  }

  /**
   * Acquires a pooled item.
   * @returns {Object|null} The acquired item, or null if pool exhausted
   */
  acquire() {
    if (this.freeCount <= 0) {
      return null; // Pool full, strictly bounded (INV-MEM-01)
    }

    this.freeCount--;
    const idx = this.freeIndices[this.freeCount];
    const item = this.items[idx];
    item.active = true;
    this.activeCount++;

    if (this.resetFn) {
      this.resetFn(item);
    }

    return item;
  }

  /**
   * Releases an item back into the free stack in O(1).
   * @param {Object} item 
   */
  release(item) {
    if (!item.active) return; // Prevent double release

    item.active = false;
    this.freeIndices[this.freeCount] = item.__poolIndex;
    this.freeCount++;
    this.activeCount--;
  }

  /**
   * Iterates through all active items without generating garbage.
   * @param {function(Object): void} callback 
   */
  forEachActive(callback) {
    for (let i = 0; i < this.capacity; i++) {
      const item = this.items[i];
      if (item.active) {
        callback(item);
      }
    }
  }

  clear() {
    for (let i = 0; i < this.capacity; i++) {
      this.items[i].active = false;
      this.freeIndices[i] = i;
    }
    this.freeCount = this.capacity;
    this.activeCount = 0;
  }
}

/**
 * Pre-allocated Entity Definitions for Pools (Data-Oriented Structs)
 */

class PooledProjectile {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.damage = 0;
    this.isPlayer = true;
    this.subType = 'vulcan'; // 'vulcan', 'missile', 'bomb'
    this.radius = 4;
    this.__poolIndex = -1;
  }

  init(x, y, vx, vy, damage, isPlayer, subType, radius) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.damage = damage;
    this.isPlayer = isPlayer;
    this.subType = subType;
    this.radius = radius;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    // Bounds check
    if (this.x < -60 || this.x > 1340 || this.y < -60 || this.y > 780) {
      return false; // Request release
    }
    return true;
  }
}

class PooledParticle {
  constructor() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.color = '#fff';
    this.size = 2;
    this.life = 0;
    this.maxLife = 1;
    this.alpha = 1.0;
    this.__poolIndex = -1;
  }

  init(x, y, vx, vy, color, size, life) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
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
    if (this.life <= 0) {
      return false; // Request release
    }
    this.alpha = this.life / this.maxLife;
    return true;
  }
}

// Export for both Node.js (test harness) and Browser ES/Window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FixedTimestepClock,
    ObjectPool,
    PooledProjectile,
    PooledParticle
  };
} else if (typeof window !== 'undefined') {
  window.FixedTimestepClock = FixedTimestepClock;
  window.ObjectPool = ObjectPool;
  window.PooledProjectile = PooledProjectile;
  window.PooledParticle = PooledParticle;
}
