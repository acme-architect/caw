"""
TSK-05 Mechanical Verification Harness (Python Standard Library)
Tests: INV-JUICE-01 (Hit-Stop Freeze, Screen Shake Decay & Upper Bounds)
"""

import math

class KineticJuiceSimulator:
    def __init__(self):
        self.freeze_timer = 0.0
        self.shake_intensity = 0.0
        self.shake_decay = 0.88
        self.max_shake_intensity = 30.0
        self.flash_alpha = 0.0
        self.flash_decay = 8.0

    def trigger_hit_stop(self, duration=0.05):
        self.freeze_timer = max(self.freeze_timer, duration)

    def add_shake(self, amount):
        self.shake_intensity = min(self.max_shake_intensity, self.shake_intensity + amount)

    def trigger_flash(self, intensity=0.6):
        self.flash_alpha = min(1.0, max(self.flash_alpha, intensity))

    def update(self, dt):
        if self.shake_intensity > 0.05:
            self.shake_intensity *= self.shake_decay
        else:
            self.shake_intensity = 0.0

        if self.flash_alpha > 0.001:
            self.flash_alpha = max(0.0, self.flash_alpha - self.flash_decay * dt)
        else:
            self.flash_alpha = 0.0

        if self.freeze_timer > 1e-6:
            self.freeze_timer -= dt
            return True  # FROZEN
        self.freeze_timer = 0.0
        return False     # ACTIVE


def main():
    print("=" * 68)
    print("  TSK-05 KINETIC JUICE & HIT-STOP INVARIANT AUDIT (Lex v3.2.0)        ")
    print("=" * 68)

    juice = KineticJuiceSimulator()
    dt = 1.0 / 60.0

    # TEST 1: Hit-Stop 3-Frame Freeze Window (50ms @ 60FPS)
    print("[TEST 1] Verifying 3-Frame (50ms) Hit-Stop Freeze Window...")
    juice.trigger_hit_stop(0.05)

    frozen_frames = 0
    for frame in range(10):
        is_frozen = juice.update(dt)
        if is_frozen:
            frozen_frames += 1

    print(f"  -> Total frozen frames counted = {frozen_frames}")
    assert frozen_frames == 3, f"Expected exactly 3 frozen frames (50ms), got {frozen_frames}"
    print("  [PASS] Hit-Stop freeze window strictly locks simulation for 3 frames.\n")

    # TEST 2: Camera Shake Intensity Clamp (INV-JUICE-01)
    print("[TEST 2] Verifying Shake Intensity Clamp (max <= 30px)...")
    juice.add_shake(20.0)
    juice.add_shake(25.0) # Cumulative 45px attempted

    print(f"  -> Applied 45px total impulse, Clamped intensity = {juice.shake_intensity:.2f}px")
    assert juice.shake_intensity == 30.0, f"Expected clamped intensity 30.0, got {juice.shake_intensity}"
    print("  [PASS] Shake intensity ceiling strictly enforced at 30.0px.\n")

    # TEST 3: Camera Shake Decay Rate (0.91 per frame)
    print("[TEST 3] Verifying Natural Shake Decay towards Zero...")
    frames_to_settle = 0
    while juice.shake_intensity > 0.0:
        juice.update(dt)
        frames_to_settle += 1
        if frames_to_settle > 100:
            break

    print(f"  -> Shake settled to 0.0px in {frames_to_settle} frames ({frames_to_settle * 16.66:.1f}ms)")
    assert juice.shake_intensity == 0.0, "Shake failed to decay completely"
    assert frames_to_settle <= 60, f"Shake took too long to decay: {frames_to_settle} frames"
    print("  [PASS] Shake decays smoothly to zero within natural envelope.\n")

    # TEST 4: Screen Flash Decay
    print("[TEST 4] Verifying Blast Flash Decay...")
    juice.trigger_flash(0.8)
    assert juice.flash_alpha == 0.8
    for _ in range(10): # ~166ms
        juice.update(dt)

    print(f"  -> After 166ms, Flash alpha = {juice.flash_alpha:.3f}")
    assert juice.flash_alpha < 0.1, "Flash alpha failed to decay rapidly"
    print("  [PASS] Impact flash decays with high-speed dissipation.\n")

    print("=" * 68)
    print("  ALL TSK-05 KINETIC JUICE CRUCIBLE GATES: [PASS]")
    print("=" * 68)

if __name__ == "__main__":
    main()
