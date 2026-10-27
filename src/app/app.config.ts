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

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })),
    provideAppInitializer(() => {
      const doc = inject(DOCUMENT);
      // Keep anchor targets (e.g. #about) from landing under the sticky navbar.
      inject(ViewportScroller).setOffset(() => [0, (doc.querySelector('nav')?.offsetHeight ?? 0) + 16]);
    }),
  ],
};
