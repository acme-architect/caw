/**
 * AudioEngine - High Fidelity WebAudio Procedural Military Synthesizer
 * Implements arcade FM/subtractive sound effects and 4-track dynamic chiptune/synthwave BGM.
 * Zero external audio assets required (DoF = 0).
 */
class AudioEngine {
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

    // 16-step bassline & lead frequencies (A minor / D dorian militaristic scale)
    this.bassNotes = [110, 110, 130.81, 110, 146.83, 110, 130.81, 123.47, 110, 110, 164.81, 146.83, 130.81, 123.47, 98, 110];
    this.leadNotes = [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25, 440, 0, 659.25, 783.99, 880, 783.99, 659.25, 587.33];
    this.bossBass = [73.42, 73.42, 82.41, 73.42, 98.0, 73.42, 87.31, 73.42];
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
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
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SOUND EFFECTS ---

  playShoot(type = 'vulcan') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'vulcan') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(520, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.06);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.06);
    } else if (type === 'gau8') {
      // 30mm heavy rotary cannon (A-10)
      osc.type = 'square';
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.09);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      // Low pass punch
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }

  playMissileLaunch() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.28);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  playExplosion(size = 'small') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = size === 'boss' ? 2.2 : size === 'medium' ? 0.7 : 0.35;

    // Procedural white noise buffer
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(size === 'boss' ? 300 : 700, t);
    filter.frequency.linearRampToValueAtTime(30, t + dur);

    const gain = this.ctx.createGain();
    const peakGain = size === 'boss' ? 0.9 : size === 'medium' ? 0.6 : 0.35;
    gain.gain.setValueAtTime(peakGain, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  playItemPickup(type = 'gold') {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    if (type === 'gold') {
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
    } else if (type === 'fuel') {
      osc.frequency.setValueAtTime(523.25, t); // C5
      osc.frequency.setValueAtTime(783.99, t + 0.08); // G5
    } else {
      osc.frequency.setValueAtTime(659.25, t);
      osc.frequency.setValueAtTime(1046.50, t + 0.08);
    }

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  playBombBlast() {
    if (!this.ctx) return;
    this.playExplosion('boss');
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  // --- ADRENALINE MUSIC SYNTHESIZER ---

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

    // 1. Kick on 0, 4, 8, 12
    if (this.currentStep % 4 === 0) {
      this.triggerDrum('kick', t);
    }

    // 2. Snare on 4, 12
    if (this.currentStep % 8 === 4) {
      this.triggerDrum('snare', t);
    }

    // 3. Hi-hat every even step
    if (this.currentStep % 2 === 0) {
      this.triggerDrum('hihat', t);
    }

    // 4. Bass synth
    const notes = this.isBoss ? this.bossBass : this.bassNotes;
    const note = notes[this.currentStep % notes.length];
    if (note > 0) {
      this.triggerSynthNote(note, 'sawtooth', 0.18, t, 0.22);
    }

    // 5. Lead Arpeggio
    if (!this.isBoss) {
      const lead = this.leadNotes[this.currentStep % this.leadNotes.length];
      if (lead > 0) {
        this.triggerSynthNote(lead, 'square', 0.09, t, 0.12);
      }
    }

    this.currentStep = (this.currentStep + 1) % 64;
    this.bgmTimer = setTimeout(() => this.scheduleStep(), stepTime * 1000);
  }

  triggerDrum(type, time) {
    if (type === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.setValueAtTime(140, time);
      osc.frequency.exponentialRampToValueAtTime(32, time + 0.1);
      gain.gain.setValueAtTime(0.55, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.1);
    } else if (type === 'snare') {
      // Noise + tone
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.08);
    } else if (type === 'hihat') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(9500, time);
      gain.gain.setValueAtTime(0.07, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
      osc.connect(gain);
      gain.connect(this.musicGain);
      osc.start(time);
      osc.stop(time + 0.03);
    }
  }

  triggerSynthNote(freq, type, dur, time, vol) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, time);
    filter.frequency.exponentialRampToValueAtTime(400, time + dur);

    gain.gain.setValueAtTime(vol, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(time);
    osc.stop(time + dur);
  }
}

window.soundEngine = new AudioEngine();
