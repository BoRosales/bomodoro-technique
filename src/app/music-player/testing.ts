import { signal } from '@angular/core';
import { MusicPlayer, MusicStatus } from './music-player';

/** Test double for MusicPlayer; wrap methods with vi.spyOn in specs to assert calls. */
export class FakeMusicPlayer extends MusicPlayer {
  readonly status = signal<MusicStatus>('ready');
  readonly isPlaying = signal(false);
  readonly fallbackUrl: string | null = 'https://example.com/playlist';
  readonly mountHeight = 100;

  mount(_host: HTMLElement): void {}
  unmount(): void {}

  play(): void {
    this.isPlaying.set(true);
  }

  pause(): void {
    this.isPlaying.set(false);
  }
}
