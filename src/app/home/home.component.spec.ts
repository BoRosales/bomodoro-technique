import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('shows the timer, tasks, about, then contact', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const order = ['app-timer', 'app-todo-list', 'app-about', 'app-contact'];
    const found = [...el.querySelectorAll(order.join(','))].map(e => e.tagName.toLowerCase());

    expect(found).toEqual(order);
  });
});