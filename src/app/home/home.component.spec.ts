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

  it('shows the timer, then about, then contact', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const timer = el.querySelector('app-timer');
    const about = el.querySelector('app-about');
    const contact = el.querySelector('app-contact');

    expect(timer).toBeTruthy();
    expect(about).toBeTruthy();
    expect(contact).toBeTruthy();
    expect(timer!.compareDocumentPosition(about!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(about!.compareDocumentPosition(contact!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});