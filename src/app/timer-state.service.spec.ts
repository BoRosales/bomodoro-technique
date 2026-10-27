import { TestBed } from '@angular/core/testing';
import { ChimeService } from './chime.service';
import {
  PhaseCompletedEvent,
  SETTINGS_STORAGE_KEY,
  STATE_STORAGE_KEY,
  TimerStateService,
  formatTime,
  sanitizeSettings,
} from './timer-state.service';

const MINUTE = 60_000;

describe('TimerStateService', () => {
  let chime: { play: ReturnType<typeof vi.fn>; prime: ReturnType<typeof vi.fn> };

  function create(): TimerStateService {
    return TestBed.inject(TimerStateService);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    localStorage.clear();
    chime = { play: vi.fn(), prime: vi.fn() };
    TestBed.configureTestingModule({
      providers: [{ provide: ChimeService, useValue: chime }],
    });
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('starts idle in focus with default 25 minutes', () => {
    const service = create();
    expect(service.phase()).toBe('focus');
    expect(service.status()).toBe('idle');
    expect(service.remainingMs()).toBe(25 * MINUTE);
    expect(service.displayTime()).toBe('25:00');
    expect(service.progress()).toBe(0);
  });

  it('counts down while running and primes audio on start', () => {
    const service = create();
    service.start();
    expect(chime.prime).toHaveBeenCalled();
    expect(service.status()).toBe('running');

    vi.advanceTimersByTime(61_000);
    expect(service.displayTime()).toBe('23:59');
    expect(service.progress()).toBeCloseTo(61 / (25 * 60), 3);
  });

  it('pauses and resumes without losing time', () => {
    const service = create();
    service.start();
    vi.advanceTimersByTime(10_000);
    service.pause();
    expect(service.status()).toBe('paused');
    const remaining = service.remainingMs();

    vi.advanceTimersByTime(60_000);
    expect(service.remainingMs()).toBe(remaining);

    service.toggle();
    expect(service.status()).toBe('running');
    vi.advanceTimersByTime(5_000);
    expect(service.remainingMs()).toBe(remaining - 5_000);
  });

  it('switches to an idle break when focus ends, plays chime and emits', () => {
    const service = create();
    const events: PhaseCompletedEvent[] = [];
    service.phaseCompleted$.subscribe(e => events.push(e));

    service.start();
    vi.advanceTimersByTime(25 * MINUTE + 500);

    expect(service.phase()).toBe('break');
    expect(service.status()).toBe('idle');
    expect(service.remainingMs()).toBe(5 * MINUTE);
    expect(service.completedFocusSessions()).toBe(1);
    expect(chime.play).toHaveBeenCalledTimes(1);
    expect(events.map(e => e.phase)).toEqual(['focus']);

    // Waits for the user: no further countdown.
    vi.advanceTimersByTime(MINUTE);
    expect(service.remainingMs()).toBe(5 * MINUTE);
  });

  it('switches back to focus after a break without counting a session', () => {
    const service = create();
    service.start();
    vi.advanceTimersByTime(25 * MINUTE + 500);
    service.start();
    vi.advanceTimersByTime(5 * MINUTE + 500);

    expect(service.phase()).toBe('focus');
    expect(service.status()).toBe('idle');
    expect(service.completedFocusSessions()).toBe(1);
  });

  it('applies new settings to an idle phase immediately and persists them', () => {
    const service = create();
    service.updateSettings({ focusMinutes: 50, breakMinutes: 10 });
    expect(service.remainingMs()).toBe(50 * MINUTE);
    expect(JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!)).toEqual({ focusMinutes: 50, breakMinutes: 10 });
  });

  it('keeps the current length of an in-progress phase when settings change', () => {
    const service = create();
    service.start();
    vi.advanceTimersByTime(MINUTE);
    service.updateSettings({ focusMinutes: 50, breakMinutes: 10 });
    expect(service.phaseDurationMs()).toBe(25 * MINUTE);

    vi.advanceTimersByTime(24 * MINUTE + 500);
    expect(service.phase()).toBe('break');
    expect(service.remainingMs()).toBe(10 * MINUTE);
  });

  it('restores a running timer after reload using wall-clock time', () => {
    create().start();
    vi.advanceTimersByTime(MINUTE);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: ChimeService, useValue: chime }] });

    vi.setSystemTime(Date.now() + 2 * MINUTE);
    const restored = create();
    expect(restored.status()).toBe('running');
    expect(restored.remainingMs()).toBe(22 * MINUTE);
  });

  it('restores a paused timer', () => {
    const service = create();
    service.start();
    vi.advanceTimersByTime(30_000);
    service.pause();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: ChimeService, useValue: chime }] });

    const restored = create();
    expect(restored.status()).toBe('paused');
    expect(restored.displayTime()).toBe('24:30');
  });

  it('advances silently if the phase finished while the app was closed', () => {
    create().start();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [{ provide: ChimeService, useValue: chime }] });

    vi.setSystemTime(Date.now() + 30 * MINUTE);
    const restored = create();
    expect(restored.phase()).toBe('break');
    expect(restored.status()).toBe('idle');
    expect(restored.completedFocusSessions()).toBe(1);
    expect(chime.play).not.toHaveBeenCalled();
  });

  it('ignores corrupt stored state and settings', () => {
    localStorage.setItem(STATE_STORAGE_KEY, '{not json');
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ focusMinutes: 'abc', breakMinutes: -3 }));
    const service = create();
    expect(service.settings()).toEqual({ focusMinutes: 25, breakMinutes: 1 });
    expect(service.phase()).toBe('focus');
    expect(service.status()).toBe('idle');
  });
});

describe('formatTime', () => {
  it('formats seconds as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(25 * 60)).toBe('25:00');
    expect(formatTime(120 * 60)).toBe('120:00');
    expect(formatTime(-5)).toBe('00:00');
  });
});

describe('sanitizeSettings', () => {
  it('clamps and rounds values into range', () => {
    expect(sanitizeSettings({ focusMinutes: 500, breakMinutes: 0 })).toEqual({ focusMinutes: 120, breakMinutes: 1 });
    expect(sanitizeSettings({ focusMinutes: 24.6, breakMinutes: 4.4 })).toEqual({ focusMinutes: 25, breakMinutes: 4 });
    expect(sanitizeSettings(null)).toEqual({ focusMinutes: 25, breakMinutes: 5 });
  });
});