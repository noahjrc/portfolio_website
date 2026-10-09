import { albums, type Album } from '@/data/content';
import { getState, setState, type Track } from './store';

/** How long the record takes to travel to the platter and the needle to drop. */
const NEEDLE_DROP_MS = 2300;

interface ItunesResult {
  wrapperType?: string;
  trackName?: string;
  collectionName?: string;
  previewUrl?: string;
  trackViewUrl?: string;
  collectionViewUrl?: string;
}

let audio: HTMLAudioElement | null = null;
let token = 0;

// When this module is reloaded (hot reload during development), the old copy's
// audio would keep playing with nothing left to stop it. Each copy registers a
// stopper on window, and a new copy runs the previous one first.
type PlayerGlobal = { __recordPlayerStop?: () => void };
if (typeof window !== 'undefined') {
  const g = window as unknown as PlayerGlobal;
  g.__recordPlayerStop?.();
  g.__recordPlayerStop = () => {
    token++;
    stopAudio();
    ytHost?.remove();
  };
}
const previews = new Map<string, Promise<Track | null>>();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const norm = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, ' ').trim();

// The iTunes Search API supports JSONP, which sidesteps CORS on a static site.
function jsonp(url: string): Promise<{ results: ItunesResult[] }> {
  return new Promise((resolve, reject) => {
    const callback = `__itunes_${Math.random().toString(36).slice(2)}`;
    const registry = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('iTunes lookup timed out'));
    }, 8000);
    function cleanup() {
      clearTimeout(timer);
      delete registry[callback];
      script.remove();
    }
    registry[callback] = (data: { results: ItunesResult[] }) => {
      cleanup();
      resolve(data);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('iTunes lookup failed'));
    };
    script.src = `${url}&callback=${callback}`;
    document.body.appendChild(script);
  });
}

// Looks the album up by its exact Apple id, so a preview can only ever come from that record.
function findPreview(album: Album): Promise<Track | null> {
  if (!album.appleId) return Promise.resolve(null);
  let preview = previews.get(album.coverImage);
  if (!preview) {
    preview = jsonp(`https://itunes.apple.com/lookup?id=${album.appleId}&entity=song&limit=200`)
      .then(({ results }) => {
        const songs = results.filter((r) => r.wrapperType === 'track' && r.previewUrl);
        const wanted = album.track ? norm(album.track) : null;
        const pick = (wanted && songs.find((r) => norm(r.trackName ?? '').startsWith(wanted))) || songs[0];
        if (!pick?.previewUrl) return null;
        return {
          name: pick.trackName ?? album.title,
          previewUrl: pick.previewUrl,
          storeUrl: pick.trackViewUrl ?? pick.collectionViewUrl ?? '',
        };
      })
      .catch(() => {
        previews.delete(album.coverImage);
        return null;
      });
    previews.set(album.coverImage, preview);
  }
  return preview;
}

// ─── YouTube (albums with no Apple previews) ─────────────────────────────
// The IFrame API lets our own play/pause and volume drive the video. YouTube
// requires its player to stay visible, so it lives in a fixed host that the
// Now Playing card positions over its `.yt-slot` (see `placeYoutube`).

interface YtPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  loadVideoById(id: string): void;
  setVolume(volume: number): void;
}
interface YtApi {
  Player: new (el: HTMLElement, options: Record<string, unknown>) => YtPlayer;
}

const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_ENDED = 0;

let ytApi: Promise<YtApi> | null = null;
let ytPlayer: Promise<YtPlayer> | null = null;
let ytHost: HTMLDivElement | null = null;
/** True while the record on the platter is the YouTube one; stale events are ignored otherwise. */
let ytActive = false;

