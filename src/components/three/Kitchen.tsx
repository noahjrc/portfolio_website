'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { rng, useCanvasTexture } from '@/lib/canvas';
import { roomTheme } from '@/lib/themes';
import { Pull, RBox, SlatFront, mats } from './materials';
import { useInteractive } from './useInteractive';
import { WALL_Z } from './util';

const T = roomTheme();
const COUNTER = { x: -2.9, w: 2.4, d: 0.62, h: 0.86 };
const COUNTER_Z = WALL_Z + COUNTER.d / 2 + 0.01;
export const COUNTER_TOP = COUNTER.h + 0.05;
/** Sink cutout: x -3.25..-2.75, z -2.66..-2.34; the basin bottom sits 21 cm below the counter. */
const SINK = { x: -3.0, z: -2.5, w: 0.5, d: 0.32, bottom: 0.7 };
const STOVE = { x: -3.8, z: -2.5 };
const COOKBOOKS = [
  { w: 0.07, h: 0.28, color: T.book },
  { w: 0.09, h: 0.24, color: '#d9a441' },
  { w: 0.06, h: 0.3, color: '#6e4224' },
  { w: 0.08, h: 0.26, color: '#c9622d' },
  { w: 0.07, h: 0.22, color: '#5a6b3a' },
];

