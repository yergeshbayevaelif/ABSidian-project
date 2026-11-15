// 100% Procedural Web Audio API Sound & Ambient Space Synth (zero external audio files)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private enabled = true;
  private musicEnabled = true;
  private volume = 0.45;
  private stepTick = 0;

  private ensureContext(): AudioContext | null {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.volume;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.16;
        this.musicGain.connect(this.masterGain);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(on ? this.volume : 0, this.ctx.currentTime, 0.05);
    }
    if (!on) {
      this.stopAmbient();
    } else if (this.musicEnabled) {
      this.startAmbient();
    }
  }

  setMusicEnabled(on: boolean) {
    this.musicEnabled = on;
    if (!on) this.stopAmbient();
    else if (this.enabled) this.startAmbient();
  }

  setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && this.enabled) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  playClick() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.065);
  }

  playSuccess() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.075;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.16, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  playAlert() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + offset;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, start);
      osc.frequency.linearRampToValueAtTime(320, start + 0.16);
      gain.gain.setValueAtTime(0.11, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(start);
      osc.stop(start + 0.19);
    });
  }

  playRepair() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.17);
  }

  playFootstep() {
    this.stepTick++;
    if (this.stepTick % 2 !== 0) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110 + Math.random() * 25, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.045);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  }

  playDialogueBlip(pitch = 520) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch + Math.random() * 60, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(ctx.currentTime + 0.045);
  }

  playRocketLaunch() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const bufferSize = ctx.sampleRate * 2.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 2.0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start();
    noise.stop(ctx.currentTime + 2.2);
  }

  startAmbient() {
    if (!this.enabled || !this.musicEnabled || this.musicTimer !== null) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.musicGain) return;

    const chords = [
      [130.81, 196.0, 246.94, 329.63], // Cmaj7
      [110.0, 164.81, 220.0, 261.63],  // Am7
      [87.31, 130.81, 174.61, 220.0],  // Fmaj7
      [98.0, 146.83, 196.0, 246.94],   // G6
    ];
    let chordIndex = 0;

    const playChord = () => {
      if (!this.enabled || !this.musicEnabled || !this.ctx || !this.musicGain) return;
      const chord = chords[chordIndex % chords.length];
      chordIndex++;
      const now = this.ctx.currentTime;
      chord.forEach((freq) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 1.4);
        gain.gain.linearRampToValueAtTime(0.0001, now + 4.4);
        osc.connect(gain);
        gain.connect(this.musicGain);
        osc.start(now);
        osc.stop(now + 4.5);
      });
    };

    playChord();
    this.musicTimer = window.setInterval(playChord, 4400);
  }

  stopAmbient() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const soundEngine = new SoundEngine();
