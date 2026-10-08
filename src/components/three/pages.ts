import { profile, projects, type Project } from '@/data/content';
import { FONTS, drawCover, fitFont, loadImage, rng, wrapLines } from '@/lib/canvas';

/** Spread 0 is the title page + contents; each project gets one spread after that. */
export const SPREADS = projects.length + 1;

const INK = '#2a2238';
const RED = '#c0392b';
const MUTED = '#7a6f66';
const PAPER = '#f8f1e3';
const M = 80;

const serif = (size: number, weight = 400, italic = false) =>
  `${italic ? 'italic ' : ''}${weight} ${size}px ${FONTS.serif}`;
const hand = (size: number, weight = 400) => `${weight} ${size}px ${FONTS.hand}`;
const spaced = (s: string) => s.split('').join(' ');
const pad = (n: number) => String(n).padStart(2, '0');

export async function drawPage(ctx: CanvasRenderingContext2D, w: number, h: number, index: number) {
  const left = index % 2 === 0;
  const spread = Math.floor(index / 2);
  paper(ctx, w, h, left, index);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  if (spread === 0) {
    if (left) titlePage(ctx, w, h);
    else contentsPage(ctx, w, h);
  } else {
    const project = projects[spread - 1];
    if (left) await ingredientsPage(ctx, w, project, spread);
    else methodPage(ctx, w, h, project, spread);
  }
  ctx.restore();

  ctx.fillStyle = MUTED;
  ctx.font = serif(24, 400, true);
  ctx.textAlign = 'center';
  ctx.fillText(String(index + 1), w / 2, h - 46);
}

