import { DestroyRef, Service, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { ChimeService } from './chime.service';
import { readStorage, writeStorage } from './storage';

export type TimerPhase = 'focus' | 'break';
export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerSettings {
  focusMinutes: number;
  breakMinutes: number;
}

export interface PhaseCompletedEvent {
  phase: TimerPhase;
  completedAt: number;
}

interface PersistedTimerState {
  phase: TimerPhase;
  status: TimerStatus;
  phaseDurationMs: number;
  remainingMs: number;
  endAt: number | null;
  completedFocusSessions: number;
  /** Optional for compatibility with state saved before this field existed. */
  focusSessionStartedAt?: number | null;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = { focusMinutes: 25, breakMinutes: 5 };
export const SETTINGS_LIMITS = {
  focusMinutes: { min: 1, max: 120 },
  breakMinutes: { min: 1, max: 60 },
} as const;

export const SETTINGS_STORAGE_KEY = 'bomodoro.settings';
export const STATE_STORAGE_KEY = 'bomodoro.timer';
const TICK_MS = 250;
const MINUTE_MS = 60_000;

@Service()
export class TimerStateService {
  private readonly chime = inject(ChimeService);

  private readonly _settings = signal<TimerSettings>(loadSettings());
  private readonly _phase = signal<TimerPhase>('focus');
  private readonly _status = signal<TimerStatus>('idle');
  private readonly _phaseDurationMs = signal(0);
  private readonly _remainingMs = signal(0);
  private readonly _completedFocusSessions = signal(0);
  private readonly _focusSessionStartedAt = signal<number | null>(null);
  private endAt: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly phaseCompletedSubject = new Subject<PhaseCompletedEvent>();

  readonly settings = this._settings.asReadonly();
  readonly phase = this._phase.asReadonly();
  readonly status = this._status.asReadonly();
  readonly phaseDurationMs = this._phaseDurationMs.asReadonly();
  readonly remainingMs = this._remainingMs.asReadonly();
  readonly completedFocusSessions = this._completedFocusSessions.asReadonly();
  /** When the current (or most recent) focus session was started; null if none yet. */
  readonly focusSessionStartedAt = this._focusSessionStartedAt.asReadonly();
  /** Emits whenever a phase counts down to zero (hook for music, history, etc.). */
  readonly phaseCompleted$ = this.phaseCompletedSubject.asObservable();

  readonly isRunning = computed(() => this._status() === 'running');
  readonly remainingSeconds = computed(() => Math.ceil(this._remainingMs() / 1000));
  readonly displayTime = computed(() => formatTime(this.remainingSeconds()));
  /** Fraction of the current phase that has elapsed, 0..1. */
  readonly progress = computed(() => {
    const total = this._phaseDurationMs();
    return total > 0 ? Math.min(1, Math.max(0, 1 - this._remainingMs() / total)) : 0;
  });

  constructor() {
    this.restoreState();
    inject(DestroyRef).onDestroy(() => {
      this.stopTicking();
      this.phaseCompletedSubject.complete();
    });
  }

  start(): void {
    if (this._status() === 'running') {
      return;
    }
    this.chime.prime();
    if (this._status() === 'idle' && this._phase() === 'focus') {
      this._focusSessionStartedAt.set(Date.now());
    }
    this.endAt = Date.now() + this._remainingMs();
    this._status.set('running');
    this.startTicking();
    this.persistState();
  }

  pause(): void {
    if (this._status() !== 'running') {
      return;
    }
    this.syncRemaining();
    this.stopTicking();
    this.endAt = null;
    this._status.set('paused');
    this.persistState();
  }

  toggle(): void {
    if (this._status() === 'running') {
      this.pause();
    } else {
      this.start();
    }
  }

  updateSettings(settings: TimerSettings): void {
    const sanitized = sanitizeSettings(settings);
    this._settings.set(sanitized);
    writeStorage(SETTINGS_STORAGE_KEY, sanitized);

    // Only an untouched phase picks up the new length; in-progress phases keep theirs.
    if (this._status() === 'idle') {
      this.enterPhase(this._phase());
    }
  }

  private startTicking(): void {
    this.stopTicking();
    this.intervalId = setInterval(() => this.tick(), TICK_MS);
  }

  private stopTicking(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    this.syncRemaining();
    if (this._remainingMs() <= 0) {
      this.completePhase(true);
    }
  }

  private syncRemaining(): void {
    if (this.endAt !== null) {
      this._remainingMs.set(Math.max(0, this.endAt - Date.now()));
    }
  }

  private completePhase(playChime: boolean): void {
    const finished = this._phase();
    this.stopTicking();
    this.endAt = null;
    if (finished === 'focus') {
      this._completedFocusSessions.update(n => n + 1);
    }
    this.enterPhase(finished === 'focus' ? 'break' : 'focus');
    if (playChime) {
      this.chime.play();
    }
    this.phaseCompletedSubject.next({ phase: finished, completedAt: Date.now() });
  }

  private enterPhase(phase: TimerPhase): void {
    const durationMs = this.durationFor(phase);
    this._phase.set(phase);
    this._status.set('idle');
    this._phaseDurationMs.set(durationMs);
    this._remainingMs.set(durationMs);
    this.endAt = null;
    this.persistState();
  }

  private durationFor(phase: TimerPhase): number {
    const s = this._settings();
    return (phase === 'focus' ? s.focusMinutes : s.breakMinutes) * MINUTE_MS;
  }

  private persistState(): void {
    const state: PersistedTimerState = {
      phase: this._phase(),
      status: this._status(),
      phaseDurationMs: this._phaseDurationMs(),
      remainingMs: this._remainingMs(),
      endAt: this.endAt,
      completedFocusSessions: this._completedFocusSessions(),
      focusSessionStartedAt: this._focusSessionStartedAt(),
    };
    writeStorage(STATE_STORAGE_KEY, state);
  }

  private restoreState(): void {
    const saved = readStorage<PersistedTimerState>(STATE_STORAGE_KEY);
    if (!isValidState(saved)) {
      this.enterPhase('focus');
      return;
    }

    this._completedFocusSessions.set(saved.completedFocusSessions);
    this._focusSessionStartedAt.set(
      Number.isFinite(saved.focusSessionStartedAt) ? (saved.focusSessionStartedAt as number) : null,
    );

    if (saved.status === 'idle') {
      // Re-derive from settings in case they changed since the last visit.
      this.enterPhase(saved.phase);
      return;
    }

    this._phase.set(saved.phase);
    this._phaseDurationMs.set(saved.phaseDurationMs);

    if (saved.status === 'running' && saved.endAt !== null) {
      this.endAt = saved.endAt;
      this.syncRemaining();
      if (this._remainingMs() <= 0) {
        // Phase finished while the app was closed: advance silently.
        this.completePhase(false);
        return;
      }
      this._status.set('running');
      this.startTicking();
      return;
    }

    this._remainingMs.set(Math.min(saved.remainingMs, saved.phaseDurationMs));
    this._status.set('paused');
  }
}

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function sanitizeSettings(settings: Partial<TimerSettings> | null | undefined): TimerSettings {
  return {
    focusMinutes: clampInt(
      settings?.focusMinutes,
      SETTINGS_LIMITS.focusMinutes.min,
      SETTINGS_LIMITS.focusMinutes.max,
      DEFAULT_TIMER_SETTINGS.focusMinutes,
    ),
    breakMinutes: clampInt(
      settings?.breakMinutes,
      SETTINGS_LIMITS.breakMinutes.min,
      SETTINGS_LIMITS.breakMinutes.max,
      DEFAULT_TIMER_SETTINGS.breakMinutes,
    ),
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(n)));
}

function loadSettings(): TimerSettings {
  return sanitizeSettings(readStorage<Partial<TimerSettings>>(SETTINGS_STORAGE_KEY));
}

function isValidState(state: PersistedTimerState | null): state is PersistedTimerState {
  return (
    !!state &&
    (state.phase === 'focus' || state.phase === 'break') &&
    (state.status === 'idle' || state.status === 'running' || state.status === 'paused') &&
    Number.isFinite(state.phaseDurationMs) &&
    state.phaseDurationMs > 0 &&
    Number.isFinite(state.remainingMs) &&
    (state.endAt === null || Number.isFinite(state.endAt)) &&
    Number.isInteger(state.completedFocusSessions) &&
    state.completedFocusSessions >= 0
  );
}
