import { useEffect, useState, type DependencyList } from 'react';
import * as THREE from 'three';
import { display, hand, pixel, serif } from './fonts';

/** Font-family strings for canvas drawing (next/font hashes the real names). */
export const FONTS = {
  display: display.style.fontFamily,
  hand: hand.style.fontFamily,
  pixel: pixel.style.fontFamily,
  serif: serif.style.fontFamily,
};

let fontsReady: Promise<unknown> | null = null;

/** Canvas text only renders with a web font once the browser has actually loaded it. */
export function ensureFonts(): Promise<unknown> {
  if (!fontsReady) {
    fontsReady = Promise.all(
      [
        `400 40px ${FONTS.pixel}`,
        `400 40px ${FONTS.serif}`,
        `800 40px ${FONTS.serif}`,
        `italic 400 40px ${FONTS.serif}`,
        `400 40px ${FONTS.hand}`,
        `600 40px ${FONTS.hand}`,
        `400 40px ${FONTS.display}`,
        `800 40px ${FONTS.display}`,
      ].map((font) => document.fonts.load(font).catch(() => null)),
    );
  }
  return fontsReady;
}

const images = new Map<string, Promise<HTMLImageElement>>();

export function loadImage(src: string): Promise<HTMLImageElement> {
  let image = images.get(src);
  if (!image) {
    image = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
    images.set(src, image);
  }
  return image;
}

/** Small seeded PRNG so procedural textures look the same on every load. */
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Shrinks the font until `text` fits in `maxWidth`; leaves ctx.font set. */
export function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  start: number,
  min: number,
  font: (size: number) => string,
) {
  let size = start;
  ctx.font = font(size);
  while (size > min && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = font(size);
  }
  return size;
}

export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.max(w / img.width, h / img.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h);
}

const contentBoxes = new WeakMap<HTMLImageElement, { x: number; y: number; w: number; h: number }>();

/** The part of an image that isn't transparent or near-white padding (cached per image). */
function contentBox(img: HTMLImageElement) {
  let box = contentBoxes.get(img);
  if (box) return box;
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, img.width, img.height);
  let x0 = img.width;
  let y0 = img.height;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;
      const ink = data[i + 3] > 16 && !(data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238);
      if (ink) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  box = x1 < 0 ? { x: 0, y: 0, w: img.width, h: img.height } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  contentBoxes.set(img, box);
  return box;
}

/** Like drawContain, but first trims white or transparent margins so logos fill the space. */
export function drawLogo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const box = contentBox(img);
  const scale = Math.min(w / box.w, h / box.h);
  const dw = box.w * scale;
  const dh = box.h * scale;
  ctx.drawImage(img, box.x, box.y, box.w, box.h, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const scale = Math.min(w / img.width, h / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

export function makeCanvasTexture(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function ctxOf(texture: THREE.Texture) {
  return (texture.image as unknown as HTMLCanvasElement).getContext('2d')!;
}

export type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void | Promise<void>;

/** A texture backed by a 2D canvas, redrawn (after fonts load) whenever `deps` change. */
export function useCanvasTexture(width: number, height: number, draw: Draw, deps: DependencyList = []) {
  const [texture] = useState(() => makeCanvasTexture(width, height));
  useEffect(() => {
    let live = true;
    (async () => {
      await ensureFonts();
      if (!live) return;
      const ctx = ctxOf(texture);
      ctx.clearRect(0, 0, width, height);
      await draw(ctx, width, height);
      if (live) texture.needsUpdate = true;
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/** Crops a loaded image texture like CSS `object-fit: cover` for a plane of the given aspect. */
export function coverFit(texture: THREE.Texture, aspect: number) {
  const img = texture.image as unknown as { width: number; height: number };
  const imageAspect = img.width / img.height;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  if (imageAspect > aspect) {
    texture.repeat.x = aspect / imageAspect;
    texture.offset.x = (1 - texture.repeat.x) / 2;
  } else {
    texture.repeat.y = imageAspect / aspect;
    texture.offset.y = (1 - texture.repeat.y) / 2;
  }
}
