import { Signal } from '@angular/core';

export type MusicStatus = 'loading' | 'ready' | 'error';

/**
 * Source-agnostic music player. The UI and timer sync depend only on this,
 * so swapping Spotify for MP3s means adding another implementation and
 * changing the provider in app.config.ts.
 */
export abstract class MusicPlayer {
  abstract readonly status: Signal<MusicStatus>;
  abstract readonly isPlaying: Signal<boolean>;
  /** Where to send listeners if the player can't load; null if there's no fallback. */
  abstract readonly fallbackUrl: string | null;
  /** Space (px) to reserve for whatever mount() renders; 0 if it renders nothing. */
  abstract readonly mountHeight: number;

  /** Called by the UI with an element the player may render into (e.g. an embed). */
  abstract mount(host: HTMLElement): void;
  abstract unmount(): void;
  abstract play(): void;
  abstract pause(): void;

  toggle(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }
}