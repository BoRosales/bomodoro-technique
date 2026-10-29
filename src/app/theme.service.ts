import { DOCUMENT, Service, inject, signal } from '@angular/core';
import { readStorage, writeStorage } from './storage';

export type Theme = 'light' | 'dark';

/** Keep in sync with the inline script in index.html, which applies the theme before Angular loads. */
export const THEME_STORAGE_KEY = 'bomodoro.theme';

@Service()
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly _theme = signal<Theme>(this.initialTheme());

  readonly theme = this._theme.asReadonly();

  constructor() {
    this.apply(this._theme());
  }

  toggle(): void {
    this.set(this._theme() === 'dark' ? 'light' : 'dark');
  }

  set(theme: Theme): void {
    this._theme.set(theme);
    this.apply(theme);
    writeStorage(THEME_STORAGE_KEY, theme);
  }

  private apply(theme: Theme): void {
    this.document.documentElement.setAttribute('data-bs-theme', theme);
  }

  private initialTheme(): Theme {
    const stored = readStorage<unknown>(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    const prefersDark = this.document.defaultView?.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
}
