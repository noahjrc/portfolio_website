import { experience } from '@/data/content';
import { FONTS, wrapLines } from '@/lib/canvas';

export type CrtMode =
  | { kind: 'idle'; blink: boolean }
  | { kind: 'reading'; frame: number }
  | { kind: 'boot'; t: number }
  | { kind: 'game'; index: number; blink: boolean; page: number };

const BG = '#0b1440';
const INK = '#e8f1ff';
const YELLOW = '#ffd23f';
const CYAN = '#5ce1e6';
const MARGIN = 64;

const px = (size: number) => `400 ${size}px ${FONTS.pixel}`;

/** Draws one CRT frame; returns how many pages the current screen has (1 unless a game paginates). */
export function drawCrt(ctx: CanvasRenderingContext2D, w: number, h: number, mode: CrtMode): number {
  let pages = 1;
  ctx.save();
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(92, 225, 230, 0.035)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= w; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  ctx.textBaseline = 'top';

  switch (mode.kind) {
    case 'idle':
      ctx.textAlign = 'center';
      ctx.fillStyle = YELLOW;
      ctx.font = px(150);
      ctx.fillText('NO DISC', w / 2, 200);
      if (mode.blink) {
        ctx.fillStyle = INK;
        ctx.font = px(54);
        ctx.fillText('> INSERT A GAME TO START <', w / 2, 410);
      }
      ctx.fillStyle = CYAN;
      ctx.font = px(36);
      ctx.fillText('NOAH STATION', w / 2, 620);
      break;

    case 'reading':
      ctx.textAlign = 'center';
      ctx.fillStyle = INK;
      ctx.font = px(80);
      ctx.fillText(`READING DISC${'.'.repeat(mode.frame)}`, w / 2, 320);
      break;

    case 'boot': {
      ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, mode.t * 3);
      ctx.fillStyle = YELLOW;
      ctx.font = px(120);
      ctx.fillText('NOAH STATION', w / 2, 220);
      ctx.globalAlpha = 1;
      const barW = 600;
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.strokeRect((w - barW) / 2, 440, barW, 40);
      ctx.fillStyle = CYAN;
      ctx.fillRect((w - barW) / 2 + 6, 446, (barW - 12) * mode.t, 28);
      ctx.fillStyle = INK;
      ctx.font = px(40);
      ctx.fillText('LOADING', w / 2, 510);
      break;
    }

    case 'game':
      pages = drawGame(ctx, w, h, mode.index, mode.blink, mode.page);
      break;
  }
  ctx.restore();
  return pages;
}

/** Readable scales only: if the quests don't fit at one of these, they go onto more pages. */
const SCALES = [1, 0.94, 0.88];

/**
 * Fills pages greedily at full size: page 1 carries the job details plus as many quests
 * as fit; later pages are quests only. A quest too long for a page on its own gets the
 * largest readable scale that fits.
 */
function planPages(ctx: CanvasRenderingContext2D, w: number, limit: number, index: number) {
  const { bullets } = experience[index];
  const groups: string[][] = [];
  const scales: number[] = [];
  let i = 0;
  while (i < bullets.length) {
    const compact = groups.length > 0;
    const fits = (g: string[], s: number) => layoutGame(ctx, w, index, g, s, false, compact) <= limit;
    let group: string[] = [];
    while (i < bullets.length && fits([...group, bullets[i]], 1)) group.push(bullets[i++]);
    if (!group.length) group = [bullets[i++]];
    groups.push(group);
    scales.push(SCALES.find((s) => fits(group, s)) ?? SCALES[SCALES.length - 1]);
  }
  return { groups, scales };
}

