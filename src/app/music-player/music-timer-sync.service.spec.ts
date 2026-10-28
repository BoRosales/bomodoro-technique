import { TestBed } from '@angular/core/testing';
import { ChimeService } from '../chime.service';
import { TimerStateService } from '../timer-state.service';
import { MusicPlayer } from './music-player';
import { MusicTimerSync } from './music-timer-sync.service';
import { FakeMusicPlayer } from './testing';

describe('MusicTimerSync', () => {
  let music: FakeMusicPlayer;
  let timer: TimerStateService;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    music = new FakeMusicPlayer();
    for (const method of ['mount', 'unmount', 'play', 'pause'] as const) {
      vi.spyOn(music, method);
    }
    TestBed.configureTestingModule({
      providers: [
        { provide: MusicPlayer, useValue: music },
        { provide: ChimeService, useValue: { play: vi.fn(), prime: vi.fn() } },
      ],
    });
    timer = TestBed.inject(TimerStateService);
    TestBed.inject(MusicTimerSync).start();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('plays when focus starts and pauses when focus is paused', () => {
    timer.start();
    expect(music.play).toHaveBeenCalledTimes(1);
    timer.pause();
    expect(music.pause).toHaveBeenCalledTimes(1);
    timer.start();
    expect(music.play).toHaveBeenCalledTimes(2);
  });

  it('pauses when the focus session ends and stays off for the break', () => {
    timer.start();
    vi.advanceTimersByTime(25 * 60_000 + 500);
    expect(timer.phase()).toBe('break');
    expect(music.pause).toHaveBeenCalledTimes(1);

    timer.start();
    timer.pause();
    vi.advanceTimersByTime(1);
    expect(music.play).toHaveBeenCalledTimes(1);
    expect(music.pause).toHaveBeenCalledTimes(1);
  });

  it('does not touch music when the break ends', () => {
    timer.start();
    vi.advanceTimersByTime(25 * 60_000 + 500);
    timer.start();
    vi.advanceTimersByTime(5 * 60_000 + 500);
    expect(timer.phase()).toBe('focus');
    expect(music.pause).toHaveBeenCalledTimes(1);
  });

  it('stops reacting after stop()', () => {
    TestBed.inject(MusicTimerSync).stop();
    timer.start();
    expect(music.play).not.toHaveBeenCalled();
  });
});