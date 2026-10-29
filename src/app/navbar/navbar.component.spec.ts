import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ThemeService } from '../theme.service';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<NavbarComponent>;
  let el: HTMLElement;

  const toggle = () => el.querySelector<HTMLButtonElement>('[data-testid="theme-toggle"]')!;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    TestBed.inject(ThemeService).set('light');

    fixture = TestBed.createComponent(NavbarComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
  });

  it('renders the navigation links', () => {
    const hrefs = [...el.querySelectorAll('a.nav-link')].map(a => a.getAttribute('href'));
    expect(hrefs).toEqual(['/', '/settings', '/#about', '/#contact']);
  });

  it('toggles dark mode from the navbar', async () => {
    expect(toggle().getAttribute('aria-label')).toBe('Switch to dark mode');

    toggle().click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    expect(toggle().getAttribute('aria-label')).toBe('Switch to light mode');

    toggle().click();
    await fixture.whenStable();
    expect(document.documentElement.getAttribute('data-bs-theme')).toBe('light');
  });

  it('keeps the theme toggle outside the collapsible menu', () => {
    expect(el.querySelector('.navbar-collapse [data-testid="theme-toggle"]')).toBeNull();
  });
});