import { Service } from '@angular/core';

@Service()
export class ChimeService {
  private context: AudioContext | null = null;

  /** Call from a user gesture (e.g. Start click) so browsers allow later playback. */
  prime(): void {
    this.getContext();
  }

  play(): void {
    const ctx = this.getContext();
    if (!ctx) {
      return;
    }

    // Three-note ascending chime (C6, E6, G6).
    const notes = [1046.5, 1318.5, 1568];
    const start = ctx.currentTime;
    notes.forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = start + i * 0.18;

      osc.type = 'sine';
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1);
    });
  }

  private getContext(): AudioContext | null {
    if (typeof AudioContext === 'undefined') {
      return null;
    }
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    return this.context;
  }
}
