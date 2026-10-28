import { Service, inject, signal } from '@angular/core';
import { MusicPlayer, MusicStatus } from './music-player';
import { SpotifyEmbedController, SpotifyEmbedLoader } from './spotify-embed-loader.service';

export const PLAYLIST_ID = '6xnw2ADbqXpsys7mtlJ9Ms';
export const PLAYLIST_URI = `spotify:playlist:${PLAYLIST_ID}`;
export const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
export const SPOTIFY_EMBED_HEIGHT = 152;
const READY_TIMEOUT_MS = 15_000;

@Service()
export class SpotifyMusicPlayer extends MusicPlayer {
  private readonly loader = inject(SpotifyEmbedLoader);

  private readonly _status = signal<MusicStatus>('loading');
  private readonly _isPlaying = signal(false);
  readonly status = this._status.asReadonly();
  readonly isPlaying = this._isPlaying.asReadonly();
  readonly fallbackUrl = PLAYLIST_URL;
  readonly mountHeight = SPOTIFY_EMBED_HEIGHT;

  private controller: SpotifyEmbedController | null = null;
  /** Incremented on every mount/unmount so late async callbacks from an old embed are ignored. */
  private mountId = 0;
  private readyTimeout: ReturnType<typeof setTimeout> | null = null;

  mount(host: HTMLElement): void {
    this.unmount();
    const id = this.mountId;
    // Covers ad/tracker blockers that stop the embed without a script error.
    this.readyTimeout = setTimeout(() => this.fail(id), READY_TIMEOUT_MS);

    this.loader
      .load()
      .then(api => {
        if (id !== this.mountId) {
          return;
        }
        api.createController(host, { uri: PLAYLIST_URI, width: '100%', height: SPOTIFY_EMBED_HEIGHT }, controller => {
          if (id !== this.mountId) {
            controller.destroy();
            return;
          }
          this.controller = controller;
          controller.addListener('ready', () => {
            if (id === this.mountId) {
              this.clearReadyTimeout();
              this._status.set('ready');
            }
          });
          controller.addListener('playback_update', e => {
            if (id === this.mountId) {
              this._isPlaying.set(!e.data.isPaused);
            }
          });
        });
      })
      .catch(() => this.fail(id));
  }

  unmount(): void {
    this.mountId++;
    this.clearReadyTimeout();
    this.controller?.destroy();
    this.controller = null;
    this._status.set('loading');
    this._isPlaying.set(false);
  }

  play(): void {
    if (this._status() === 'ready') {
      // resume() also starts playback if nothing has played yet.
      this.controller?.resume();
    }
  }

  pause(): void {
    if (this._status() === 'ready') {
      this.controller?.pause();
    }
  }

  private fail(id: number): void {
    if (id !== this.mountId) {
      return;
    }
    this.clearReadyTimeout();
    if (this._status() !== 'ready') {
      this._status.set('error');
    }
  }

  private clearReadyTimeout(): void {
    if (this.readyTimeout !== null) {
      clearTimeout(this.readyTimeout);
      this.readyTimeout = null;
    }
  }
}