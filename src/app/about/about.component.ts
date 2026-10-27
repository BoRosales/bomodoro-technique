import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimerStateService } from '../timer-state.service';

@Component({
  imports: [RouterLink],
  selector: 'app-about',
  styleUrl: './about.component.scss',
  templateUrl: './about.component.html',
})
export class AboutComponent {
  protected readonly settings = inject(TimerStateService).settings;
}