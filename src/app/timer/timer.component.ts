import { Component, computed, inject } from '@angular/core';
import { TimerStateService } from '../timer-state.service';

const RING_RADIUS = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

@Component({
  imports: [],
  selector: 'app-timer',
  styleUrl: './timer.component.scss',
  templateUrl: './timer.component.html',
})
export class TimerComponent {
  protected readonly timer = inject(TimerStateService);

  protected readonly ringRadius = RING_RADIUS;
  protected readonly ringCircumference = RING_CIRCUMFERENCE;
  protected readonly ringOffset = computed(() => RING_CIRCUMFERENCE * (1 - this.timer.progress()));

  protected readonly phaseLabel = computed(() => (this.timer.phase() === 'focus' ? 'Focus' : 'Break'));
  protected readonly buttonLabel = computed(() => {
    switch (this.timer.status()) {
      case 'running':
        return 'Pause';
      case 'paused':
        return 'Resume';
      default:
        return 'Start';
    }
  });
}