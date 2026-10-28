import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('shows the current year in the copyright', () => {
    expect(el.querySelector('[data-testid="copyright"]')!.textContent).toContain(String(new Date().getFullYear()));
  });

  it('links to the page sections and settings', () => {
    const hrefs = [...el.querySelectorAll('nav a')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/#about', '/settings', '/#contact']);
  });

  it('links to email and LinkedIn', () => {
    expect(el.querySelector('[data-testid="footer-email"]')!.getAttribute('href')).toMatch(/^mailto:bonirosales@gmail\.com/);
    const linkedIn = el.querySelector<HTMLAnchorElement>('[data-testid="footer-linkedin"]')!;
    expect(linkedIn.getAttribute('href')).toBe('https://www.linkedin.com/in/512-brosales');
    expect(linkedIn.rel).toContain('noopener');
  });

  it('scrolls back to the top', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    el.querySelector<HTMLButtonElement>('[data-testid="back-to-top"]')!.click();
    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    scrollTo.mockRestore();
  });
});