function drawGame(ctx: CanvasRenderingContext2D, w: number, h: number, index: number, blink: boolean, page: number) {
  const exp = experience[index];

  ctx.fillStyle = exp.color;
  ctx.fillRect(0, 0, w, 104);
  ctx.fillStyle = BG;
  ctx.textAlign = 'left';
  ctx.font = px(72);
  ctx.fillText(exp.short, MARGIN, 18);
  ctx.textAlign = 'right';
  ctx.font = px(40);
  ctx.fillText(`DISC ${index + 1}/${experience.length}`, w - MARGIN, 34);
  ctx.textAlign = 'left';

  // Largest readable scale that fits above the footer; long quest lists split into pages.
  const { groups, scales } = planPages(ctx, w, h - 74, index);
  const p = page % groups.length;
  layoutGame(ctx, w, index, groups[p], scales[p], true, p > 0);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(0, h - 64, w, 64);
  ctx.font = px(34);
  if (groups.length > 1) {
    ctx.textAlign = 'left';
    ctx.fillStyle = CYAN;
    ctx.fillText(`PAGE ${p + 1}/${groups.length}  < > OR TAP`, MARGIN, h - 50);
  }
  if (blink) {
    ctx.textAlign = groups.length > 1 ? 'right' : 'center';
    ctx.fillStyle = YELLOW;
    ctx.fillText('PRESS THE CONSOLE TO EJECT', groups.length > 1 ? w - MARGIN : w / 2, h - 50);
  }
  return groups.length;
}

/** Lays out (and optionally draws) the body of a game screen with the given quests; returns the bottom y. */
function layoutGame(
  ctx: CanvasRenderingContext2D,
  w: number,
  index: number,
  bullets: string[],
  s: number,
  draw: boolean,
  compact = false,
) {
  const exp = experience[index];
  const maxW = w - MARGIN * 2;
  let y = 128;

  const label = (text: string) => {
    ctx.font = px(32 * s);
    if (draw) {
      ctx.fillStyle = CYAN;
      ctx.fillText(text, MARGIN, y);
    }
    y += 36 * s;
  };
  const block = (text: string, size: number, color: string) => {
    ctx.font = px(size * s);
    for (const line of wrapLines(ctx, text, maxW)) {
      if (draw) {
        ctx.fillStyle = color;
        ctx.fillText(line, MARGIN, y);
      }
      y += size * 1.05 * s;
    }
    y += 12 * s;
  };

  if (!compact) {
    label('PLAYER CLASS');
    block(exp.role, 46, INK);
    label('STUDIO');
    block(exp.company, 38, INK);
    label('TIME PLAYED');
    block(exp.dates, 36, YELLOW);
    label('LOADOUT');
    block(exp.skills.join(' · '), 30, INK);
  }
  label(compact ? 'QUESTS COMPLETED (CONT.)' : 'QUESTS COMPLETED');

  ctx.font = px(36 * s);
  const indent = 32 * s;
  for (const bullet of bullets) {
    wrapLines(ctx, bullet, maxW - indent).forEach((line, i) => {
      if (draw) {
        ctx.fillStyle = i === 0 ? YELLOW : INK;
        if (i === 0) ctx.fillText('>', MARGIN, y);
        ctx.fillStyle = INK;
        ctx.fillText(line, MARGIN + indent, y);
      }
      y += 40 * s;
    });
    y += 12 * s;
  }
  return y;
}

export const crtVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const crtFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uPower;
  varying vec2 vUv;

  vec2 curve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0, 5.0);
    uv = uv + uv * offset * offset;
    return uv * 0.5 + 0.5;
  }

  void main() {
    vec2 uv = curve(vUv);
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
      gl_FragColor = vec4(0.01, 0.01, 0.015, 1.0);
      return;
    }
    // Light-touch CRT: faint colour fringing and shallow scanlines keep the retro
    // feel without smearing small text.
    float shift = 0.0004;
    vec3 col = vec3(
      texture2D(uMap, uv + vec2(shift, 0.0)).r,
      texture2D(uMap, uv).g,
      texture2D(uMap, uv - vec2(shift, 0.0)).b
    );
    col *= 0.94 + 0.06 * sin(uv.y * 900.0);
    col *= 0.97 + 0.03 * sin(uTime * 9.0);
    float vignette = pow(16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y), 0.22);
    col *= vignette * 1.6;
    // Power-on: the picture opens out from a bright horizontal line.
    float open = step(abs(uv.y - 0.5), uPower * 0.5 + 0.004);
    col = col * open + vec3(1.0) * open * (1.0 - uPower) * 0.6;
    col += vec3(0.05) * smoothstep(0.35, 0.0, length(vUv - vec2(0.28, 0.78)));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
