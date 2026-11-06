"""
TSK-03 Mechanical Stress & Invariant Verification Harness (Python Standard Library)
Tests: INV-RIG-01 (Damped Banking Response & Discrete Frame Mapping)
"""

import math

class FighterSpriteRig:
    def __init__(self):
        self.tilt = 0.0
        self.target_tilt = 0.0
        self.tilt_damping_speed = 16.0
        self.flicker_timer = 0.0
        self.afterburner_scale = 1.0
        self.flash_duration = 0.0
        self.is_flashing = False

    def update(self, dt, vertical_input, is_boost=False):
        if vertical_input < 0:
            self.target_tilt = -0.32
        elif vertical_input > 0:
            self.target_tilt = 0.32
        else:
            self.target_tilt = 0.0

        diff = self.target_tilt - self.tilt
        self.tilt += diff * min(1.0, self.tilt_damping_speed * dt)

        self.flicker_timer += dt * 30.0
        base_flicker = 0.85 + math.sin(self.flicker_timer) * 0.15
        self.afterburner_scale = base_flicker * (1.7 if is_boost else 1.0)

        if self.flash_duration > 0:
            self.flash_duration -= dt
            self.is_flashing = self.flash_duration > 0

    def trigger_hit_flash(self, duration=0.1):
        self.flash_duration = duration
        self.is_flashing = True

    def get_discrete_frame(self):
        if self.tilt < -0.12:
            return 'CLIMB'
        if self.tilt > 0.12:
            return 'DIVE'
        return 'NEUTRAL'


def main():
    print("=" * 68)
    print("  TSK-03 SPRITE PIPELINE & RIGGING INVARIANT AUDIT (Lex v3.2.0)       ")
    print("=" * 68)

    rig = FighterSpriteRig()
    dt = 1.0 / 60.0

    # TEST 1: Rapid 2-Frame Response to Vertical Input (INV-RIG-01)
    print("[TEST 1] Verifying 2-Frame Response to Climb Input (Up/W)...")
    assert rig.get_discrete_frame() == 'NEUTRAL'

    # Frame 1 of UP input
    rig.update(dt, -1, False)
    # Frame 2 of UP input
    rig.update(dt, -1, False)

    frame_state = rig.get_discrete_frame()
    print(f"  -> After 2 frames (33.3ms), tilt = {rig.tilt:.4f} rad, State = {frame_state}")
    assert frame_state == 'CLIMB', f"Expected CLIMB within 2 frames, got {frame_state}"
    print("  [PASS] Discrete frame transitions to CLIMB within <= 33.3ms.\n")

    # TEST 2: Dive Input Transition
    print("[TEST 2] Verifying Dive Transition (Down/S)...")
    for _ in range(4):
        rig.update(dt, 1, False)

    frame_state = rig.get_discrete_frame()
    print(f"  -> After 4 frames of DOWN input, tilt = {rig.tilt:.4f} rad, State = {frame_state}")
    assert frame_state == 'DIVE', f"Expected DIVE, got {frame_state}"
    print("  [PASS] Discrete frame transitions to DIVE cleanly.\n")

    # TEST 3: Return to Neutral on Input Release
    print("[TEST 3] Verifying Return to Level Flight (Neutral)...")
    for _ in range(15):
        rig.update(dt, 0, False)

    assert rig.get_discrete_frame() == 'NEUTRAL'
    assert abs(rig.tilt) < 0.05, f"Residual tilt too high: {rig.tilt}"
    print("  [PASS] Returns to NEUTRAL flight with smooth exponential decay.\n")

    # TEST 4: Hit-flash decay test
    print("[TEST 4] Verifying Hit-Flash Timed Decay...")
    rig.trigger_hit_flash(0.05)
    assert rig.is_flashing is True
    for _ in range(5):
        rig.update(dt, 0, False)
    assert rig.is_flashing is False
    print("  [PASS] Hit-flash automatically expires after duration.\n")

    print("=" * 68)
    print("  ALL TSK-03 SPRITE RIGGING CRUCIBLE GATES: [PASS]")
    print("=" * 68)

if __name__ == "__main__":
    main()
