import { useSyncExternalStore } from 'react';

export type View = 'overview' | 'about' | 'experience' | 'projects' | 'interests' | 'resume';
export type Zone = Exclude<View, 'overview'>;
export type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'unavailable';

export interface Track {
  name: string;
  previewUrl: string;
  storeUrl: string;
}

export interface State {
  view: View;
  /** Tooltip text for whatever 3D object is under the pointer. */
  hovered: string | null;
  /** Index of the experience disc in the console. */
  disc: number | null;
  /** Current cookbook spread (0 = contents). */
  page: number;
  /** Index of the album on the turntable. */
  album: number | null;
  status: PlayerStatus;
  track: Track | null;
  /** Preview volume, 0–1. */
  volume: number;
  /** True once every texture in the room has loaded. */
  ready: boolean;
  /** CRT paging for the loaded game: how many pages it has, which is showing, and when it last turned (ms). */
  crtPages: number;
  crtPage: number;
  crtPageAt: number;
}

let state: State = {
  view: 'overview',
  hovered: null,
  disc: null,
  page: 0,
  album: null,
  status: 'idle',
  track: null,
  volume: 0.6,
  ready: false,
  crtPages: 1,
  crtPage: 0,
  crtPageAt: 0,
};

const listeners = new Set<() => void>();

export const getState = () => state;

export function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}

export function setView(view: View) {
  setState({ view, hovered: null });
}

/**
 * Turns the CRT page by `dir`. With `spill`, stepping past either end loads the
 * neighbouring game instead of wrapping. Returns false if no game is showing.
 */
export function turnCrtPage(dir: 1 | -1, gameCount: number, spill = false): boolean {
  const { disc, crtPage, crtPages } = state;
  if (disc === null) return false;
  const next = crtPage + dir;
  if (spill && (next < 0 || next >= crtPages)) {
    setState({ disc: (disc + dir + gameCount) % gameCount });
    return true;
  }
  setState({ crtPage: (next + crtPages) % crtPages, crtPageAt: performance.now() });
  return true;
}