function loadYoutubeApi(): Promise<YtApi> {
  if (!ytApi) {
    ytApi = new Promise<YtApi>((resolve, reject) => {
      const w = window as unknown as { YT?: YtApi; onYouTubeIframeAPIReady?: () => void };
      if (w.YT?.Player) return resolve(w.YT);
      // Blocked by an ad blocker or a network filter: give up rather than hang.
      const timer = setTimeout(() => reject(new Error('YouTube API timed out')), 10000);
      w.onYouTubeIframeAPIReady = () => {
        clearTimeout(timer);
        resolve(w.YT!);
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.onerror = () => {
        clearTimeout(timer);
        reject(new Error('YouTube API failed to load'));
      };
      document.head.appendChild(script);
    }).catch((err) => {
      ytApi = null; // let a later pick try again
      throw err;
    });
  }
  return ytApi;
}

/** The video couldn't play (removed, embedding turned off, or YouTube blocked). */
function youtubeFailed() {
  if (!ytActive) return;
  ytActive = false;
  placeYoutube(null);
  setState({ status: 'unavailable' });
}

function youtubeHost() {
  if (!ytHost) {
    ytHost = document.createElement('div');
    ytHost.className = 'yt-host';
    Object.assign(ytHost.style, {
      position: 'fixed',
      zIndex: '60',
      overflow: 'hidden',
      borderRadius: '8px',
      left: '-10000px',
      top: '0',
      width: '320px',
      height: '200px',
    });
    ytHost.appendChild(document.createElement('div'));
    document.body.appendChild(ytHost);
  }
  return ytHost;
}

/** Lays the YouTube player over the card's slot, or tucks it away when the card is closed. */
export function placeYoutube(rect: DOMRect | null) {
  if (!ytHost) return;
  const s = ytHost.style;
  if (!rect || !ytActive) {
    s.left = '-10000px';
    return;
  }
  s.left = `${rect.left}px`;
  s.top = `${rect.top}px`;
  s.width = `${rect.width}px`;
  s.height = `${rect.height}px`;
}

function playYoutube(videoId: string) {
  ytActive = true;
  if (ytPlayer) {
    ytPlayer.then((p) => {
      p.setVolume(getState().volume * 100);
      p.loadVideoById(videoId);
    });
    return;
  }
  ytPlayer = loadYoutubeApi().then(
    (YT) =>
      new Promise<YtPlayer>((resolve) => {
        const target = youtubeHost().firstElementChild as HTMLElement;
        new YT.Player(target, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
          events: {
            onReady: (e: { target: YtPlayer }) => {
              e.target.setVolume(getState().volume * 100);
              if (ytActive) e.target.playVideo();
              else e.target.stopVideo();
              resolve(e.target);
            },
            onStateChange: (e: { data: number }) => {
              if (!ytActive) return;
              if (e.data === YT_PLAYING) setState({ status: 'playing' });
              else if (e.data === YT_PAUSED) setState({ status: 'paused' });
              else if (e.data === YT_ENDED) setState({ status: 'ended' });
            },
            onError: youtubeFailed,
          },
        });
      }),
  );
  ytPlayer.catch(() => {
    ytPlayer = null;
    youtubeFailed();
  });
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio = null;
  }
  if (ytActive) {
    ytActive = false;
    ytPlayer?.then((p) => p.stopVideo());
    placeYoutube(null);
  }
}

export async function playAlbum(index: number) {
  if (getState().album === index) {
    togglePlayback();
    return;
  }
  const mine = ++token;
  stopAudio();
  setState({ album: index, status: 'loading', track: null });

  const { youtube, track: song, title } = albums[index];
  if (youtube) {
    await delay(NEEDLE_DROP_MS);
    if (mine !== token) return;
    // Starts as paused: the player reports `playing` once it actually starts
    // (a browser that blocks autoplay leaves it for the play button).
    setState({
      status: 'paused',
      track: { name: song ?? title, previewUrl: '', storeUrl: `https://www.youtube.com/watch?v=${youtube}` },
    });
    playYoutube(youtube);
    return;
  }

  const [track] = await Promise.all([findPreview(albums[index]), delay(NEEDLE_DROP_MS)]);
  if (mine !== token) return;
  if (!track) {
    setState({ status: 'unavailable' });
    return;
  }

  const el = new Audio(track.previewUrl);
  el.volume = getState().volume;
  el.addEventListener('ended', () => {
    if (audio === el) setState({ status: 'ended' });
  });
  audio = el;
  setState({ track });
  try {
    await el.play();
    if (audio === el) setState({ status: 'playing' });
  } catch {
    // Autoplay was blocked; the play button will start it.
    if (audio === el) setState({ status: 'paused' });
  }
}

export function togglePlayback() {
  if (ytActive) {
    const playing = getState().status === 'playing';
    ytPlayer?.then((p) => (playing ? p.pauseVideo() : p.playVideo()));
    return;
  }
  const el = audio;
  if (!el) return;
  if (el.paused) {
    el.play()
      .then(() => {
        if (audio === el) setState({ status: 'playing' });
      })
      .catch(() => {});
  } else {
    el.pause();
    setState({ status: 'paused' });
  }
}

const VOLUME_KEY = 'noahjrc.volume';

let volumeSettable: boolean | null = null;
/** False on iOS, where pages can't change audio volume (only the hardware buttons can). */
export function canSetVolume() {
  if (volumeSettable === null) {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeSettable = probe.volume === 0.5;
  }
  return volumeSettable;
}

/** Sets the preview volume (0–1) now and for later records, and remembers it for next visit. */
export function setVolume(volume: number) {
  const v = Math.min(1, Math.max(0, volume));
  if (audio) audio.volume = v;
  ytPlayer?.then((p) => p.setVolume(v * 100));
  setState({ volume: v });
  try {
    localStorage.setItem(VOLUME_KEY, String(v));
  } catch {
    // Storage unavailable (private mode): the level just won't persist.
  }
}

/** Restores the remembered volume, if any. */
export function loadSavedVolume() {
  try {
    const saved = Number(localStorage.getItem(VOLUME_KEY));
    if (localStorage.getItem(VOLUME_KEY) !== null && Number.isFinite(saved)) setState({ volume: Math.min(1, Math.max(0, saved)) });
  } catch {
    // Ignore: falls back to the default level.
  }
}

export function ejectRecord() {
  token++;
  stopAudio();
  setState({ album: null, status: 'idle', track: null });
}

export function shuffleAlbum() {
  const current = getState().album;
  let next = Math.floor(Math.random() * albums.length);
  if (albums.length > 1) {
    while (next === current) next = Math.floor(Math.random() * albums.length);
  }
  playAlbum(next);
}
