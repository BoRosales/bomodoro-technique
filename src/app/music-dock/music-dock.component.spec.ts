import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MusicPlayer } from '../music-player/music-player';
import { FakeMusicPlayer } from '../music-player/testing';
import { MusicDockComponent } from './music-dock.component';

describe('MusicDockComponent', () => {
  let fixture: ComponentFixture<MusicDockComponent>;
  let el: HTMLElement;
  let music: FakeMusicPlayer;

  beforeEach(async () => {
    music = new FakeMusicPlayer();
    vi.spyOn(music, 'mount');
    vi.spyOn(music, 'unmount');
    await TestBed.configureTestingModule({
      imports: [MusicDockComponent],
      providers: [{ provide: MusicPlayer, useValue: music }],
    }).compileComponents();
    fixture = TestBed.createComponent(MusicDockComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('mounts the player into the dock', () => {
    expect(music.mount).toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(el.querySelector('[data-testid="music-dock"]')!.contains(vi.mocked(music.mount).mock.calls[0][0])).toBe(true);
  });

  it('hides the dock (without removing the embed host) on error', async () => {
    const dock = () => el.querySelector<HTMLElement>('[data-testid="music-dock"]')!;
    expect(dock().hidden).toBe(false);
    music.status.set('error');
    await fixture.whenStable();
    expect(dock().hidden).toBe(true);
    expect(music.mount).toHaveBeenCalledTimes(1);
  });

  it('unmounts the player when destroyed', () => {
    fixture.destroy();
    expect(music.unmount).toHaveBeenCalled();
  });
});