/** Back-left corner of the studio: fridge, counter, stove, sink and the cookbook shelf. */
export function Kitchen() {
  const m = mats();
  const { handlers } = useInteractive('projects');

  const tiles = useCanvasTexture(1024, 256, (ctx, w, h) => {
    ctx.fillStyle = '#f4efe6';
    ctx.fillRect(0, 0, w, h);
    const r = rng(4);
    const size = 64;
    for (let y = 0; y < h; y += size / 2) {
      for (let x = (y / (size / 2)) % 2 ? -size / 2 : 0; x < w; x += size) {
        const tone = 0.92 + r() * 0.08;
        ctx.fillStyle = `rgb(${Math.round(244 * tone)},${Math.round(236 * tone)},${Math.round(222 * tone)})`;
        ctx.fillRect(x + 2, y + 2, size - 4, size / 2 - 4);
      }
    }
  });

  const sky = useCanvasTexture(512, 512, (ctx, w, h) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, T.sky[0]);
    gradient.addColorStop(0.55, T.sky[1]);
    gradient.addColorStop(1, T.sky[2]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
    const r = rng(3);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 60; i++) {
      ctx.globalAlpha = 0.3 + r() * 0.6;
      ctx.fillRect(r() * w, r() * h * 0.5, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff3c4';
    ctx.beginPath();
    ctx.arc(360, 130, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = T.hills;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.quadraticCurveTo(w * 0.25, h * 0.72, w * 0.55, h * 0.86);
    ctx.quadraticCurveTo(w * 0.8, h * 0.74, w, h * 0.82);
    ctx.lineTo(w, h);
    ctx.fill();
  });

  const local = useMemo(
    () => ({
      body: m.walnut,
      stone: new THREE.MeshStandardMaterial({ color: '#efe9df', roughness: 0.3 }),
      tiles: new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.18 }),
      fridge: m.ceramic(T.fridge),
      oven: new THREE.MeshStandardMaterial({ color: '#1d1b18', roughness: 0.12 }),
      enamel: m.ceramic(T.pot),
      sky: new THREE.MeshBasicMaterial({ map: sky, toneMapped: false }),
      books: COOKBOOKS.map((b) => m.fabric(b.color)),
    }),
    [m, tiles, sky],
  );

  let shelfX = -2.37;

  return (
    <group {...handlers}>
      {/* Rounded retro fridge */}
      {/* Fridge: hinged on the wall side, with clear floor in front for the door to swing */}
      <group position={[-4.6, 0, WALL_Z + 0.38]}>
        <RBox args={[0.7, 2, 0.72]} position-y={1} material={local.fridge} radius={0.09} />
        <mesh position={[0, 1.38, 0.362]}>
          <boxGeometry args={[0.66, 0.012, 0.01]} />
          <meshStandardMaterial color="#000" transparent opacity={0.3} />
        </mesh>
        {[1.62, 0.95].map((y) => (
          <RBox key={y} args={[0.035, y > 1 ? 0.28 : 0.45, 0.04]} position={[0.26, y, 0.39]} material={m.chrome} radius={0.015} />
        ))}
        <RBox args={[0.26, 0.06, 0.02]} position={[-0.14, 1.85, 0.37]} material={m.chrome} radius={0.008} />
      </group>

      {/* Base cabinets: lacquered carcass (lowered under the sink so the basin has depth) */}
      {[
        [-4.1, -3.27, COUNTER.h],
        [-3.27, -2.73, SINK.bottom - 0.02],
        [-2.73, -1.7, COUNTER.h],
      ].map(([x0, x1, top]) => (
        <RBox
          key={x0}
          args={[x1 - x0, top - 0.08, COUNTER.d]}
          position={[(x0 + x1) / 2, (top + 0.08) / 2, COUNTER_Z]}
          material={local.body}
          radius={0.008}
        />
      ))}
      <RBox args={[COUNTER.w - 0.04, 0.08, COUNTER.d - 0.08]} position={[COUNTER.x, 0.04, COUNTER_Z - 0.04]} material={m.walnutDark} radius={0.005} />
      {[-3.2, -2.6, -2.0].map((x) => (
        <group key={x}>
          <SlatFront w={0.56} h={0.72} position={[x, 0.47, COUNTER_Z + COUNTER.d / 2 + 0.008]} />
          <Pull position={[x + 0.22, 0.66, COUNTER_Z + COUNTER.d / 2 + 0.035]} />
        </group>
      ))}

      {/* Stone countertop, cut around the sink */}
      {[
        [-4.13, -3.25, -2.8, -2.12],
        [-2.75, -1.67, -2.8, -2.12],
        [-3.25, -2.75, -2.34, -2.12],
        [-3.25, -2.75, -2.8, -2.66],
      ].map(([x0, x1, z0, z1]) => (
        <RBox
          key={`${x0}${z0}`}
          args={[x1 - x0, 0.05, z1 - z0]}
          position={[(x0 + x1) / 2, COUNTER.h + 0.025, (z0 + z1) / 2]}
          material={local.stone}
          radius={0.006}
        />
      ))}
      <mesh position={[COUNTER.x, COUNTER_TOP + 0.25, WALL_Z + 0.006]} material={local.tiles}>
        <planeGeometry args={[COUNTER.w + 0.06, 0.5]} />
      </mesh>

      <Range />
      <Sink />

      {/* Window over the sink, framed in walnut */}
      <group position={[SINK.x + 0.05, 1.95, WALL_Z + 0.006]}>
        <mesh material={local.sky}>
          <planeGeometry args={[0.8, 0.9]} />
        </mesh>
        {[
          [0, 0.47, 0.92, 0.07],
          [0, -0.47, 0.92, 0.07],
          [0.43, 0, 0.07, 1.0],
          [-0.43, 0, 0.07, 1.0],
          [0, 0, 0.03, 0.9],
        ].map(([x, y, w, h], i) => (
          <RBox key={i} args={[w, h, 0.05]} position={[x, y, 0.025]} material={m.walnut} radius={0.01} />
        ))}
        <RBox args={[1.02, 0.04, 0.13]} position={[0, -0.52, 0.06]} material={m.walnut} radius={0.01} />
      </group>

      {/* Cookbook shelf */}
      <RBox args={[0.64, 0.035, 0.22]} position={[-2.075, 1.65, WALL_Z + 0.11]} material={m.walnut} radius={0.008} />
      {[-2.36, -1.79].map((x) => (
        <RBox key={x} args={[0.02, 0.1, 0.16]} position={[x, 1.6, WALL_Z + 0.09]} material={m.brass} radius={0.005} />
      ))}
      {COOKBOOKS.map((book, i) => {
        const x = shelfX + book.w / 2;
        shelfX += book.w + 0.008;
        const leaning = i === COOKBOOKS.length - 1;
        return (
          <RBox
            key={i}
            args={[book.w, book.h, 0.18]}
            position={[leaning ? x + 0.05 : x, 1.668 + book.h / 2, WALL_Z + 0.12]}
            rotation-z={leaning ? -0.3 : 0}
            material={local.books[i]}
            radius={0.008}
          />
        );
      })}
      <mesh position={[-1.85, 1.668 + 0.09, WALL_Z + 0.12]} material={m.glass} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 0.18, 32]} />
      </mesh>
      <mesh position={[-1.85, 1.668 + 0.19, WALL_Z + 0.12]} material={m.walnut}>
        <cylinderGeometry args={[0.062, 0.062, 0.025, 32]} />
      </mesh>
    </group>
  );
}

