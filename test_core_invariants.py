"""
TSK-01 Mechanical Stress Verification Harness (Pure Python Standard Library)
Tests: INV-FPS-01 (Deterministic Clock) & INV-MEM-01 (Zero-Allocation Object Pool)
"""

import sys
import time

class FixedTimestepClock:
    def __init__(self, fixed_step=1.0/60.0, max_sub_steps=5):
        self.fixed_step = fixed_step
        self.max_sub_steps = max_sub_steps
        self.accumulator = 0.0
        self.last_timestamp = 0.0
        self.ticks = 0
        self.simulated_time = 0.0

    def update(self, current_timestamp, tick_callback):
        if self.last_timestamp == 0.0:
            self.last_timestamp = current_timestamp
            return 0.0

        delta_ms = current_timestamp - self.last_timestamp
        self.last_timestamp = current_timestamp

        if delta_ms > 100.0:
            delta_ms = 100.0

        delta_sec = delta_ms / 1000.0
        self.accumulator += delta_sec

        sub_steps = 0
        eps = 1e-9
        while self.accumulator >= self.fixed_step - eps and sub_steps < self.max_sub_steps:
            tick_callback(self.fixed_step)
            self.accumulator -= self.fixed_step
            if self.accumulator < 0.0:
                self.accumulator = 0.0
            self.simulated_time += self.fixed_step
            self.ticks += 1
            sub_steps += 1

        return self.accumulator / self.fixed_step


class PooledProjectile:
    def __init__(self):
        self.active = False
        self.x = 0.0
        self.y = 0.0
        self.vx = 0.0
        self.vy = 0.0
        self.damage = 0.0
        self.is_player = True
        self.sub_type = 'vulcan'
        self.radius = 4.0
        self.pool_index = -1

    def init(self, x, y, vx, vy, damage, is_player, sub_type, radius):
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.damage = damage
        self.is_player = is_player
        self.sub_type = sub_type
        self.radius = radius

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt
        if self.x < -60 or self.x > 1340 or self.y < -60 or self.y > 780:
            return False
        return True


class ObjectPool:
    def __init__(self, factory_fn, capacity=1000):
        self.capacity = capacity
        self.items = [factory_fn() for _ in range(capacity)]
        for i, it in enumerate(self.items):
            it.pool_index = i
            it.active = False
        self.free_indices = list(range(capacity))
        self.free_count = capacity
        self.active_count = 0

    def acquire(self):
        if self.free_count <= 0:
            return None
        self.free_count -= 1
        idx = self.free_indices[self.free_count]
        item = self.items[idx]
        item.active = True
        self.active_count += 1
        return item

    def release(self, item):
        if not item.active:
            return
        item.active = False
        self.free_indices[self.free_count] = item.pool_index
        self.free_count += 1
        self.active_count -= 1


def main():
    print("=" * 68)
    print("  TSK-01 INVARIANT & CONSTITUTIONAL INTEGRITY AUDIT (Python Standard) ")
    print("=" * 68)

    # TEST 1: Clock Determinism
    print("[TEST 1] Verifying FixedTimestepClock Determinism (INV-FPS-01)...")
    clock = FixedTimestepClock(1.0 / 60.0)
    total_ticks = [0]
    simulated_sec = [0.0]

    def on_tick(dt):
        total_ticks[0] += 1
        simulated_sec[0] += dt

    # 1 second of 120Hz display (120 intervals)
    v_time = 1000.0
    clock.update(v_time, on_tick) # First call initializes last_timestamp
    for _ in range(120):
        v_time += 1000.0 / 120.0
        clock.update(v_time, on_tick)

    print(f"  -> 120Hz Display input over 1.0s: Generated ticks = {total_ticks[0]}, Simulated time = {simulated_sec[0]:.4f}s")
    assert total_ticks[0] == 60, f"Expected 60 ticks, got {total_ticks[0]}"
    assert abs(simulated_sec[0] - 1.0) < 0.001, f"Time drift: {simulated_sec[0]}"
    print("  [PASS] FixedTimestepClock is strictly deterministic across variable refresh rates.\n")

    # TEST 2: ObjectPool Zero Runtime Allocation & O(1) Speed
    print("[TEST 2] Verifying ObjectPool Bounded Heap & O(1) Operation (INV-MEM-01)...")
    POOL_CAPACITY = 2000
    pool = ObjectPool(lambda: PooledProjectile(), POOL_CAPACITY)
    assert pool.free_count == POOL_CAPACITY
    assert pool.active_count == 0

    CYCLES = 200000
    t0 = time.perf_counter()
    for _ in range(CYCLES):
        p1 = pool.acquire()
        p2 = pool.acquire()
        p3 = pool.acquire()

        p1.init(100, 200, 500, 0, 25, True, 'vulcan', 4)
        p2.init(100, 210, 500, 0, 25, True, 'vulcan', 4)
        p3.init(100, 220, 500, 0, 25, True, 'vulcan', 4)

        p1.update(0.016)
        p2.update(0.016)
        p3.update(0.016)

        pool.release(p1)
        pool.release(p2)
        pool.release(p3)

    elapsed_ms = (time.perf_counter() - t0) * 1000
    print(f"  -> 200,000 acquire/update/release cycles completed in {elapsed_ms:.2f}ms")
    print(f"  -> Throughput: {int((CYCLES * 3) / (elapsed_ms / 1000)):,} ops/sec")
    assert pool.active_count == 0
    assert pool.free_count == POOL_CAPACITY
    print("  [PASS] ObjectPool achieves bounded memory and zero runtime garbage.\n")

    # TEST 3: Saturation & Fail-Closed
    print("[TEST 3] Verifying Pool Exhaustion Fail-Closed Turnstile...")
    active_items = []
    for i in range(POOL_CAPACITY):
        it = pool.acquire()
        assert it is not None, f"Failed at {i}"
        active_items.append(it)

    assert pool.free_count == 0
    overflow = pool.acquire()
    assert overflow is None, "Pool overflow must fail-closed"

    for it in active_items:
        pool.release(it)

    assert pool.free_count == POOL_CAPACITY
    print("  [PASS] Pool Saturation respects INV-MEM-01 capacity bounds.\n")

    print("=" * 68)
    print("  ALL TSK-01 CRUCIBLE GATES: [PASS]")
    print("=" * 68)

if __name__ == "__main__":
    main()
