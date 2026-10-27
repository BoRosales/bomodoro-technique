import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChimeService } from '../chime.service';
import { TimerComponent } from './timer.component';

describe('TimerComponent', () => {
  let fixture: ComponentFixture<TimerComponent>;
  let el: HTMLElement;

  const text = (id: string) => el.querySelector(`[data-testid="${id}"]`)!.textContent!.trim();

  beforeEach(async () => {
    vi.useFakeTimers();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TimerComponent],
      providers: [{ provide: ChimeService, useValue: { play: vi.fn(), prime: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    localStorage.clear();
  });

  it('shows the focus phase and full time initially', () => {
    expect(text('phase')).toBe('Focus');
    expect(text('time')).toBe('25:00');
    expect(text('toggle')).toBe('Start');
    expect(text('sessions')).toBe('0');
  });

  it('starts, counts down and pauses via the button', () => {
    const button = el.querySelector<HTMLButtonElement>('[data-testid="toggle"]')!;
    button.click();
    vi.advanceTimersByTime(3_000);
    fixture.detectChanges();
    expect(text('toggle')).toBe('Pause');
    expect(text('time')).toBe('24:57');

    button.click();
    fixture.detectChanges();
    expect(text('toggle')).toBe('Resume');
  });

  it('shows the break phase after focus completes', () => {
    el.querySelector<HTMLButtonElement>('[data-testid="toggle"]')!.click();
    vi.advanceTimersByTime(25 * 60_000 + 500);
    fixture.detectChanges();
    expect(text('phase')).toBe('Break');
    expect(text('time')).toBe('05:00');
    expect(text('toggle')).toBe('Start');
    expect(text('sessions')).toBe('1');
  });
});