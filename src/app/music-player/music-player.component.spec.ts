import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MusicPlayer } from './music-player';
import { MusicPlayerComponent } from './music-player.component';
import { FakeMusicPlayer } from './testing';

describe('MusicPlayerComponent', () => {
  let fixture: ComponentFixture<MusicPlayerComponent>;
  let el: HTMLElement;
  let music: FakeMusicPlayer;

  const button = () => el.querySelector<HTMLButtonElement>('[data-testid="music-toggle"]')!;

  beforeEach(async () => {
    music = new FakeMusicPlayer();
    for (const method of ['play', 'pause'] as const) {
      vi.spyOn(music, method);
    }
    await TestBed.configureTestingModule({
      imports: [MusicPlayerComponent],
      providers: [{ provide: MusicPlayer, useValue: music }],
    }).compileComponents();
    fixture = TestBed.createComponent(MusicPlayerComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });


  it('toggles play and pause', async () => {
    expect(button().textContent).toContain('Play');
    button().click();
    await fixture.whenStable();
    expect(music.play).toHaveBeenCalled();
    expect(button().textContent).toContain('Pause');
    expect(button().getAttribute('aria-pressed')).toBe('true');

    button().click();
    await fixture.whenStable();
    expect(music.pause).toHaveBeenCalled();
    expect(button().textContent).toContain('Play');
  });

  it('is disabled while loading', async () => {
    music.status.set('loading');
    await fixture.whenStable();
    expect(button().disabled).toBe(true);
    expect(button().textContent).toContain('Loading');
  });

  it('shows a fallback link on error', async () => {
    music.status.set('error');
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="music-error"] a')!.getAttribute('href')).toBe(music.fallbackUrl);
  });

});