'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { FONTS, rng, useCanvasTexture } from '@/lib/canvas';
import { RBox, mats } from './materials';
import type { Zone } from '@/lib/store';
import { useInteractive } from './useInteractive';

// Original, minimalist tribute posters painted on canvas (no official art or logos).
const PW = 600;
const PH = 850;

function stars(ctx: CanvasRenderingContext2D, seed: number, count: number, maxY: number) {
  const r = rng(seed);
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.25 + r() * 0.75;
    const s = r() > 0.92 ? 2.5 : 1.5;
    ctx.fillRect(r() * PW, r() * maxY, s, s);
  }
  ctx.globalAlpha = 1;
}

function spacedTitle(ctx: CanvasRenderingContext2D, text: string, y: number, font: string, color: string, spacing: number) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let x = (PW - total) / 2;
  chars.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += widths[i] + spacing;
  });
}

/** A pale, cracked sphere hanging over a last city at night. */
function drawDestiny(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, PH);
  sky.addColorStop(0, '#0b1426');
  sky.addColorStop(0.65, '#23365a');
  sky.addColorStop(1, '#c98f5c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PW, PH);
  stars(ctx, 4, 140, 420);

  // The sphere, with a soft glow and a broken lower edge
  const cx = PW / 2;
  const cy = 360;
  const glow = ctx.createRadialGradient(cx, cy, 120, cx, cy, 260);
  glow.addColorStop(0, 'rgba(230, 236, 245, 0.35)');
  glow.addColorStop(1, 'rgba(230, 236, 245, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 100, PW, 520);
  const body = ctx.createRadialGradient(cx - 50, cy - 60, 20, cx, cy, 150);
  body.addColorStop(0, '#ffffff');
  body.addColorStop(1, '#b9c3d1');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cy, 150, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#23365a';
  ctx.beginPath();
  ctx.moveTo(cx - 110, cy + 102);
  ctx.lineTo(cx - 60, cy + 70);
  ctx.lineTo(cx - 20, cy + 112);
  ctx.lineTo(cx + 30, cy + 76);
  ctx.lineTo(cx + 80, cy + 118);
  ctx.lineTo(cx + 120, cy + 92);
  ctx.lineTo(cx + 150, cy + 160);
  ctx.lineTo(cx - 150, cy + 160);
  ctx.closePath();
  ctx.fill();

  // City skyline with one tall tower
  ctx.fillStyle = '#0d1220';
  const r = rng(9);
  let x = 0;
  while (x < PW) {
    const w = 20 + r() * 40;
    const h = 60 + r() * 120;
    ctx.fillRect(x, PH - 150 - h, w, h + 150);
    x += w;
  }
  ctx.fillRect(PW / 2 - 16, PH - 430, 32, 300);
  ctx.beginPath();
  ctx.moveTo(PW / 2 - 16, PH - 430);
  ctx.lineTo(PW / 2, PH - 470);
  ctx.lineTo(PW / 2 + 16, PH - 430);
  ctx.fill();

  spacedTitle(ctx, 'DESTINY', 110, `400 64px ${FONTS.display}`, '#eef1f6', 22);
}

/** Dawn over rolling hills, a red volcano, and a tiny paraglider. */
function drawWild(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, PH);
  sky.addColorStop(0, '#7cc3c6');
  sky.addColorStop(0.55, '#f2d79a');
  sky.addColorStop(1, '#f6e7c4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PW, PH);

  // Volcano with a glowing summit
  ctx.fillStyle = '#8a4a3a';
  ctx.beginPath();
  ctx.moveTo(320, 470);
  ctx.lineTo(430, 330);
  ctx.lineTo(470, 330);
  ctx.lineTo(600, 470);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8743c';
  ctx.fillRect(432, 326, 36, 6);

  // Layered hills, back to front
  const hills: [string, number, number][] = [
    ['#8fb59a', 470, 40],
    ['#6f9e6a', 540, 55],
    ['#4f7f4a', 620, 70],
    ['#36603a', 710, 60],
  ];
  hills.forEach(([color, base, amp], i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, PH);
    ctx.lineTo(0, base);
    for (let x = 0; x <= PW; x += 20) {
      ctx.lineTo(x, base - Math.sin((x / PW) * Math.PI * (1.3 + i * 0.4) + i) * amp);
    }
    ctx.lineTo(PW, PH);
    ctx.fill();
  });

  // Paraglider: a small blue figure under a brown wing
  ctx.save();
  ctx.translate(170, 300);
  ctx.rotate(-0.12);
  ctx.fillStyle = '#7a5a3a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 12, 0, Math.PI, 0);
  ctx.fill();
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(-4, 34);
  ctx.moveTo(40, 0);
  ctx.lineTo(4, 34);
  ctx.stroke();
  ctx.fillStyle = '#3f6fb5';
  ctx.fillRect(-5, 34, 10, 18);
  ctx.fillStyle = '#f0d0a8';
  ctx.beginPath();
  ctx.arc(0, 31, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  spacedTitle(ctx, 'THE LEGEND OF ZELDA', PH - 120, `400 20px ${FONTS.display}`, '#f6e7c4', 6);
  ctx.font = `italic 400 56px ${FONTS.serif}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Breath of the Wild', PW / 2, PH - 60);
}

/** A slim horned silhouette with a needle, a pale moon, and a sweep of red thread. */
function drawSilksong(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, PH);
  bg.addColorStop(0, '#1c1418');
  bg.addColorStop(1, '#3a1c22');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, PW, PH);

  ctx.fillStyle = '#efe6d8';
  ctx.beginPath();
  ctx.arc(PW / 2, 330, 170, 0, Math.PI * 2);
  ctx.fill();

  // Thread
  ctx.strokeStyle = '#c23a3a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-20, 620);
  ctx.bezierCurveTo(140, 420, 420, 700, 640, 300);
  ctx.stroke();

  // Silhouette: horned mask, red cloak, needle
  const fx = PW / 2;
  const fy = 470;
  ctx.fillStyle = '#c23a3a';
  ctx.beginPath();
  ctx.moveTo(fx, fy - 10);
  ctx.lineTo(fx - 60, fy + 150);
  ctx.lineTo(fx + 55, fy + 150);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7f2ea';
  ctx.beginPath();
  ctx.ellipse(fx, fy - 30, 24, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx - 18, fy - 48);
  ctx.quadraticCurveTo(fx - 34, fy - 110, fx - 12, fy - 140);
  ctx.quadraticCurveTo(fx - 18, fy - 100, fx - 6, fy - 56);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(fx + 18, fy - 48);
  ctx.quadraticCurveTo(fx + 34, fy - 110, fx + 12, fy - 140);
  ctx.quadraticCurveTo(fx + 18, fy - 100, fx + 6, fy - 56);
  ctx.fill();
  ctx.fillStyle = '#1c1418';
  ctx.beginPath();
  ctx.ellipse(fx - 9, fy - 30, 5, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(fx + 9, fy - 30, 5, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9d4cc';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(fx + 40, fy + 40);
  ctx.lineTo(fx + 170, fy - 120);
  ctx.stroke();

  spacedTitle(ctx, 'HOLLOW KNIGHT', 110, `400 22px ${FONTS.display}`, '#c9bfb2', 8);
  ctx.font = `400 66px ${FONTS.serif}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#efe6d8';
  ctx.fillText('Silksong', PW / 2, 180);
}

/** Volcanic sky, a lava river and two duelling silhouettes with blue and red blades. */
function drawSith(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, PH);
  sky.addColorStop(0, '#1a0806');
  sky.addColorStop(0.5, '#6e1a0c');
  sky.addColorStop(1, '#e0561c');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PW, PH);
  const r = rng(13);
  for (let i = 0; i < 90; i++) {
    ctx.fillStyle = `rgba(255, ${120 + r() * 80}, 40, ${0.3 + r() * 0.5})`;
    ctx.fillRect(r() * PW, 260 + r() * 420, 2, 2);
  }
  // Ridge and lava river
  ctx.fillStyle = '#120605';
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.lineTo(160, 560);
  ctx.lineTo(300, 590);
  ctx.lineTo(450, 550);
  ctx.lineTo(PW, 600);
  ctx.lineTo(PW, PH);
  ctx.lineTo(0, PH);
  ctx.fill();
  ctx.strokeStyle = '#ff9a2e';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-10, 760);
  ctx.bezierCurveTo(180, 700, 380, 820, 610, 720);
  ctx.stroke();
  // Two silhouettes on the ridge
  const figure = (x: number, lean: number) => {
    ctx.fillStyle = '#0a0302';
    ctx.beginPath();
    ctx.ellipse(x, 470, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 16, 485);
    ctx.lineTo(x + 16, 485);
    ctx.lineTo(x + 22 + lean, 572);
    ctx.lineTo(x - 22 + lean, 572);
    ctx.closePath();
    ctx.fill();
  };
  figure(230, -4);
  figure(370, 4);
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2, color] of [
    [250, 500, 312, 420, '#7fd4ff'],
    [350, 500, 300, 418, '#ff3b30'],
  ] as const) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  spacedTitle(ctx, 'STAR WARS · EPISODE III', 100, `400 22px ${FONTS.display}`, '#f2c9a0', 6);
  ctx.font = `italic 400 52px ${FONTS.serif}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9d2';
  ctx.fillText('Revenge of the Sith', PW / 2, 165);
}

/** Retro bowling-alley poster: lanes running to a pin triangle, with a bowling ball. */
function drawLebowski(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#1d2a4a';
  ctx.fillRect(0, 0, PW, PH);
  // Lanes converging to a vanishing point
  const vx = PW / 2;
  const vy = 330;
  ctx.fillStyle = '#d8a35e';
  ctx.beginPath();
  ctx.moveTo(vx - 40, vy);
  ctx.lineTo(vx + 40, vy);
  ctx.lineTo(PW + 60, PH);
  ctx.lineTo(-60, PH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(120, 70, 30, 0.5)';
  ctx.lineWidth = 2;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(vx + i * 6, vy);
    ctx.lineTo(vx + i * 60, PH);
    ctx.stroke();
  }
  // Pin triangle at the far end
  ctx.fillStyle = '#f7f1e6';
  const pins: [number, number][] = [];
  for (let row = 0; row < 4; row++) {
    for (let k = 0; k <= row; k++) pins.push([vx + (k - row / 2) * 16, vy - 6 - (3 - row) * 7]);
  }
  for (const [x, y] of pins) {
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Bowling ball rolling toward the pins
  ctx.fillStyle = '#7a1f3d';
  ctx.beginPath();
  ctx.arc(vx + 30, 690, 70, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a0b16';
  for (const [dx, dy] of [
    [-12, -28],
    [14, -30],
    [2, -6],
  ]) {
    ctx.beginPath();
    ctx.arc(vx + 30 + dx, 690 + dy, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f2c94c';
  ctx.font = `italic 400 30px ${FONTS.serif}`;
  ctx.fillText('The', PW / 2, 120);
  ctx.font = `600 84px ${FONTS.hand}`;
  ctx.fillText('Big Lebowski', PW / 2, 200);
}

/** A tall dark shell hovering in pale fog over green hills, under a circular logogram. */
function drawArrival(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, PH);
  sky.addColorStop(0, '#c9d1d3');
  sky.addColorStop(1, '#e8ebe8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, PW, PH);

  // Logogram: an ink ring with blots
  const cx = PW / 2;
  const cy = 210;
  ctx.strokeStyle = 'rgba(20, 22, 24, 0.85)';
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0.2, Math.PI * 2 - 0.15);
  ctx.stroke();
  const r = rng(27);
  ctx.fillStyle = 'rgba(20, 22, 24, 0.85)';
  for (let i = 0; i < 7; i++) {
    const a = r() * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * 92, cy + Math.sin(a) * 92, 8 + r() * 12, 5 + r() * 8, a, 0, Math.PI * 2);
    ctx.fill();
  }

  // The shell
  ctx.fillStyle = '#2b2f33';
  ctx.beginPath();
  ctx.ellipse(cx + 40, 520, 46, 170, 0.05, 0, Math.PI * 2);
  ctx.fill();
  // Fog band and hills
  const fog = ctx.createLinearGradient(0, 560, 0, 700);
  fog.addColorStop(0, 'rgba(232, 235, 232, 0)');
  fog.addColorStop(1, 'rgba(232, 235, 232, 0.95)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, 560, PW, 140);
  ctx.fillStyle = '#6f8a6a';
  ctx.beginPath();
  ctx.moveTo(0, PH);
  ctx.lineTo(0, 720);
  ctx.quadraticCurveTo(200, 670, 380, 715);
  ctx.quadraticCurveTo(500, 740, PW, 700);
  ctx.lineTo(PW, PH);
  ctx.fill();

  spacedTitle(ctx, 'ARRIVAL', PH - 50, `400 54px ${FONTS.display}`, '#2b2f33', 26);
}

export const GAME_POSTERS = [drawDestiny, drawWild, drawSilksong];
export const MOVIE_POSTERS = [drawSith, drawLebowski, drawArrival];

type Draw = (ctx: CanvasRenderingContext2D) => void;

const POSTER_W = 0.66;
const POSTER_H = POSTER_W * (PH / PW);

/** Warm light falling from the picture light: brightest at the top edge, fading down. */
function drawWash(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createRadialGradient(w / 2, -h * 0.05, 0, w / 2, -h * 0.05, h * 0.75);
  g.addColorStop(0, 'rgba(255, 214, 150, 0.1)');
  g.addColorStop(0.5, 'rgba(255, 200, 130, 0.03)');
  g.addColorStop(1, 'rgba(255, 200, 130, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** Slim brass picture light: wall arm, bar, and a glowing strip underneath. */
function PictureLight({ washMaterial }: { washMaterial: THREE.Material }) {
  const m = mats();
  const top = POSTER_H / 2 + 0.025;
  return (
    <group>
      <mesh position={[0, top + 0.06, 0.06]} rotation-x={Math.PI / 2 - 0.5} material={m.brass}>
        <cylinderGeometry args={[0.006, 0.006, 0.14, 8]} />
      </mesh>
      <RBox args={[0.022, 0.03, 0.022]} position={[0, top + 0.1, 0.004]} material={m.brass} radius={0.006} />
      <RBox args={[POSTER_W * 0.72, 0.042, 0.06]} position={[0, top + 0.03, 0.11]} material={m.brass} radius={0.018} />
      <mesh position={[0, top + 0.008, 0.11]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[POSTER_W * 0.66, 0.03]} />
        <meshBasicMaterial color="#fff1d0" toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh position-z={0.018} material={washMaterial}>
        <planeGeometry args={[POSTER_W, POSTER_H]} />
      </mesh>
    </group>
  );
}

function Poster({ draw, position, washMaterial }: { draw: Draw; position: [number, number, number]; washMaterial?: THREE.Material }) {
  const m = mats();
  const texture = useCanvasTexture(PW, PH, (ctx) => draw(ctx));
  const material = useMemo(() => new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }), [texture]);
  return (
    <group position={position}>
      <RBox args={[POSTER_W + 0.05, POSTER_H + 0.05, 0.03]} material={m.walnutDark} radius={0.008} />
      <mesh position-z={0.016} material={material}>
        <planeGeometry args={[POSTER_W, POSTER_H]} />
      </mesh>
      {washMaterial && <PictureLight washMaterial={washMaterial} />}
    </group>
  );
}

function useWashMaterial() {
  const wash = useCanvasTexture(256, 360, drawWash);
  return useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: wash,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [wash],
  );
}

/** The height every poster row hangs at, so the game and movie posters line up. */
export const POSTER_Y = 2.5;

interface RowProps {
  x: number;
  z: number;
  designs: Draw[];
}

/** Three framed posters with picture lights, centred on x against a wall at z; clicking opens the zone. */
export function Posters({ zone, ...row }: RowProps & { zone?: Zone }) {
  return zone ? <InteractiveRow zone={zone} {...row} /> : <Row {...row} />;
}

function Row({ x, z, designs, ...handlers }: RowProps & Record<string, unknown>) {
  const wash = useWashMaterial();
  return (
    <group {...handlers}>
      {designs.map((draw, i) => (
        <Poster key={i} draw={draw} position={[x + (i - 1) * 0.82, POSTER_Y, z]} washMaterial={wash} />
      ))}
    </group>
  );
}

function InteractiveRow({ zone, ...row }: RowProps & { zone: Zone }) {
  const { handlers } = useInteractive(zone);
  return <Row {...row} {...handlers} />;
}