function paper(ctx: CanvasRenderingContext2D, w: number, h: number, left: boolean, seed: number) {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, w, h);
  const rand = rng(seed * 97 + 13);
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(120, 90, 50, ${0.03 + rand() * 0.05})`;
    ctx.fillRect(rand() * w, rand() * h, 1 + rand() * 2, 1 + rand() * 2);
  }
  // Shadow in the gutter where the pages meet the spine.
  const gutter = left ? ctx.createLinearGradient(w - 90, 0, w, 0) : ctx.createLinearGradient(90, 0, 0, 0);
  gutter.addColorStop(0, 'rgba(90, 60, 30, 0)');
  gutter.addColorStop(1, 'rgba(90, 60, 30, 0.22)');
  ctx.fillStyle = gutter;
  ctx.fillRect(0, 0, w, h);
}

function underline(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 1; i <= 8; i++) {
    ctx.quadraticCurveTo(x + (i - 0.5) * (width / 8), y + (i % 2 ? -6 : 6), x + i * (width / 8), y);
  }
  ctx.stroke();
}

function titlePage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.strokeRect(54, 54, w - 108, h - 108);
  ctx.lineWidth = 1.5;
  ctx.strokeRect(68, 68, w - 136, h - 136);

  ctx.textAlign = 'center';
  ctx.fillStyle = RED;
  ctx.font = serif(24, 600);
  ctx.fillText(spaced('A COOKBOOK OF PROJECTS'), w / 2, 190);
  ctx.fillStyle = INK;
  ctx.font = serif(72, 400, true);
  ctx.fillText("Noah's", w / 2, 310);
  ctx.font = serif(124, 800);
  ctx.fillText('Kitchen', w / 2, 430);

  pot(ctx, w / 2, 640);

  ctx.fillStyle = RED;
  ctx.font = hand(46);
  ctx.fillText("recipes for things I've built", w / 2, 845);
  ctx.fillStyle = MUTED;
  ctx.font = serif(24, 400, true);
  ctx.fillText(`by ${profile.name}`, w / 2, 900);
}

function pot(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(cx - 140, cy - 40);
  ctx.lineTo(cx - 120, cy + 90);
  ctx.quadraticCurveTo(cx - 115, cy + 120, cx - 80, cy + 120);
  ctx.lineTo(cx + 80, cy + 120);
  ctx.quadraticCurveTo(cx + 115, cy + 120, cx + 120, cy + 90);
  ctx.lineTo(cx + 140, cy - 40);
  ctx.closePath();
  ctx.fillStyle = '#ffc93c';
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 160, cy - 40);
  ctx.lineTo(cx + 160, cy - 40);
  ctx.moveTo(cx - 140, cy - 10);
  ctx.lineTo(cx - 185, cy - 10);
  ctx.moveTo(cx + 140, cy - 10);
  ctx.lineTo(cx + 185, cy - 10);
  ctx.stroke();

  ctx.strokeStyle = RED;
  ctx.lineWidth = 5;
  for (const dx of [-60, 0, 60]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy - 70);
    ctx.bezierCurveTo(cx + dx - 25, cy - 100, cx + dx + 25, cy - 130, cx + dx, cy - 165);
    ctx.stroke();
  }

  ctx.fillStyle = INK;
  ctx.font = `400 64px ${FONTS.pixel}`;
  ctx.textAlign = 'center';
  ctx.fillText('</>', cx, cy + 70);
  ctx.restore();
}

function contentsPage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = INK;
  ctx.font = serif(76, 800);
  ctx.fillText('Contents', M, 170);
  underline(ctx, M, 205, 300);

  projects.forEach((project, i) => {
    const y = 300 + i * 160;
    ctx.fillStyle = RED;
    ctx.font = serif(24, 600);
    ctx.fillText(spaced(`No. ${pad(i + 1)}`), M, y);

    const pageNo = String(2 * (i + 1) + 1);
    ctx.font = serif(36);
    const pageW = ctx.measureText(pageNo).width;
    ctx.fillStyle = INK;
    ctx.fillText(pageNo, w - M - pageW, y + 50);

    fitFont(ctx, project.title, w - 2 * M - pageW - 60, 42, 26, (s) => serif(s, 700));
    ctx.fillText(project.title, M, y + 50);
    const titleW = ctx.measureText(project.title).width;

    ctx.fillStyle = MUTED;
    for (let x = M + titleW + 16; x < w - M - pageW - 16; x += 14) ctx.fillRect(x, y + 46, 3, 3);
    ctx.font = serif(26, 400, true);
    ctx.fillText(project.kind, M, y + 92);
  });

  // Coffee ring
  ctx.strokeStyle = 'rgba(140, 90, 40, 0.16)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(w - 170, h - 270, 95, 0.3, Math.PI * 2 - 0.4);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(w - 172, h - 268, 80, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(w / 2 - 60, h - 150);
  ctx.rotate(-0.05);
  ctx.fillStyle = RED;
  ctx.font = hand(46);
  ctx.textAlign = 'center';
  ctx.fillText('click a page to turn it →', 0, 0);
  ctx.restore();
}

async function ingredientsPage(ctx: CanvasRenderingContext2D, w: number, project: Project, spread: number) {
  let y = 120;
  ctx.fillStyle = RED;
  ctx.font = serif(24, 600);
  ctx.fillText(spaced(`RECIPE No. ${pad(spread)}`), M, y);

  y += 76;
  ctx.fillStyle = INK;
  ctx.font = serif(64, 800);
  for (const line of wrapLines(ctx, project.title, w - 2 * M)) {
    ctx.fillText(line, M, y);
    y += 68;
  }
  ctx.fillStyle = MUTED;
  ctx.font = serif(32, 400, true);
  ctx.fillText(project.kind, M, y - 12);
  y += 30;

  // Taped-in photo
  const pw = w - 2 * M - 20;
  const ph = 300;
  ctx.save();
  ctx.translate(M + 10 + pw / 2, y + ph / 2);
  ctx.rotate(-0.025);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fff';
  ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
  ctx.shadowColor = 'transparent';
  try {
    drawCover(ctx, await loadImage(project.image), -pw / 2 + 14, -ph / 2 + 14, pw - 28, ph - 28);
  } catch {
    ctx.fillStyle = '#ddd5c4';
    ctx.fillRect(-pw / 2 + 14, -ph / 2 + 14, pw - 28, ph - 28);
  }
  ctx.fillStyle = 'rgba(255, 214, 102, 0.75)';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * (pw / 2 - 30), -ph / 2 + 4);
    ctx.rotate(side * 0.6);
    ctx.fillRect(-50, -14, 100, 28);
    ctx.restore();
  }
  ctx.restore();
  y += ph + 80;

  ctx.fillStyle = INK;
  ctx.font = serif(46, 800);
  ctx.fillText('Ingredients', M, y);
  underline(ctx, M, y + 20, 250);
  y += 80;

  const cols = project.stack.length > 3 ? 2 : 1;
  const rows = Math.ceil(project.stack.length / cols);
  const colW = (w - 2 * M) / cols;
  ctx.font = hand(48, 600);
  project.stack.forEach((item, i) => {
    const x = M + Math.floor(i / rows) * colW;
    const yy = y + (i % rows) * 58;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, yy - 28, 28, 28);
    ctx.fillStyle = INK;
    ctx.fillText(item, x + 44, yy);
  });
}

function methodPage(ctx: CanvasRenderingContext2D, w: number, h: number, project: Project, spread: number) {
  let y = 140;
  ctx.fillStyle = INK;
  ctx.font = serif(64, 800);
  ctx.fillText('Method', M, y);
  underline(ctx, M, y + 24, 220);
  y += 80;
  ctx.fillStyle = MUTED;
  ctx.font = serif(28, 400, true);
  ctx.fillText(`Course: ${project.kind}`, M, y);
  y += 70;

  // One numbered step per résumé bullet; longer recipes get a slightly smaller type size.
  const size = project.steps.length > 1 ? 28 : 36;
  const lead = Math.round(size * 1.42);
  project.steps.forEach((step, i) => {
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(M + 24, y - size * 0.36, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = serif(26, 800);
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), M + 24, y - size * 0.36 + 9);
    ctx.textAlign = 'left';

    ctx.fillStyle = INK;
    ctx.font = serif(size);
    for (const line of wrapLines(ctx, step, w - 2 * M - 66)) {
      ctx.fillText(line, M + 66, y);
      y += lead;
    }
    y += 22;
  });

  // The stamp only goes on when the method leaves room for it.
  if (y < h - 430) stamp(ctx, w - 200, h - 300);

  ctx.fillStyle = RED;
  ctx.font = hand(44);
  ctx.textAlign = 'center';
  ctx.fillText(spread < SPREADS - 1 ? 'next recipe →' : '~ fin ~', w / 2, h - 120);
}

function stamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.22);
  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = RED;
  ctx.fillStyle = RED;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 105, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.font = serif(24, 800);
  ctx.fillText('★ ★ ★', 0, -36);
  ctx.font = serif(34, 800);
  ctx.fillText('KITCHEN', 0, 8);
  ctx.fillText('TESTED', 0, 48);
  ctx.restore();
}
