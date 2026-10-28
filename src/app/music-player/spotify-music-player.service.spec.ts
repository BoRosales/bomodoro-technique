import { TestBed } from '@angular/core/testing';
import { SpotifyEmbedController, SpotifyEmbedLoader, SpotifyPlaybackUpdate } from './spotify-embed-loader.service';
import { PLAYLIST_URI, SpotifyMusicPlayer } from './spotify-music-player.service';

describe('SpotifyMusicPlayer', () => {
  let listeners: Record<string, (e?: SpotifyPlaybackUpdate) => void>;
  let controller: SpotifyEmbedController;
  let createController: ReturnType<typeof vi.fn>;
  let load: ReturnType<typeof vi.fn>;
  let player: SpotifyMusicPlayer;
  const host = document.createElement('div');
  const flush = () => new Promise(resolve => setTimeout(resolve));
  const update = (isPaused: boolean) =>
    listeners['playback_update']({ data: { isPaused, isBuffering: false, position: 0, duration: 1 } });

  function setup(): void {
    TestBed.configureTestingModule({ providers: [{ provide: SpotifyEmbedLoader, useValue: { load } }] });
    player = TestBed.inject(SpotifyMusicPlayer);
  }

  beforeEach(() => {
    listeners = {};
    controller = {
      addListener: vi.fn((event: string, handler: (e?: SpotifyPlaybackUpdate) => void) => (listeners[event] = handler)),
      togglePlay: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      destroy: vi.fn(),
    } as unknown as SpotifyEmbedController;
    createController = vi.fn((_el, _opts, cb) => cb(controller));
    load = vi.fn(() => Promise.resolve({ createController }));
  });

  afterEach(() => {
    player?.unmount();
    TestBed.resetTestingModule();
  });

  it('creates an embed for the playlist and becomes ready', async () => {
    setup();
    player.mount(host);
    await flush();
    expect(createController).toHaveBeenCalledWith(host, expect.objectContaining({ uri: PLAYLIST_URI }), expect.any(Function));
    expect(player.status()).toBe('loading');

    listeners['ready']();
    expect(player.status()).toBe('ready');
  });

  it('ignores play/pause until ready', async () => {
    setup();
    player.mount(host);
    await flush();
    player.play();
    player.pause();
    expect(controller.resume).not.toHaveBeenCalled();
    expect(controller.pause).not.toHaveBeenCalled();
  });

  it('plays, pauses, toggles and tracks playback state', async () => {
    setup();
    player.mount(host);
    await flush();
    listeners['ready']();

    player.play();
    expect(controller.resume).toHaveBeenCalled();
    update(false);
    expect(player.isPlaying()).toBe(true);

    player.toggle();
    expect(controller.pause).toHaveBeenCalled();
    update(true);
    expect(player.isPlaying()).toBe(false);
  });

  it('reports an error if the API fails to load', async () => {
    load = vi.fn(() => Promise.reject(new Error('blocked')));
    setup();
    player.mount(host);
    await flush();
    expect(player.status()).toBe('error');
    expect(player.fallbackUrl).toContain('open.spotify.com/playlist/');
  });

  it('destroys the embed on unmount and ignores late events', async () => {
    setup();
    player.mount(host);
    await flush();
    listeners['ready']();
    update(false);

    player.unmount();
    expect(controller.destroy).toHaveBeenCalled();
    expect(player.status()).toBe('loading');
    expect(player.isPlaying()).toBe(false);

    update(false);
    expect(player.isPlaying()).toBe(false);
  });

  it('skips creating the embed if unmounted before the API loads', async () => {
    setup();
    player.mount(host);
    player.unmount();
    await flush();
    expect(createController).not.toHaveBeenCalled();
  });

  it('destroys an embed whose creation finishes after unmount', async () => {
    let finishCreate: () => void = () => {};
    createController = vi.fn((_el, _opts, cb) => (finishCreate = () => cb(controller)));
    setup();
    player.mount(host);
    await flush();
    player.unmount();
    finishCreate();
    expect(controller.destroy).toHaveBeenCalled();
  });
});