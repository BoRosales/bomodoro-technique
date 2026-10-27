import { Component } from '@angular/core';
import { AboutComponent } from '../about/about.component';
import { TimerComponent } from '../timer/timer.component';

@Component({
  imports: [TimerComponent, AboutComponent],
  selector: 'app-home',
  styleUrl: './home.component.scss',
  templateUrl: './home.component.html',
})
export class HomeComponent {}