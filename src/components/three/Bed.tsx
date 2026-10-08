'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { rng, useCanvasTexture } from '@/lib/canvas';
import { roomTheme } from '@/lib/themes';
import { Leg, Legs, Pull, RBox, SlatFront, mats } from './materials';
import { MOVIE_POSTERS, Posters } from './Posters';
import { WALL_Z } from './util';

const T = roomTheme();
const BED = { x: -0.45, w: 1.6, d: 2.1 };
/** The headboard is mounted proud of the wall's panelling and cap rail; the bed sits just in front of it. */
const HEADBOARD_Z = WALL_Z + 0.085;
const BED_Z = WALL_Z + 0.13 + BED.d / 2;
const MATTRESS = { w: 1.5, d: 2.0, top: 0.54 };
/** Where the comforter starts (just below the pillows) and how far it runs to the foot. */
const DUVET = { z0: BED_Z - MATTRESS.d / 2 + 0.55, length: MATTRESS.d - 0.55, y: MATTRESS.top + 0.025 };

/**
 * A comforter surface: flat and gently puffed across the mattress top, then rolled
 * over the edges and hanging down the two sides and the foot. Local origin is the
 * head-end centre of the top; x runs across, z runs toward the foot.
 */
function makeComforter(width: number, length: number, radius = 0.06, drop = 0.2) {
  const arc = (radius * Math.PI) / 2;
  const totalW = width + 2 * (arc + drop);
  const totalL = length + arc + drop;
  const geometry = new THREE.PlaneGeometry(totalW, totalL, 96, 96).rotateX(-Math.PI / 2);
  const pos = geometry.attributes.position;

  // Map a distance past the edge onto a rolled-over-then-hanging profile.
  const bend = (past: number): [number, number] => {
    if (past <= 0) return [past, 0];
    if (past < arc) {
      const t = past / radius;
      return [radius * Math.sin(t), -radius * (1 - Math.cos(t))];
    }
    return [radius, -(radius + (past - arc))];
  };

  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const pz = pos.getZ(i) + totalL / 2;
    const side = Math.sign(px) || 1;

    const pastSide = Math.abs(px) - width / 2;
    const [outX, dropX] = bend(pastSide);
    const x = pastSide <= 0 ? px : side * (width / 2 + outX);

    const pastFoot = pz - length;
    const [outZ, dropZ] = bend(pastFoot);
    const z = pastFoot <= 0 ? pz : length + outZ;

    let y = dropX + dropZ;
    // Loft across the top, fading out at the edges and the turned-down head end.
    if (pastSide <= 0 && pastFoot <= 0) {
      const across = 1 - (px / (width / 2)) ** 2;
      const head = Math.min(1, pz / 0.15);
      const foot = Math.min(1, -pastFoot / 0.12);
      y += 0.03 * across * head * foot;
    }
    // Soft wrinkles everywhere, and a slightly wavy hem where it hangs.
    y += 0.006 * Math.sin(px * 13 + pz * 3) + 0.005 * Math.sin(pz * 10 - px * 5);
    const hem = pastSide > arc ? 0.012 * Math.sin(pz * 9) : 0;
    pos.setXYZ(i, x + side * hem, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** Diamond quilting stitches over a soft woven texture, tinted by the material colour. */
function drawQuilt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#ececec';
  ctx.fillRect(0, 0, w, h);
  const r = rng(41);
  for (let i = 0; i < 9000; i++) {
    ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  const step = w / 4;
  for (const [dark, offset] of [
    [true, 0],
    [false, 2],
  ] as const) {
    ctx.strokeStyle = dark ? 'rgba(0,0,0,0.16)' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    for (let k = -4; k <= 8; k++) {
      ctx.beginPath();
      ctx.moveTo(k * step + offset, 0);
      ctx.lineTo(k * step + h + offset, h);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(k * step + offset, h);
      ctx.lineTo(k * step + h + offset, 0);
      ctx.stroke();
    }
  }
}

/** The bed nook in the middle of the studio (photo and résumé hang above it). */
export function Bed() {
  const m = mats();
  const quilt = useCanvasTexture(512, 512, drawQuilt);
  const comforter = useMemo(() => makeComforter(MATTRESS.w, DUVET.length), []);
  const local = useMemo(
    () => ({
      sheet: m.fabric('#f3eee6'),
      duvet: (() => {
        const map = quilt.clone();
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(3, 2.5);
        map.needsUpdate = true;
        return new THREE.MeshStandardMaterial({
          color: T.duvet,
          map,
          bumpMap: map,
          bumpScale: 1.4,
          roughness: 0.95,
          side: THREE.DoubleSide,
        });
      })(),
      pillow: m.fabric(T.pillow),
      lampBase: m.ceramic('#d9a441'),
      shade: new THREE.MeshStandardMaterial({
        color: '#f6efe2',
        map: m.textures.fabric,
        emissive: T.lights.lamp,
        emissiveIntensity: 1.6,
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    }),
    [m, quilt],
  );

  const corners: [number, number][] = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ];

  return (
    <group>
      {/* Wall-mounted walnut headboard in the room's slatted style, with a cap rail */}
      <SlatFront w={BED.w + 0.12} h={0.95} position={[BED.x, 0.78, HEADBOARD_Z]} />
      <RBox args={[BED.w + 0.18, 0.05, 0.09]} position={[BED.x, 1.28, HEADBOARD_Z + 0.025]} material={m.walnut} radius={0.015} />
      <Posters x={BED.x} z={WALL_Z + 0.02} designs={MOVIE_POSTERS} />

      {/* Walnut platform on splayed legs */}
      <RBox args={[BED.w, 0.12, BED.d]} position={[BED.x, 0.28, BED_Z]} material={m.walnut} radius={0.02} />
      {corners.map(([sx, sz]) => (
        <Leg
          key={`${sx}${sz}`}
          position={[BED.x + sx * (BED.w / 2 - 0.12), 0, BED_Z + sz * (BED.d / 2 - 0.12)]}
          height={0.23}
          splay={[-sx * 0.12, sz * 0.12]}
          material={m.walnut}
        />
      ))}

      {/* Bedding */}
      <RBox
        args={[MATTRESS.w, 0.2, MATTRESS.d]}
        position={[BED.x, MATTRESS.top - 0.1, BED_Z]}
        material={local.sheet}
        radius={0.07}
      />
      <mesh geometry={comforter} material={local.duvet} position={[BED.x, DUVET.y, DUVET.z0]} castShadow receiveShadow />
      {/* Top sheet folded back over the comforter's head edge */}
      <RBox
        args={[MATTRESS.w + 0.08, 0.035, 0.2]}
        position={[BED.x, DUVET.y + 0.02, DUVET.z0 + 0.06]}
        material={local.sheet}
        radius={0.016}
      />
      {[-0.36, 0.36].map((dx, i) => (
        <RBox
          key={dx}
          args={[0.62, 0.13, 0.36]}
          position={[BED.x + dx, 0.6, WALL_Z + 0.42]}
          rotation={[-0.25, i ? -0.06 : 0.05, 0]}
          material={local.pillow}
          radius={0.065}
        />
      ))}

      {/* Nightstand with a lamp and a mug */}
      <group position={[0.75, 0, WALL_Z + 0.28]}>
        <RBox args={[0.5, 0.3, 0.42]} position-y={0.37} material={m.walnut} radius={0.015} />
        <SlatFront w={0.44} h={0.24} position={[0, 0.37, 0.218]} />
        <Pull position={[0.17, 0.37, 0.245]} length={0.1} />
        <Legs w={0.5} d={0.42} height={0.22} inset={0.05} />
        <mesh position={[0.08, 0.6, -0.05]} material={local.lampBase} castShadow>
          <sphereGeometry args={[0.09, 32, 24]} />
        </mesh>
        <mesh position={[0.08, 0.72, -0.05]} material={m.brass}>
          <cylinderGeometry args={[0.008, 0.008, 0.14, 8]} />
        </mesh>
        <mesh position={[0.08, 0.8, -0.05]} material={local.shade} castShadow>
          <cylinderGeometry args={[0.1, 0.15, 0.17, 40, 1, true]} />
        </mesh>
        <group position={[-0.13, 0.52, 0.08]}>
          <mesh position-y={0.06} material={m.ceramic(T.mug)} castShadow>
            <cylinderGeometry args={[0.05, 0.045, 0.12, 32]} />
          </mesh>
          <mesh position={[0.06, 0.06, 0]} material={m.ceramic(T.mug)}>
            <torusGeometry args={[0.032, 0.009, 12, 24]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
