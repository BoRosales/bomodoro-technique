import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive],
  selector: 'app-navbar',
  styleUrl: './navbar.component.scss',
  templateUrl: './navbar.component.html',
})
export class NavbarComponent {
  protected readonly menuOpen = signal(false);

  toggleMenu() {
    this.menuOpen.update(open => !open);
  }
}
