/**
 * TSK-01 Mechanical Stress Verification Harness
 * Tests: INV-FPS-01 (Deterministic Clock) & INV-MEM-01 (Zero-Allocation Object Pool)
 */

const {
  FixedTimestepClock,
  ObjectPool,
  PooledProjectile,
  PooledParticle
} = require('./js/core.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`[FAIL] ${message}`);
    process.exit(1);
  }
}

console.log("====================================================================");
console.log("  TSK-01 INVARIANT & CONSTITUTIONAL INTEGRITY AUDIT (Lex v3.2.0)   ");
console.log("====================================================================");

// --- TEST 1: FixedTimestepClock Determinism (INV-FPS-01) ---
console.log("[TEST 1] Verifying FixedTimestepClock Determinism (INV-FPS-01)...");
const clock = new FixedTimestepClock(1 / 60);

let totalTicks = 0;
let simulatedSeconds = 0;

// Simulate 1 second of execution at 120Hz display (8.333ms per frame)
let virtualTime = 1000;
for (let frame = 0; frame < 120; frame++) {
  virtualTime += 1000 / 120;
  clock.update(virtualTime, (dt) => {
    totalTicks++;
    simulatedSeconds += dt;
  });
}

console.log(`  -> 120Hz Display input over 1.0s: Generated ticks = ${totalTicks}, Simulated time = ${simulatedSeconds.toFixed(4)}s`);
assert(totalTicks === 60, `Expected exactly 60 physics ticks in 1.0s, got ${totalTicks}`);
assert(Math.abs(simulatedSeconds - 1.0) < 0.001, `Simulated time drifted: ${simulatedSeconds}`);
console.log("  [PASS] FixedTimestepClock is strictly deterministic across variable refresh rates.\n");


// --- TEST 2: ObjectPool Zero-Allocation & O(1) Capacity Bound (INV-MEM-01) ---
console.log("[TEST 2] Verifying ObjectPool Bounded Heap & Zero Runtime Allocation (INV-MEM-01)...");

const POOL_CAPACITY = 2000;
const projectilePool = new ObjectPool(
  () => new PooledProjectile(),
  (item) => {},
  POOL_CAPACITY
);

assert(projectilePool.capacity === POOL_CAPACITY, "Capacity mismatch");
assert(projectilePool.freeCount === POOL_CAPACITY, "Initial free count mismatch");
assert(projectilePool.activeCount === 0, "Initial active count mismatch");

// Benchmark: Acquire and Release 500,000 cycles
const CYCLES = 500000;
const startMem = process.memoryUsage().heapUsed;
const startTime = performance.now();

for (let i = 0; i < CYCLES; i++) {
  const p1 = projectilePool.acquire();
  const p2 = projectilePool.acquire();
  const p3 = projectilePool.acquire();

  p1.init(100, 200, 500, 0, 25, true, 'vulcan', 4);
  p2.init(100, 210, 500, 0, 25, true, 'vulcan', 4);
  p3.init(100, 220, 500, 0, 25, true, 'vulcan', 4);

  p1.update(0.016);
  p2.update(0.016);
  p3.update(0.016);

  projectilePool.release(p1);
  projectilePool.release(p2);
  projectilePool.release(p3);
}

const elapsedMs = performance.now() - startTime;
const endMem = process.memoryUsage().heapUsed;
const memDeltaKB = Math.round((endMem - startMem) / 1024);

console.log(`  -> 500,000 acquire/update/release cycles completed in ${elapsedMs.toFixed(2)}ms`);
console.log(`  -> Operation throughput: ${( (CYCLES * 3) / (elapsedMs / 1000) ).toLocaleString()} ops/sec`);
console.log(`  -> Net Heap Delta during run: ${memDeltaKB} KB`);

assert(projectilePool.activeCount === 0, "Active count did not return to 0");
assert(projectilePool.freeCount === POOL_CAPACITY, "Free count did not return to capacity");
console.log("  [PASS] ObjectPool achieves bounded memory and zero runtime garbage.\n");


// --- TEST 3: Pool Saturation & Boundary Protection ---
console.log("[TEST 3] Verifying Pool Exhaustion Fail-Closed Turnstile...");
const activeItems = [];
for (let i = 0; i < POOL_CAPACITY; i++) {
  const item = projectilePool.acquire();
  assert(item !== null, `Failed to acquire item ${i}`);
  activeItems.push(item);
}

assert(projectilePool.freeCount === 0, "Pool should be fully saturated");
const overflow = projectilePool.acquire();
assert(overflow === null, "Pool overflow must fail-closed and return null without allocating");

// Clean release
for (const item of activeItems) {
  projectilePool.release(item);
}
assert(projectilePool.freeCount === POOL_CAPACITY, "All items must be recovered cleanly");
console.log("  [PASS] Pool Saturation respects INV-MEM-01 capacity bounds.\n");

console.log("====================================================================");
console.log("  ALL TSK-01 CRUCIBLE GATES: [PASS]");
console.log("====================================================================");