/** Freestanding-look range: oven with a window and knobs, gas cooktop with grates, and a chimney hood. */
function Range() {
  const m = mats();
  const local = useMemo(
    () => ({
      glass: new THREE.MeshStandardMaterial({ color: '#0b0b0d', roughness: 0.06, metalness: 0.2 }),
      ovenDoor: new THREE.MeshStandardMaterial({ color: '#1d1b18', roughness: 0.25 }),
      castIron: new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.75, metalness: 0.3 }),
      burner: new THREE.MeshStandardMaterial({ color: '#3a3a3a', roughness: 0.5, metalness: 0.6 }),
      hoodFaceted: new THREE.MeshStandardMaterial({ color: '#b9bec4', metalness: 0.85, roughness: 0.38, flatShading: true }),
      hoodLight: new THREE.MeshBasicMaterial({ color: '#fff1d0', toneMapped: false }),
      enamel: m.ceramic(T.pot),
    }),
    [m],
  );
  const front = COUNTER_Z + COUNTER.d / 2;
  const burners: [number, number][] = [
    [STOVE.x - 0.15, STOVE.z - 0.12],
    [STOVE.x + 0.15, STOVE.z - 0.12],
    [STOVE.x - 0.15, STOVE.z + 0.12],
    [STOVE.x + 0.15, STOVE.z + 0.12],
  ];
  const grateY = COUNTER_TOP + 0.03;

  return (
    <group>
      {/* Oven: dark door with a window, a chrome bar handle and four control knobs */}
      <group position={[STOVE.x, 0.47, front + 0.012]}>
        <RBox args={[0.56, 0.72, 0.025]} material={local.ovenDoor} radius={0.01} />
        <RBox args={[0.4, 0.26, 0.006]} position={[0, -0.06, 0.014]} material={local.glass} radius={0.02} />
        <RBox args={[0.42, 0.022, 0.03]} position={[0, 0.17, 0.035]} material={m.chrome} radius={0.009} />
        {[-0.18, -0.06, 0.06, 0.18].map((x) => (
          <mesh key={x} position={[x, 0.3, 0.025]} rotation-x={Math.PI / 2} material={m.chrome}>
            <cylinderGeometry args={[0.02, 0.022, 0.025, 24]} />
          </mesh>
        ))}
      </group>

      {/* Cooktop: black plate, burner rings and caps, cast-iron grates */}
      <RBox args={[0.6, 0.012, 0.5]} position={[STOVE.x, COUNTER_TOP + 0.006, STOVE.z]} material={m.blackMetal} radius={0.004} />
      {burners.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, COUNTER_TOP + 0.012, z]}>
          <mesh position-y={0.006} material={local.burner}>
            <cylinderGeometry args={[0.055, 0.06, 0.012, 32]} />
          </mesh>
          <mesh position-y={0.015} material={local.castIron}>
            <cylinderGeometry args={[0.032, 0.032, 0.008, 24]} />
          </mesh>
        </group>
      ))}
      {[STOVE.x - 0.15, STOVE.x + 0.15].map((x) => (
        <group key={x}>
          {/* Grate frame and cross bars over each pair of burners */}
          <RBox args={[0.27, 0.012, 0.014]} position={[x, grateY, STOVE.z - 0.235]} material={local.castIron} radius={0.004} />
          <RBox args={[0.27, 0.012, 0.014]} position={[x, grateY, STOVE.z + 0.235]} material={local.castIron} radius={0.004} />
          <RBox args={[0.014, 0.012, 0.48]} position={[x - 0.13, grateY, STOVE.z]} material={local.castIron} radius={0.004} />
          <RBox args={[0.014, 0.012, 0.48]} position={[x + 0.13, grateY, STOVE.z]} material={local.castIron} radius={0.004} />
          {[STOVE.z - 0.12, STOVE.z + 0.12].map((z) => (
            <group key={z}>
              <RBox args={[0.26, 0.012, 0.012]} position={[x, grateY, z]} material={local.castIron} radius={0.004} />
              <RBox args={[0.012, 0.012, 0.22]} position={[x, grateY, z]} material={local.castIron} radius={0.004} />
            </group>
          ))}
        </group>
      ))}

      {/* A pot simmering on the front-right burner */}
      <group position={[STOVE.x + 0.15, grateY + 0.006, STOVE.z + 0.12]}>
        <mesh position-y={0.075} material={local.enamel} castShadow>
          <cylinderGeometry args={[0.11, 0.1, 0.15, 40]} />
        </mesh>
        <mesh position-y={0.155} material={local.enamel}>
          <sphereGeometry args={[0.112, 40, 10, 0, Math.PI * 2, 0, 0.5]} />
        </mesh>
        <mesh position-y={0.18} material={m.walnutDark}>
          <sphereGeometry args={[0.02, 16, 16]} />
        </mesh>
      </group>

      {/* Chimney range hood: faceted canopy, lip, duct up to the ceiling line, and a work light */}
      <group position={[STOVE.x, 1.67, WALL_Z + 0.27]} scale={[1, 1, 0.76]}>
        <mesh rotation-y={Math.PI / 4} material={local.hoodFaceted} castShadow>
          <cylinderGeometry args={[0.15 * Math.SQRT2, 0.34 * Math.SQRT2, 0.24, 4, 1]} />
        </mesh>
      </group>
      <RBox args={[0.7, 0.04, 0.54]} position={[STOVE.x, 1.53, WALL_Z + 0.27]} material={m.steel} radius={0.01} />
      {/* Short duct cover with a cap, so it reads as a hood rather than a pillar up the wall */}
      <RBox args={[0.26, 0.55, 0.2]} position={[STOVE.x, 1.79 + 0.275, WALL_Z + 0.11]} material={m.steel} radius={0.01} />
      <RBox args={[0.3, 0.03, 0.23]} position={[STOVE.x, 1.79 + 0.565, WALL_Z + 0.12]} material={m.steel} radius={0.008} />
      <mesh position={[STOVE.x, 1.508, WALL_Z + 0.3]} rotation-x={Math.PI / 2} material={local.hoodLight}>
        <planeGeometry args={[0.3, 0.06]} />
      </mesh>
    </group>
  );
}

