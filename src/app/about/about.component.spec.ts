import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TimerStateService } from '../timer-state.service';
import { AboutComponent } from './about.component';

describe('AboutComponent', () => {
  let fixture: ComponentFixture<AboutComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AboutComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('renders the about section with an anchor id', () => {
    expect(el.querySelector('section#about')).toBeTruthy();
    expect(el.querySelector('h2')!.textContent).toContain('Pomodoro Technique');
  });

  it('shows the current timer durations', async () => {
    expect(el.querySelector('[data-testid="focus-minutes"]')!.textContent).toBe('25');
    expect(el.querySelector('[data-testid="break-minutes"]')!.textContent).toBe('5');

    TestBed.inject(TimerStateService).updateSettings({ focusMinutes: 40, breakMinutes: 10 });
    await fixture.whenStable();
    expect(el.querySelector('[data-testid="focus-minutes"]')!.textContent).toBe('40');
    expect(el.querySelector('[data-testid="break-minutes"]')!.textContent).toBe('10');
  });

  it('links to settings', () => {
    expect(el.querySelector('a[href="/settings"]')).toBeTruthy();
  });
});