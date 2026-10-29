import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY, ThemeService } from './theme.service';

describe('ThemeService', () => {
  const html = document.documentElement;

  function mockSystemDark(dark: boolean): void {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      query => ({ matches: dark && query.includes('dark'), media: query }) as MediaQueryList,
    );
  }

  beforeEach(() => {
    localStorage.clear();
    html.removeAttribute('data-bs-theme');
    if (!window.matchMedia) {
      window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
    localStorage.clear();
    html.removeAttribute('data-bs-theme');
  });

  it('follows the system preference when nothing is saved', () => {
    mockSystemDark(true);
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
    expect(html.getAttribute('data-bs-theme')).toBe('dark');
  });

  it('defaults to light when the system has no dark preference', () => {
    mockSystemDark(false);
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
    expect(html.getAttribute('data-bs-theme')).toBe('light');
  });

  it('prefers a saved choice over the system preference', () => {
    mockSystemDark(true);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('light'));
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });

  it('ignores an invalid saved value', () => {
    mockSystemDark(false);
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify('purple'));
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });

  it('toggles, applies and saves the theme', () => {
    mockSystemDark(false);
    const service = TestBed.inject(ThemeService);
    service.toggle();
    expect(service.theme()).toBe('dark');
    expect(html.getAttribute('data-bs-theme')).toBe('dark');
    expect(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY)!)).toBe('dark');

    service.toggle();
    expect(html.getAttribute('data-bs-theme')).toBe('light');
  });
});