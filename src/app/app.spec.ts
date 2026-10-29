import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { MusicPlayer } from './music-player/music-player';
import { FakeMusicPlayer } from './music-player/testing';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: MusicPlayer, useValue: new FakeMusicPlayer() }],
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-bs-theme');
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the shell: navbar, page content, footer, then the music dock', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('app-navbar .navbar-brand')?.textContent).toContain('Bomodoro');
    expect(el.querySelector('main router-outlet')).toBeTruthy();

    const order = ['app-navbar', 'main', 'app-footer', 'app-music-dock'];
    const found = [...el.querySelectorAll(order.join(','))].map(e => e.tagName.toLowerCase());
    expect(found).toEqual(order);
  });
});