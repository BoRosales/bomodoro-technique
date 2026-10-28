import { Component } from '@angular/core';
import { CONTACT_EMAIL, CONTACT_MAILTO, LINKEDIN_URL } from '../contact-info';

@Component({
  imports: [],
  selector: 'app-contact',
  styleUrl: './contact.component.scss',
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  protected readonly email = CONTACT_EMAIL;
  protected readonly mailto = CONTACT_MAILTO;
  protected readonly linkedInUrl = LINKEDIN_URL;
}