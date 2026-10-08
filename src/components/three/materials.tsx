'use client';

import type { ComponentProps } from 'react';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { rng } from '@/lib/canvas';
import { roomTheme } from '@/lib/themes';

const T = roomTheme();

// ─── Procedural textures ─────────────────────────────────────────────────
// Drawn once on canvases in near-white greys so a material's `color` tints them.
// RoundedBox geometry has UVs in metres, so `repeat` here is "tiles per metre".

function makeTexture(size: number, draw: (ctx: CanvasRenderingContext2D, s: number) => void, repeat = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  draw(canvas.getContext('2d')!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Long wavy grain lines (seamless horizontally), tone bands and pores. */
function drawGrain(ctx: CanvasRenderingContext2D, s: number, seed: number, lines = 170) {
  const r = rng(seed);
  for (let i = 0; i < 16; i++) {
    const y = r() * s;
    const h = 10 + r() * 70;
    ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.05 + r() * 0.07})` : `rgba(0,0,0,${0.04 + r() * 0.07})`;
    ctx.fillRect(0, y, s, h);
  }
  for (let i = 0; i < lines; i++) {
    const y0 = r() * s;
    const amp = 2 + r() * 9;
    const k = (1 + Math.floor(r() * 3)) * ((Math.PI * 2) / s);
    const phase = r() * 10;
    ctx.strokeStyle = `rgba(40,20,8,${0.07 + r() * 0.2})`;
    ctx.lineWidth = 0.6 + r() * 1.6;
    for (const offset of [-s, 0, s]) {
      ctx.beginPath();
      for (let x = 0; x <= s; x += 8) {
        const y = y0 + offset + Math.sin(x * k + phase) * amp + Math.sin(x * k * 3 + phase * 2) * amp * 0.3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(30,15,5,${0.12 + r() * 0.2})`;
    ctx.fillRect(r() * s, r() * s, 2 + r() * 7, 1);
  }
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  const wood = makeTexture(1024, (ctx, s) => {
    ctx.fillStyle = '#ebe6e1';
    ctx.fillRect(0, 0, s, s);
    drawGrain(ctx, s, 11);
  });

  // 2 m square of staggered floorboards, each with its own tone.
  const planks = makeTexture(1024, (ctx, s) => {
    const r = rng(5);
    ctx.fillStyle = '#e6dfd8';
    ctx.fillRect(0, 0, s, s);
    drawGrain(ctx, s, 23, 260);
    const rows = 9;
    const rowH = s / rows;
    for (let row = 0; row < rows; row++) {
      let x = -r() * s * 0.5;
      while (x < s) {
        const len = s * (0.35 + r() * 0.4);
        const tone = r();
        ctx.fillStyle = tone > 0.5 ? `rgba(255,240,225,${(tone - 0.5) * 0.28})` : `rgba(40,20,10,${(0.5 - tone) * 0.3})`;
        for (const wrap of [0, -s, s]) ctx.fillRect(x + wrap, row * rowH, len, rowH);
        ctx.fillStyle = 'rgba(25,12,5,0.55)';
        for (const wrap of [0, -s, s]) ctx.fillRect(x + wrap, row * rowH, 2, rowH);
        x += len;
      }
      ctx.fillStyle = 'rgba(25,12,5,0.6)';
      ctx.fillRect(0, row * rowH, s, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(0, row * rowH + 2, s, 1);
    }
  });

  const plaster = makeTexture(
    512,
    (ctx, s) => {
      const r = rng(9);
      ctx.fillStyle = '#f2f2f2';
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 600; i++) {
        const x = r() * s;
        const y = r() * s;
        const rad = 10 + r() * 40;
        ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.008)' : 'rgba(0,0,0,0.006)';
        for (const [dx, dy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (let i = 0; i < 6000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${r() * 0.03})`;
        ctx.fillRect(r() * s, r() * s, 1, 1);
      }
    },
    0.8,
  );

  // Bouclé / woven fabric
  const fabric = makeTexture(
    512,
    (ctx, s) => {
      const r = rng(17);
      ctx.fillStyle = '#e8e8e8';
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, y, s, 1);
      }
      for (let x = 0; x < s; x += 4) {
        ctx.fillStyle = 'rgba(0,0,0,0.035)';
        ctx.fillRect(x, 0, 1, s);
      }
      for (let i = 0; i < 9000; i++) {
        ctx.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(r() * s, r() * s, 0.8 + r() * 2.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    3,
  );

  // Mid-century rug: a border band, a cream field and rows of "atomic" dots.
  const rug = makeTexture(1024, (ctx, s) => {
    const r = rng(31);
    const [band, field, accent] = T.rug;
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = field;
    ctx.fillRect(70, 70, s - 140, s - 140);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.strokeRect(100, 100, s - 200, s - 200);
    const palette = [band, accent, '#d9a441', T.trim];
    const step = 136;
    for (let y = 190; y < s - 150; y += step) {
      for (let x = 190; x < s - 150; x += step) {
        const color = palette[Math.floor(r() * palette.length)];
        ctx.fillStyle = color;
        ctx.beginPath();
        if (r() > 0.5) ctx.arc(x, y, 34, 0, Math.PI * 2);
        else ctx.arc(x, y + 18, 40, Math.PI, 0);
        ctx.fill();
      }
    }
    // Weave texture on top
    for (let i = 0; i < 26000; i++) {
      ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(r() * s, r() * s, 2, 2);
    }
  });
  rug.wrapS = rug.wrapT = THREE.ClampToEdgeWrapping;

  // Standard (not physical) materials throughout: the environment map already gives
  // lacquer and ceramic their sheen, and each physical variant costs seconds of
  // shader compilation on Windows.
  const lacquer = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.3 });
  const woodMat = (color: string, roughness = 0.55) =>
    new THREE.MeshStandardMaterial({ color, map: wood, bumpMap: wood, bumpScale: 0.6, roughness });
  const fabricMat = (color: string) =>
    new THREE.MeshStandardMaterial({ color, map: fabric, bumpMap: fabric, bumpScale: 1.2, roughness: 1 });

  return {
    textures: { wood, planks, plaster, fabric, rug },
    walnut: woodMat('#8a5634'),
    walnutDark: woodMat('#5c3820'),
    oak: woodMat('#c8955c', 0.6),
    woodFor: woodMat,
    lacquer,
    fabric: fabricMat,
    brass: new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 1, roughness: 0.28 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#e1e3e6', metalness: 1, roughness: 0.14 }),
    blackMetal: new THREE.MeshStandardMaterial({ color: '#1e1b18', metalness: 0.6, roughness: 0.45 }),
    steel: new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.85, roughness: 0.38 }),
    ceramic: (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 0.22 }),
    glass: new THREE.MeshStandardMaterial({ color: '#dceff5', roughness: 0.05, transparent: true, opacity: 0.35 }),
    plasterFor: (color: string) =>
      new THREE.MeshStandardMaterial({ color, map: plaster, bumpMap: plaster, bumpScale: 0.8, roughness: 0.95 }),
  };
}

/** Shared materials, built once on first use in the browser. */
export function mats() {
  if (!cache) cache = build();
  return cache;
}

/** A box with softened edges; pass a material from `mats()`. */
export function RBox({
  args,
  radius = 0.015,
  ...props
}: ComponentProps<typeof RoundedBox> & { args: [number, number, number] }) {
  const [w, h, d] = args as [number, number, number];
  const safe = Math.max(0.001, Math.min(radius, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002));
  return <RoundedBox args={args} radius={safe} smoothness={3} castShadow receiveShadow {...props} />;
}

/** A tapered, slightly splayed mid-century leg standing on the floor. */
export function Leg({
  position,
  height,
  splay = [0, 0],
  material,
}: {
  position: [number, number, number];
  height: number;
  splay?: [number, number];
  material: THREE.Material;
}) {
  return (
    <mesh
      position={[position[0], position[1] + height / 2, position[2]]}
      rotation={[splay[1], 0, splay[0]]}
      material={material}
      castShadow
    >
      <cylinderGeometry args={[0.022, 0.012, height, 12]} />
    </mesh>
  );
}

// ─── Shared furniture language ───────────────────────────────────────────
// Every cabinet, credenza, desk and nightstand in the room is built from these:
// walnut body, slatted walnut fronts over a dark backing, vertical brass bar
// pulls, and tapered splayed legs.

type Vec3 = [number, number, number];

/** A door or drawer front: dark walnut backing with vertical walnut slats. Faces +z. */
export function SlatFront({ w, h, position }: { w: number; h: number; position: Vec3 }) {
  const m = mats();
  const pitch = 0.08;
  const count = Math.max(1, Math.floor((w - 0.04) / pitch));
  const start = -((count - 1) * pitch) / 2;
  return (
    <group position={position}>
      <RBox args={[w, h, 0.02]} material={m.walnutDark} radius={0.006} />
      {Array.from({ length: count }, (_, i) => (
        <RBox key={i} args={[0.055, h - 0.04, 0.018]} position={[start + i * pitch, 0, 0.014]} material={m.walnut} radius={0.008} />
      ))}
    </group>
  );
}

/** Vertical brass bar pull. */
export function Pull({ position, length = 0.14 }: { position: Vec3; length?: number }) {
  return <RBox args={[0.03, length, 0.03]} position={position} material={mats().brass} radius={0.01} />;
}

/** Four splayed legs under a w × d footprint, centred on the origin. */
export function Legs({ w, d, height, inset = 0.12 }: { w: number; d: number; height: number; inset?: number }) {
  const m = mats();
  return (
    <>
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz]) => (
        <Leg
          key={`${sx}${sz}`}
          position={[sx * (w / 2 - inset), 0, sz * (d / 2 - inset)]}
          height={height + 0.01}
          splay={[-sx * 0.15, sz * 0.15]}
          material={m.walnut}
        />
      ))}
    </>
  );
}

/**
 * A walnut credenza on legs with slatted doors. The origin is on the floor at the
 * centre of the footprint; the doors face +z. Pulls sit on the meeting edges.
 */
export function Credenza({
  w,
  h,
  d,
  legH = 0.18,
  doors = 2,
  position,
  ...handlers
}: {
  w: number;
  h: number;
  d: number;
  legH?: number;
  doors?: number;
  position: Vec3;
} & Record<string, unknown>) {
  const m = mats();
  const bodyH = h - legH;
  const doorW = (w - 0.06) / doors - 0.02;
  return (
    <group position={position} {...handlers}>
      <RBox args={[w, bodyH, d]} position-y={legH + bodyH / 2} material={m.walnut} radius={0.02} />
      {Array.from({ length: doors }, (_, i) => {
        const x = -w / 2 + 0.03 + (i + 0.5) * (doorW + 0.02);
        // Pull on the edge nearest the middle of the credenza.
        const pullX = x + (x < 0 ? 1 : -1) * (doorW / 2 - 0.06);
        return (
          <group key={i}>
            <SlatFront w={doorW} h={bodyH - 0.08} position={[x, legH + bodyH / 2, d / 2 + 0.008]} />
            <Pull position={[doors === 1 ? x + doorW / 2 - 0.06 : pullX, legH + bodyH / 2, d / 2 + 0.035]} />
          </group>
        );
      })}
      <Legs w={w} d={d} height={legH} inset={0.15} />
    </group>
  );
}
