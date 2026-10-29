import { Component, inject } from '@angular/core';
import { MusicPlayer } from './music-player';

/** Home-page music controls. The embed itself lives in MusicDockComponent so it survives navigation. */
@Component({
  imports: [],
  selector: 'app-music-player',
  styleUrl: './music-player.component.scss',
  templateUrl: './music-player.component.html',
})
export class MusicPlayerComponent {
  protected readonly player = inject(MusicPlayer);
}