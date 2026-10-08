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

function stopAudio() {
  if (audio) {
    audio.pause();
    audio.removeAttribute('src');
    audio = null;
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

/** Sets the preview volume (0–1) now and for later records, and remembers it for next visit. */
export function setVolume(volume: number) {
  const v = Math.min(1, Math.max(0, volume));
  if (audio) audio.volume = v;
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
