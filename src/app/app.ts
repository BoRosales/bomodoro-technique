import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './footer/footer.component';
import { MusicDockComponent } from './music-dock/music-dock.component';
import { NavbarComponent } from './navbar/navbar.component';

@Component({
  imports: [RouterOutlet, NavbarComponent, FooterComponent, MusicDockComponent],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}
