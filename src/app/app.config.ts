import { ViewportScroller } from '@angular/common';
import {
  ApplicationConfig,
  DOCUMENT,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { MusicPlayer } from './music-player/music-player';
import { MusicTimerSync } from './music-player/music-timer-sync.service';
import { SpotifyMusicPlayer } from './music-player/spotify-music-player.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    // Swap the music source here (e.g. an MP3-based MusicPlayer).
    { provide: MusicPlayer, useExisting: SpotifyMusicPlayer },
    provideAppInitializer(() => inject(MusicTimerSync).start()),
    provideAppInitializer(() => {
      const doc = inject(DOCUMENT);
      // Keep anchor targets (e.g. #about) from landing under the sticky navbar.
      inject(ViewportScroller).setOffset(() => [0, (doc.querySelector('nav')?.offsetHeight ?? 0) + 16]);
    }),
  ],
};
