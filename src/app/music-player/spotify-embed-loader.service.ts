import { DOCUMENT, Service, inject } from '@angular/core';

/** Minimal typings for Spotify's iFrame API: https://developer.spotify.com/documentation/embeds/references/iframe-api */
export interface SpotifyPlaybackUpdate {
  data: { isPaused: boolean; isBuffering: boolean; position: number; duration: number };
}

export interface SpotifyEmbedController {
  addListener(event: 'ready', handler: () => void): void;
  addListener(event: 'playback_update', handler: (e: SpotifyPlaybackUpdate) => void): void;
  togglePlay(): void;
  pause(): void;
  resume(): void;
  destroy(): void;
}

export interface SpotifyIFrameApi {
  createController(
    element: HTMLElement,
    options: { uri: string; width?: number | string; height?: number | string },
    callback: (controller: SpotifyEmbedController) => void,
  ): void;
}

const SCRIPT_SRC = 'https://open.spotify.com/embed/iframe-api/v1';

/** Loads Spotify's iFrame API script once per page and shares it across player instances. */
@Service()
export class SpotifyEmbedLoader {
  private readonly document = inject(DOCUMENT);
  private apiPromise: Promise<SpotifyIFrameApi> | null = null;

  load(): Promise<SpotifyIFrameApi> {
    this.apiPromise ??= new Promise<SpotifyIFrameApi>((resolve, reject) => {
      const win = this.document.defaultView as (Window & { onSpotifyIframeApiReady?: (api: SpotifyIFrameApi) => void }) | null;
      if (!win) {
        reject(new Error('Spotify player requires a browser.'));
        return;
      }
      win.onSpotifyIframeApiReady = api => resolve(api);

      const script = this.document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onerror = () => {
        script.remove();
        this.apiPromise = null;
        reject(new Error('Could not load the Spotify player.'));
      };
      this.document.body.appendChild(script);
    });
    return this.apiPromise;
  }
}