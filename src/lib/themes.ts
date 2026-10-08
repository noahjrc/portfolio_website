export type StyleName = 'pop' | 'lofi' | 'synth' | 'midcentury';

export interface RoomTheme {
  label: string;
  background: string;
  wall: string;
  trim: string;
  rail: string;
  floor: string[];
  floorSeam: string;
  rug: [string, string, string];
  stand: string;
  standDoor: string;
  knob: string;
  cabinet: string;
  cabinetDoor: string;
  table: string;
  legs: string;
  shade: string;
  mug: string;
  pot: string;
  leaves: [string, string];
  frame: string;
  neon: { glow: string; mid: string; core: string };
  ledge: string;
  speaker: string;
  book: string;
  sky: [string, string, string];
  hills: string;
  fridge: string;
  counter: string;
  kitchenCabinet: string;
  kitchenDoor: string;
  duvet: string;
  pillow: string;
  bedFrame: string;
  beanbag: string;
  lights: {
    sky: string;
    ground: string;
    hemi: number;
    ambient: number;
    sun: string;
    sunIntensity: number;
    lamp: string;
    lampIntensity: number;
  };
}

export const STYLES: Record<StyleName, RoomTheme> = {
  pop: {
    label: 'Pop',
    background: '#1e1b33',
    wall: '#f6e7cf',
    trim: '#2b3a67',
    rail: '#fff6e5',
    floor: ['#b97a4b', '#a96d42', '#c4854f', '#b0723f', '#bd7f4c'],
    floorSeam: 'rgba(60, 30, 10, 0.4)',
    rug: ['#ff5a36', '#ffc93c', '#ff5a36'],
    stand: '#3a86ff',
    standDoor: '#2a64c4',
    knob: '#ffc93c',
    cabinet: '#ffc93c',
    cabinetDoor: '#f0b322',
    table: '#e9d8b4',
    legs: '#15122b',
    shade: '#ffc93c',
    mug: '#3a86ff',
    pot: '#ff5a36',
    leaves: ['#2e8b57', '#3fa66a'],
    frame: '#ffc93c',
    neon: { glow: '#ff4fa3', mid: '#ff7cc0', core: '#ffe3f2' },
    ledge: '#15122b',
    speaker: '#15122b',
    book: '#c0392b',
    sky: ['#28306e', '#7a4d9a', '#ff9e6d'],
    hills: '#2b2350',
    fridge: '#7fd6c2',
    counter: '#fff6e5',
    kitchenCabinet: '#ff5a36',
    kitchenDoor: '#e84a28',
    duvet: '#3a86ff',
    pillow: '#fff6e5',
    bedFrame: '#15122b',
    beanbag: '#ff4fa3',
    lights: { sky: '#fff2e0', ground: '#3b2f5a', hemi: 1.1, ambient: 0.35, sun: '#fff4e6', sunIntensity: 2.2, lamp: '#ffcf8a', lampIntensity: 6 },
  },
  lofi: {
    label: 'Lo-fi dusk',
    background: '#2a2440',
    wall: '#e8dcef',
    trim: '#8a7fb5',
    rail: '#f7f0ff',
    floor: ['#c9a27e', '#bf9672', '#d1ac88', '#c49c78', '#cba480'],
    floorSeam: 'rgba(90, 60, 50, 0.25)',
    rug: ['#f4a7b9', '#ffd6a5', '#f4a7b9'],
    stand: '#9bb7d4',
    standDoor: '#86a3c2',
    knob: '#ffd6a5',
    cabinet: '#f6c6a8',
    cabinetDoor: '#eab497',
    table: '#f3e9dc',
    legs: '#5b5170',
    shade: '#ffd6a5',
    mug: '#f4a7b9',
    pot: '#c3aed6',
    leaves: ['#7fb59a', '#94c7ab'],
    frame: '#f7f0ff',
    neon: { glow: '#9d8cff', mid: '#b8acff', core: '#f0edff' },
    ledge: '#5b5170',
    speaker: '#5b5170',
    book: '#8a7fb5',
    sky: ['#3b3a78', '#9a7fc4', '#ffb4a2'],
    hills: '#4a3f72',
    fridge: '#bfe3d6',
    counter: '#fffaff',
    kitchenCabinet: '#c3aed6',
    kitchenDoor: '#b49dca',
    duvet: '#f4a7b9',
    pillow: '#fffaff',
    bedFrame: '#5b5170',
    beanbag: '#9bb7d4',
    lights: { sky: '#ffe9f0', ground: '#4a3f72', hemi: 1.25, ambient: 0.45, sun: '#ffd9c7', sunIntensity: 1.6, lamp: '#ffb88a', lampIntensity: 9 },
  },
  synth: {
    label: 'Synthwave',
    background: '#0b0618',
    wall: '#2a1850',
    trim: '#1a0b3b',
    rail: '#00e5ff',
    floor: ['#1a0f36', '#1d1140', '#170c30', '#1f1244', '#1b1039'],
    floorSeam: 'rgba(0, 229, 255, 0.55)',
    rug: ['#ff2bd6', '#00e5ff', '#ff2bd6'],
    stand: '#3a1f78',
    standDoor: '#4a2a94',
    knob: '#00e5ff',
    cabinet: '#3a1f78',
    cabinetDoor: '#4a2a94',
    table: '#3a1f78',
    legs: '#00e5ff',
    shade: '#ff2bd6',
    mug: '#00e5ff',
    pot: '#ff2bd6',
    leaves: ['#00b894', '#00d6a8'],
    frame: '#00e5ff',
    neon: { glow: '#00e5ff', mid: '#5ff3ff', core: '#e6feff' },
    ledge: '#00e5ff',
    speaker: '#120a28',
    book: '#ff2bd6',
    sky: ['#12063a', '#7a1fa2', '#ff6ec7'],
    hills: '#1a0b3b',
    fridge: '#2a1850',
    counter: '#120a28',
    kitchenCabinet: '#3a1f78',
    kitchenDoor: '#4a2a94',
    duvet: '#ff2bd6',
    pillow: '#00e5ff',
    bedFrame: '#120a28',
    beanbag: '#00e5ff',
    lights: { sky: '#c9b8ff', ground: '#1a0b3b', hemi: 0.9, ambient: 0.3, sun: '#d6c7ff', sunIntensity: 1.4, lamp: '#ff2bd6', lampIntensity: 12 },
  },
  midcentury: {
    label: 'Mid-century',
    background: '#2b2118',
    wall: '#efe3cc',
    trim: '#5a6b3a',
    rail: '#f6eddc',
    floor: ['#7a4a2a', '#6e4224', '#83512f', '#744628', '#7f4d2c'],
    floorSeam: 'rgba(30, 15, 5, 0.45)',
    rug: ['#d9822b', '#efe3cc', '#3f5e5a'],
    stand: '#8a5a34',
    standDoor: '#7a4c2a',
    knob: '#d9a441',
    cabinet: '#3f5e5a',
    cabinetDoor: '#36524e',
    table: '#a0683c',
    legs: '#2b2118',
    shade: '#efe3cc',
    mug: '#d9822b',
    pot: '#c96f2d',
    leaves: ['#4f6b3a', '#62804a'],
    frame: '#2b2118',
    neon: { glow: '#ff9d3c', mid: '#ffb866', core: '#fff1dc' },
    ledge: '#5a3a22',
    speaker: '#5a3a22',
    book: '#3f5e5a',
    sky: ['#1f2a44', '#b5652d', '#f3b562'],
    hills: '#2b2118',
    fridge: '#e8dcc0',
    counter: '#efe3cc',
    kitchenCabinet: '#3f5e5a',
    kitchenDoor: '#36524e',
    duvet: '#d9822b',
    pillow: '#efe3cc',
    bedFrame: '#6e4224',
    beanbag: '#d9a441',
    lights: { sky: '#fff0d9', ground: '#4a3424', hemi: 1.0, ambient: 0.3, sun: '#ffe2b8', sunIntensity: 2.4, lamp: '#ffb35c', lampIntensity: 7 },
  },
};

export const STYLE_NAMES = Object.keys(STYLES) as StyleName[];

/** The active style comes from `?style=` so drafts can be compared side by side. */
export function currentStyle(): StyleName {
  if (typeof window === 'undefined') return 'midcentury';
  const requested = new URLSearchParams(window.location.search).get('style');
  return requested && requested in STYLES ? (requested as StyleName) : 'midcentury';
}

export function roomTheme(): RoomTheme {
  return STYLES[currentStyle()];
}
