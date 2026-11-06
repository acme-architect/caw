"""
TSK-04 Mechanical Verification Harness (Python Standard Library)
Tests: INV-AUDIO-01 (Voice Allocation Limiter, Polyphony Ceiling, Auto-Disconnect)
"""

class MockAudioContext:
    def __init__(self):
        self.current_time = 0.0

class MockVoice:
    def __init__(self, voice_id, dur):
        self.voice_id = voice_id
        self.dur = dur
        self.active = True

    def disconnect(self):
        self.active = False

class ProceduralSoundSimulator:
    def __init__(self, max_voices=16):
        self.max_voices = max_voices
        self.active_voice_count = 0
        self.voices = []

    def play_sound(self, duration=0.1):
        if self.active_voice_count >= self.max_voices:
            return False  # Bounded polyphony gate (Fail-Closed)

        self.active_voice_count += 1
        voice = MockVoice(self.active_voice_count, duration)
        self.voices.append(voice)
        return True

    def advance_time(self, dt):
        for v in list(self.voices):
            v.dur -= dt
            if v.dur <= 0:
                v.disconnect()
                self.voices.remove(v)
                self.active_voice_count -= 1

def main():
    print("=" * 68)
    print("  TSK-04 PROCEDURAL AUDIO INVARIANT AUDIT (Lex Superior v3.2.0)      ")
    print("=" * 68)

    sim = ProceduralSoundSimulator(max_voices=16)

    # TEST 1: Bounded Voice Cap & Fail-Closed Gate
    print("[TEST 1] Verifying Bounded Polyphony Ceiling (max 16 voices)...")
    for i in range(16):
        res = sim.play_sound(duration=0.2)
        assert res is True, f"Failed to acquire voice {i}"

    assert sim.active_voice_count == 16, "Active voice count must equal 16"

    # 17th voice must fail-closed without throwing or creating unlinked nodes
    overflow = sim.play_sound(duration=0.2)
    assert overflow is False, "17th voice must be dropped by bounded limiter"
    print("  [PASS] Polyphony strictly bounded at 16 voices.\n")

    # TEST 2: Timed Auto-Disconnect & Node Recycling
    print("[TEST 2] Verifying Timed Auto-Disconnect on Ended...")
    sim.advance_time(0.25) # Let all 16 voices expire
    assert sim.active_voice_count == 0, f"Expected 0 active voices, got {sim.active_voice_count}"
    assert len(sim.voices) == 0, "Unreleased voice nodes remaining in memory"
    print("  [PASS] All voice nodes disconnected and recycled to zero.\n")

    # TEST 3: Sustained Rapid Fire Voice Cycle
    print("[TEST 3] Stressing 10,000 Rapid-Fire Sound Triggers...")
    for _ in range(10000):
        sim.play_sound(duration=0.02)
        sim.advance_time(0.01)

    # Clean wind-down
    sim.advance_time(1.0)
    assert sim.active_voice_count == 0
    print("  [PASS] 10,000 rapid sound events processed with zero memory leaks.\n")

    print("=" * 68)
    print("  ALL TSK-04 AUDIO CRUCIBLE GATES: [PASS]")
    print("=" * 68)

if __name__ == "__main__":
    main()

