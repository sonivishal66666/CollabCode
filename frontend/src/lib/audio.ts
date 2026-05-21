class AudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private volume: number = 0.5;

  private initCtx() {
    if (typeof window === 'undefined') return false;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return !!this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    // Resume audio context if unmuting
    if (!muted) {
      this.initCtx();
    }
  }

  isMuted() {
    return this.muted;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume() {
    return this.volume;
  }

  private createGain(duration: number, startVal: number = 1, endVal: number = 0.001): GainNode | null {
    if (!this.initCtx() || !this.ctx || this.muted) return null;
    
    const gainNode = this.ctx.createGain();
    const now = this.ctx.currentTime;
    
    gainNode.gain.setValueAtTime(startVal * this.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(endVal * this.volume, now + duration);
    gainNode.connect(this.ctx.destination);
    
    return gainNode;
  }

  // Soft transient pop for tab switching
  playPop() {
    if (!this.initCtx() || !this.ctx || this.muted) return;
    
    const now = this.ctx.currentTime;
    const duration = 0.08;
    const gainNode = this.createGain(duration, 0.4);
    if (!gainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + duration);

    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Woody, organic click for folder toggle
  playClick() {
    if (!this.initCtx() || !this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.05;
    const gainNode = this.createGain(duration, 0.25);
    if (!gainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + duration);

    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Gentle slide/swoosh for opening side panels
  playSwoosh() {
    if (!this.initCtx() || !this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.2;
    const gainNode = this.createGain(duration, 0.15, 0.0001);
    if (!gainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + duration);

    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Sweet chime/spring pop for chat send/receive
  playChime() {
    if (!this.initCtx() || !this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.5;
    
    // Create soft chime chord
    const playTone = (freq: number, delay: number, vol: number) => {
      if (!this.ctx) return;
      const t = now + delay;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(vol * this.volume, t + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * this.volume, t + duration);
      gainNode.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      
      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + duration + 0.1);
    };

    // Synthesize C-major 9th arpeggio chime
    playTone(523.25, 0, 0.2);     // C5
    playTone(659.25, 0.04, 0.15);  // E5
    playTone(783.99, 0.08, 0.15);  // G5
    playTone(987.77, 0.12, 0.2);   // B5
  }

  // Warm elevator sweep for code compilation start
  playStart() {
    if (!this.initCtx() || !this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.4;
    const gainNode = this.createGain(duration, 0.2, 0.01);
    if (!gainNode) return;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(261.63, now); // C4
    osc.frequency.exponentialRampToValueAtTime(523.25, now + duration); // C5

    osc.connect(gainNode);
    osc.start(now);
    osc.stop(now + duration);
  }

  // Retro upward synthesizer arpeggio on compilation success
  playSuccess() {
    if (!this.initCtx() || !this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.15;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // C4, E4, G4, C5, E5, G5, C6
    
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const t = now + idx * 0.05;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.15 * this.volume, t);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * this.volume, t + duration);
      gainNode.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      osc.connect(gainNode);
      osc.start(t);
      osc.stop(t + duration + 0.05);
    });
  }

  // Deep pitch-bending warning drone for compile/execute errors
  playAlert() {
    if (!this.initCtx() || !this.ctx || this.muted) return;

    const now = this.ctx.currentTime;
    const duration = 0.45;
    
    const playDrone = (baseFreq: number, detune: number) => {
      if (!this.ctx) return;
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.18 * this.volume, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001 * this.volume, now + duration);
      gainNode.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq + detune, now);
      osc.frequency.linearRampToValueAtTime((baseFreq * 0.7) + detune, now + duration);

      // Low pass filter to make it warmer/less harsh
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      osc.connect(filter);
      filter.connect(gainNode);
      
      osc.start(now);
      osc.stop(now + duration + 0.1);
    };

    // Play detuned oscillators for fat, analog synth feel
    playDrone(130.81, -2); // C3
    playDrone(130.81, 2);
  }
}

export const audio = new AudioEngine();
