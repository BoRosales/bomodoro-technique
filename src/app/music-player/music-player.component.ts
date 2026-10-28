import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { MusicPlayer } from './music-player';

@Component({
  imports: [],
  selector: 'app-music-player',
  styleUrl: './music-player.component.scss',
  templateUrl: './music-player.component.html',
})
export class MusicPlayerComponent {
  protected readonly player = inject(MusicPlayer);
  private readonly embedHost = viewChild.required<ElementRef<HTMLElement>>('embed');

  constructor() {
    afterNextRender(() => this.player.mount(this.embedHost().nativeElement));
    inject(DestroyRef).onDestroy(() => this.player.unmount());
  }
}