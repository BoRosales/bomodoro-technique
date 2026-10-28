import { DestroyRef, Service, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { TimerStateService } from '../timer-state.service';
import { MusicPlayer } from './music-player';

/** Plays music while a focus session runs; pauses it when focus is paused or ends. */
@Service()
export class MusicTimerSync {
  private readonly timer = inject(TimerStateService);
  private readonly music = inject(MusicPlayer);
  private subscription: Subscription | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  start(): void {
    if (this.subscription) {
      return;
    }
    this.subscription = new Subscription();
    this.subscription.add(
      this.timer.started$.subscribe(phase => {
        if (phase === 'focus') {
          this.music.play();
        }
      }),
    );
    this.subscription.add(
      this.timer.paused$.subscribe(phase => {
        if (phase === 'focus') {
          this.music.pause();
        }
      }),
    );
    this.subscription.add(
      this.timer.phaseCompleted$.subscribe(({ phase }) => {
        if (phase === 'focus') {
          this.music.pause();
        }
      }),
    );
  }

  stop(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }
}