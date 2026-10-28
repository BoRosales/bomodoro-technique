import { TestBed } from '@angular/core/testing';
import { ContactComponent } from './contact.component';

describe('ContactComponent', () => {
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ContactComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ContactComponent);
    el = fixture.nativeElement;
    await fixture.whenStable();
  });

  it('renders the contact section with an anchor id', () => {
    expect(el.querySelector('section#contact')).toBeTruthy();
  });

  it('links to the email address', () => {
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="email"]')!;
    expect(link.getAttribute('href')).toMatch(/^mailto:bonirosales@gmail\.com\?subject=/);
    expect(link.textContent).toContain('bonirosales@gmail.com');
  });

  it('links to LinkedIn in a new tab safely', () => {
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="linkedin"]')!;
    expect(link.getAttribute('href')).toBe('https://www.linkedin.com/in/512-brosales');
    expect(link.target).toBe('_blank');
    expect(link.rel).toContain('noopener');
  });
});