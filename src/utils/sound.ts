// Web Audio API Synthesizer for Arcade Sound Effects

class ArcadeSoundEngine {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playTone(
    freq: number,
    duration = 0.08,
    type: OscillatorType = 'square',
    volume = 0.12,
    slideTo?: number
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + duration);
      }

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio errors on restricted autoplay
    }
  }

  public playLaser() {
    this.playTone(720, 0.09, 'sawtooth', 0.08, 180);
  }

  public playHit() {
    this.playTone(190, 0.12, 'square', 0.12, 55);
  }

  public playExplosion() {
    this.playTone(130, 0.25, 'sawtooth', 0.15, 32);
  }

  public playPickup() {
    const ctx = this.getContext();
    if (!ctx) return;
    this.playTone(523.25, 0.07, 'triangle', 0.12);
    setTimeout(() => this.playTone(659.25, 0.09, 'triangle', 0.12), 60);
    setTimeout(() => this.playTone(783.99, 0.12, 'triangle', 0.12), 120);
  }

  public playBoost() {
    this.playTone(220, 0.18, 'sawtooth', 0.1, 640);
  }

  public playJump() {
    this.playTone(280, 0.12, 'sine', 0.12, 560);
  }

  public playBounce() {
    this.playTone(440, 0.06, 'square', 0.1, 520);
  }

  public playMove() {
    this.playTone(320, 0.045, 'triangle', 0.08, 390);
  }

  public playMerge() {
    this.playTone(480, 0.09, 'sine', 0.14, 720);
  }

  public playMemoryNote(index: number) {
    const notes = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66];
    const freq = notes[index % notes.length];
    this.playTone(freq, 0.18, 'sine', 0.15);
  }

  public playAchievement() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.14, 'triangle', 0.14), idx * 90);
    });
  }

  public playGameOver() {
    const notes = [392.0, 349.23, 329.63, 261.63];
    notes.forEach((n, idx) => {
      setTimeout(() => this.playTone(n, 0.16, 'sawtooth', 0.11), idx * 110);
    });
  }
}

export const soundFX = new ArcadeSoundEngine();