/** Undermount steel basin in the countertop cutout, with a drain, gooseneck faucet and lever taps. */
function Sink() {
  const m = mats();
  const gooseneck = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0.22, 0),
          new THREE.Vector3(0, 0.33, 0.06),
          new THREE.Vector3(0, 0.3, 0.16),
          new THREE.Vector3(0, 0.22, 0.19),
        ]),
        48,
        0.013,
        12,
      ),
    [],
  );
  const drainMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b2d30', metalness: 0.8, roughness: 0.3 }), []);
  const x0 = SINK.x - SINK.w / 2;
  const x1 = SINK.x + SINK.w / 2;
  const z0 = SINK.z - SINK.d / 2;
  const z1 = SINK.z + SINK.d / 2;
  const wallH = COUNTER_TOP - SINK.bottom;
  const wallY = SINK.bottom + wallH / 2;

  return (
    <group>
      <RBox args={[SINK.w, 0.01, SINK.d]} position={[SINK.x, SINK.bottom, SINK.z]} material={m.steel} radius={0.004} />
      <RBox args={[SINK.w, wallH, 0.008]} position={[SINK.x, wallY, z0 + 0.004]} material={m.steel} radius={0.003} />
      <RBox args={[SINK.w, wallH, 0.008]} position={[SINK.x, wallY, z1 - 0.004]} material={m.steel} radius={0.003} />
      <RBox args={[0.008, wallH, SINK.d]} position={[x0 + 0.004, wallY, SINK.z]} material={m.steel} radius={0.003} />
      <RBox args={[0.008, wallH, SINK.d]} position={[x1 - 0.004, wallY, SINK.z]} material={m.steel} radius={0.003} />
      <mesh position={[SINK.x, SINK.bottom + 0.006, SINK.z]} material={drainMat}>
        <cylinderGeometry args={[0.028, 0.028, 0.004, 24]} />
      </mesh>

      {/* Faucet on the back strip of the counter, arching over the basin */}
      <group position={[SINK.x, COUNTER_TOP, WALL_Z + 0.08]}>
        <mesh position-y={0.015} material={m.chrome}>
          <cylinderGeometry args={[0.026, 0.03, 0.03, 24]} />
        </mesh>
        <mesh geometry={gooseneck} material={m.chrome} castShadow />
        {[-0.1, 0.1].map((dx) => (
          <group key={dx} position={[dx, 0, 0]}>
            <mesh position-y={0.025} material={m.chrome}>
              <cylinderGeometry args={[0.018, 0.02, 0.05, 20]} />
            </mesh>
            <mesh position={[0, 0.055, 0.03]} rotation-x={Math.PI / 2 - 0.3} material={m.chrome}>
              <cylinderGeometry args={[0.006, 0.006, 0.07, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
