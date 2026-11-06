/**
 * TSK-04: ProceduralSoundEngine - Zero-Asset Polyphonic WebAudio Synthesizer
 * Standard: Lex Superior v3.2.0 (DoF = 0)
 * Invariant: INV-AUDIO-01 (Single AudioContext, Disconnect-on-End, Bounded Polyphony)
 * 
 * VIA NEGATIVA:
 * - Strictly zero external audio file loading (MP3/WAV/OGG are forbidden).
 * - No DOM or Canvas manipulation.
 */

class ProceduralSoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.isPlayingBGM = false;
    this.bgmTimer = null;
    this.currentStep = 0;
    this.bpm = 138;
    this.isBoss = false;

    // Track active sound node count to enforce bounded polyphony ceiling
    this.activeVoiceCount = 0;
    this.maxVoices = 16;

    // Pre-allocated noise buffer for explosions (1.0s white noise)
    this.noiseBuffer = null;

    // 16-step musical matrices (Militaristic arcade scale: A minor / D dorian)
    this.bassNotes = [110, 110, 130.81, 110, 146.83, 110, 130.81, 123.47, 110, 110, 164.81, 146.83, 130.81, 123.47, 98, 110];
    this.leadNotes = [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25, 440, 0, 659.25, 783.99, 880, 783.99, 659.25, 587.33];
    this.bossBass = [73.42, 73.42, 82.41, 73.42, 98.0, 73.42, 87.31, 73.42];
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.75, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
    this.sfxGain.connect(this.masterGain);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.musicGain.connect(this.masterGain);

    // Pre-create shared 1.0s noise buffer to avoid runtime GC
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate; // 1 second
    this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SOUND EFFECTS (SFX) ---

  playShoot(type = 'vulcan') {
    if (!this.ctx || this.activeVoiceCount >= this.maxVoices) return;
    this.activeVoiceCount++;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'gau8') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, t);

      osc.connect(filter);
      filter.connect(gain);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      osc.connect(gain);
    }

    gain.connect(this.sfxGain);

    // Strict node decoupling on completion (INV-AUDIO-01)
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.activeVoiceCount--;
    };

    osc.start(t);
    osc.stop(t + (type === 'gau8' ? 0.08 : 0.06));
  }

  playMissileLaunch() {
    if (!this.ctx || this.activeVoiceCount >= this.maxVoices) return;
    this.activeVoiceCount++;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.25);

    gain.gain.setValueAtTime(0.32, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.activeVoiceCount--;
    };

    osc.start(t);
    osc.stop(t + 0.25);
  }

  playExplosion(size = 'small') {
    if (!this.ctx || !this.noiseBuffer || this.activeVoiceCount >= this.maxVoices) return;
    this.activeVoiceCount++;

    const t = this.ctx.currentTime;
    const dur = size === 'boss' ? 1.8 : size === 'medium' ? 0.6 : 0.3;

    const noise = this.ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(size === 'boss' ? 250 : 650, t);
    filter.frequency.linearRampToValueAtTime(30, t + dur);

    const gain = this.ctx.createGain();
    const peakGain = size === 'boss' ? 0.85 : size === 'medium' ? 0.55 : 0.3;
    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.onended = () => {
      noise.disconnect();
      filter.disconnect();
      gain.disconnect();
      this.activeVoiceCount--;
    };

    noise.start(t);
    noise.stop(t + dur);
  }

  playBombBlast() {
    this.playExplosion('boss');
  }

  // --- MUSIC ENGINE ---

  startBGM(isBoss = false) {
    this.init();
    this.resume();
    this.isBoss = isBoss;
    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;
    this.currentStep = 0;
    this.scheduleStep();
  }

  setBossMode(active) {
    this.isBoss = active;
  }

  stopBGM() {
    this.isPlayingBGM = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  scheduleStep() {
    if (!this.isPlayingBGM || !this.ctx) return;

    const stepTime = 60 / (this.bpm * 4); // 16th notes
    const t = this.ctx.currentTime;

    // Drum sequence
    if (this.currentStep % 4 === 0) {
      this.triggerDrum('kick', t);
    }
    if (this.currentStep % 8 === 4) {
      this.triggerDrum('snare', t);
    }
    if (this.currentStep % 2 === 0) {
      this.triggerDrum('hihat', t);
    }

    // Bass Synth
    const notes = this.isBoss ? this.bossBass : this.bassNotes;
    const note = notes[this.currentStep % notes.length];
    if (note > 0) {
      this.triggerSynthVoice(note, 'sawtooth', 0.16, t, 0.20);
    }

    // Lead Arpeggio
    if (!this.isBoss) {
      const lead = this.leadNotes[this.currentStep % this.leadNotes.length];
      if (lead > 0) {
        this.triggerSynthVoice(lead, 'square', 0.08, t, 0.10);
      }
    }

    this.currentStep = (this.currentStep + 1) % 64;
    this.bgmTimer = setTimeout(() => this.scheduleStep(), stepTime * 1000);
  }

  triggerDrum(type, time) {
    if (!this.ctx || this.activeVoiceCount >= this.maxVoices) return;
    this.activeVoiceCount++;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'kick') {
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(30, time + 0.09);
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
    } else if (type === 'snare') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, time);
      osc.frequency.exponentialRampToValueAtTime(70, time + 0.07);
      gain.gain.setValueAtTime(0.28, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.07);
    } else if (type === 'hihat') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(9000, time);
      gain.gain.setValueAtTime(0.06, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    }

    osc.connect(gain);
    gain.connect(this.musicGain);

    const dur = type === 'hihat' ? 0.03 : type === 'snare' ? 0.07 : 0.09;
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
      this.activeVoiceCount--;
    };

    osc.start(time);
    osc.stop(time + dur);
  }

  triggerSynthVoice(freq, type, dur, time, vol) {
    if (!this.ctx || this.activeVoiceCount >= this.maxVoices) return;
    this.activeVoiceCount++;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, time);
    filter.frequency.exponentialRampToValueAtTime(350, time + dur);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      gain.disconnect();
      this.activeVoiceCount--;
    };

    osc.start(time);
    osc.stop(time + dur);
  }
}

// Module export & browser registration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ProceduralSoundEngine };
} else if (typeof window !== 'undefined') {
  window.ProceduralSoundEngine = ProceduralSoundEngine;
  window.soundEngine = new ProceduralSoundEngine();
}
