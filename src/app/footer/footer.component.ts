import { Component, DOCUMENT, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CONTACT_MAILTO, LINKEDIN_URL } from '../contact-info';

@Component({
  imports: [RouterLink],
  selector: 'app-footer',
  styleUrl: './footer.component.scss',
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly year = new Date().getFullYear();
  protected readonly mailto = CONTACT_MAILTO;
  protected readonly linkedInUrl = LINKEDIN_URL;

  scrollToTop(): void {
    const reduceMotion = this.window?.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.window?.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}