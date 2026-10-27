import { Routes } from '@angular/router';
import { TimerComponent } from './timer/timer.component';

export const routes: Routes = [
  { path: '', component: TimerComponent, title: 'Bomodoro' },
  {
    path: 'settings',
    loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
    title: 'Settings | Bomodoro',
  },
  { path: '**', redirectTo: '' },
];