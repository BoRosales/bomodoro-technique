import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MusicPlayer } from '../music-player/music-player';

/**
 * Persistent bottom bar that hosts the music player's embed. It lives in the app shell
 * (outside the router outlet) so playback continues across page navigation.
 */
@Component({
  imports: [],
  selector: 'app-music-dock',
  styleUrl: './music-dock.component.scss',
  templateUrl: './music-dock.component.html',
})
export class MusicDockComponent {
  protected readonly player = inject(MusicPlayer);
  private readonly embedHost = viewChild.required<ElementRef<HTMLElement>>('embed');

  constructor() {
    afterNextRender(() => this.player.mount(this.embedHost().nativeElement));
    inject(DestroyRef).onDestroy(() => this.player.unmount());
  }
}