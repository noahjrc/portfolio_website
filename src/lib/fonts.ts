import { Caveat, Fraunces, Jost, VT323 } from 'next/font/google';

export const display = Jost({ subsets: ['latin'], variable: '--font-display' });
export const pixel = VT323({ subsets: ['latin'], weight: '400', variable: '--font-pixel' });
export const hand = Caveat({ subsets: ['latin'], variable: '--font-hand' });
export const serif = Fraunces({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-serif' });

export const fontVariables = [display, pixel, hand, serif].map((f) => f.variable).join(' ');
