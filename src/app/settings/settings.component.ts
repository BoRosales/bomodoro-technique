import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { SETTINGS_LIMITS, TimerStateService } from '../timer-state.service';

@Component({
  imports: [ReactiveFormsModule],
  selector: 'app-settings',
  styleUrl: './settings.component.scss',
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  private readonly timer = inject(TimerStateService);

  protected readonly limits = SETTINGS_LIMITS;
  protected readonly saved = signal(false);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    focusMinutes: [
      this.timer.settings().focusMinutes,
      [
        Validators.required,
        Validators.min(SETTINGS_LIMITS.focusMinutes.min),
        Validators.max(SETTINGS_LIMITS.focusMinutes.max),
        Validators.pattern(/^\d+$/),
      ],
    ],
    breakMinutes: [
      this.timer.settings().breakMinutes,
      [
        Validators.required,
        Validators.min(SETTINGS_LIMITS.breakMinutes.min),
        Validators.max(SETTINGS_LIMITS.breakMinutes.max),
        Validators.pattern(/^\d+$/),
      ],
    ],
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.saved.set(false));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.timer.updateSettings(this.form.getRawValue());
    this.saved.set(true);
  }
}