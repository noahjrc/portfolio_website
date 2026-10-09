'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { albums } from '@/data/content';
import { useCanvasTexture } from '@/lib/canvas';
import { playAlbum, togglePlayback } from '@/lib/player';
import { getState, useStore } from '@/lib/store';
import { roomTheme } from '@/lib/themes';
import { Credenza, RBox, mats } from './materials';
import { useInteractive } from './useInteractive';
import { Q_FLAT, Q_UPRIGHT, WALL_Z, smooth } from './util';

const T = roomTheme();

const CAB = { x: 3.2, z: -2.35, w: 2.6, h: 0.75, d: 0.8 };
/** Turntable centred on the credenza, a speaker either side. */
const TT = { x: CAB.x, z: -2.3 };
const SPEAKER_XS = [CAB.x - 0.95, CAB.x + 0.95];
const PLINTH_TOP = CAB.h + 0.12;
const PLATTER = new THREE.Vector3(TT.x - 0.1, PLINTH_TOP + 0.03, TT.z);
const RECORD_Y = PLATTER.y + 0.004;
const ARM_PIVOT = new THREE.Vector3(TT.x + 0.36, PLINTH_TOP + 0.07, TT.z - 0.3);
const ARM_PLAYING = -0.5;
const RPM_33 = (33.33 / 60) * Math.PI * 2;

const PER_ROW = 10;
const GAP = 0.235;
const SLEEVE = 0.22;
const ROW0 = 1.45;
const ROW_H = 0.44;
const SHELF_X = 3.05;
const ROWS = Math.ceil(albums.length / PER_ROW);

function sleevePose(i: number) {
  const row = Math.floor(i / PER_ROW);
  const col = i % PER_ROW;
  const inRow = Math.min(PER_ROW, albums.length - row * PER_ROW);
  // Reads like a page: the first records sit on the top shelf, left to right.
  const shelf = ROWS - 1 - row;
  return new THREE.Vector3(SHELF_X + (col - (inRow - 1) / 2) * GAP, ROW0 + shelf * ROW_H + 0.02 + SLEEVE / 2, WALL_Z + 0.07);
}

const sleeveEdge = new THREE.MeshStandardMaterial({ color: '#141414', roughness: 0.8 });

export function Vinyl() {
  const covers = useTexture(albums.map((a) => a.coverImage));
  useMemo(() => {
    covers.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      t.needsUpdate = true;
    });
  }, [covers]);

  return (
    <group>
      <Cabinet />
      {Array.from({ length: ROWS }, (_, r) => (
        <group key={r} position={[SHELF_X, ROW0 + r * ROW_H, WALL_Z + 0.07]}>
          <RBox args={[PER_ROW * GAP + 0.1, 0.03, 0.14]} material={mats().walnut} radius={0.008} />
          <RBox args={[PER_ROW * GAP + 0.1, 0.05, 0.015]} position={[0, 0.025, 0.07]} material={mats().walnut} radius={0.006} />
        </group>
      ))}
      {albums.map((album, i) => (
        <Sleeve key={album.coverImage} index={i} texture={covers[i]} />
      ))}
      <Turntable covers={covers} />
    </group>
  );
}

/** The shared walnut credenza, carrying a pair of speakers. */
function Cabinet() {
  const m = mats();
  const local = useMemo(
    () => ({
      grille: new THREE.MeshStandardMaterial({ color: '#cbbd9f', map: m.textures.fabric, bumpMap: m.textures.fabric, bumpScale: 1, roughness: 1 }),
      cone: new THREE.MeshStandardMaterial({ color: '#2b2622', roughness: 0.7 }),
    }),
    [m],
  );
  return (
    <group>
      <Credenza w={CAB.w} h={CAB.h} d={CAB.d} legH={0.2} position={[CAB.x, 0, CAB.z]} />

      {/* A pair of walnut bookshelf speakers with fabric grilles */}
      {SPEAKER_XS.map((x) => (
        <group key={x} position={[x, CAB.h, -2.35]}>
          <RBox args={[0.45, 0.62, 0.42]} position-y={0.31} material={m.walnut} radius={0.025} />
          <RBox args={[0.37, 0.54, 0.01]} position={[0, 0.31, 0.211]} material={local.grille} radius={0.01} />
          {[
            [0.22, 0.13],
            [0.47, 0.045],
          ].map(([y, r]) => (
            <mesh key={y} position={[0, y, 0.205]} rotation-x={Math.PI / 2} material={local.cone}>
              <cylinderGeometry args={[r, r, 0.01, 32]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function Sleeve({ index, texture }: { index: number; texture: THREE.Texture }) {
  const album = albums[index];
  const selected = useStore((s) => s.album === index);
  const { hovered, handlers } = useInteractive('interests', `${album.title} · ${album.artist}`, () =>
    playAlbum(index),
  );
  const home = useMemo(() => sleevePose(index), [index]);
  const materials = useMemo(
    () => [sleeveEdge, sleeveEdge, sleeveEdge, sleeveEdge, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.6 }), sleeveEdge],
    [texture],
  );
  const ref = useRef<THREE.Group>(null!);

  useFrame((_, dt) => {
    const out = selected ? 0.12 : hovered ? 0.06 : 0;
    const up = selected ? 0.05 : hovered ? 0.03 : 0;
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, home.z + out, 10, dt);
    ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, home.y + up, 10, dt);
  });

  return (
    <group ref={ref} position={home} rotation-x={-0.12}>
      <mesh material={materials} castShadow {...handlers}>
        <boxGeometry args={[SLEEVE, SLEEVE, 0.008]} />
      </mesh>
    </group>
  );
}

function drawGrooves(ctx: CanvasRenderingContext2D, w: number) {
  const c = w / 2;
  ctx.fillStyle = '#0b0b0b';
  ctx.fillRect(0, 0, w, w);
  ctx.lineWidth = 1.5;
  for (let r = c * 0.36; r < c * 0.98; r += 3) {
    ctx.strokeStyle = Math.floor(r) % 2 ? '#181818' : '#0e0e0e';
    ctx.beginPath();
    ctx.arc(c, c, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = '#050505';
  ctx.lineWidth = 4;
  for (const f of [0.55, 0.7, 0.85]) {
    ctx.beginPath();
    ctx.arc(c, c, c * f, 0, Math.PI * 2);
    ctx.stroke();
  }
  const sheen = ctx.createLinearGradient(0, 0, w, w);
  sheen.addColorStop(0.35, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.5, 'rgba(255, 255, 255, 0.09)');
  sheen.addColorStop(0.65, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(c, c, c * 0.98, 0, Math.PI * 2);
  ctx.fill();
}

function Turntable({ covers }: { covers: THREE.Texture[] }) {
  const grooves = useCanvasTexture(512, 512, (ctx, w) => drawGrooves(ctx, w));
  const vinyl = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: '#0d0d0d', roughness: 0.4 });
    const face = new THREE.MeshStandardMaterial({ map: grooves, roughness: 0.25, metalness: 0.1 });
    return [edge, face, face];
  }, [grooves]);
  const labelMat = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.6 }), []);
  const { handlers } = useInteractive('interests', 'Play / pause', togglePlayback);

  // Out of the sleeve's top, across the room (growing to full size), then down onto the platter.
  const paths = useMemo(
    () =>
      albums.map((_, i) => {
        const start = sleevePose(i).add(new THREE.Vector3(0, 0.05, 0.12));
        const risen = start.clone().add(new THREE.Vector3(0, 0.28, 0.08));
        const above = new THREE.Vector3(PLATTER.x, RECORD_Y + 0.4, PLATTER.z);
        const control = risen.clone().lerp(above, 0.5).add(new THREE.Vector3(0, 0.25, 0.35));
        const rest = new THREE.Vector3(PLATTER.x, RECORD_Y, PLATTER.z);
        return { start, risen, above, rest, curve: new THREE.QuadraticBezierCurve3(risen, control, above) };
      }),
    [],
  );

  const record = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const platter = useRef<THREE.Mesh>(null!);
  const arm = useRef<THREE.Group>(null!);
  const progress = useRef(0);
  const current = useRef<number | null>(null);

  useFrame((_, dt) => {
    const { album, status } = getState();
    if (album !== current.current) {
      current.current = album;
      progress.current = 0;
      if (album !== null) {
        labelMat.map = covers[album];
        labelMat.needsUpdate = true;
      }
    }

    let armTarget = 0;
    const g = record.current;
    if (album === null) {
      g.visible = false;
    } else {
      g.visible = true;
      const path = paths[album];
      const p = (progress.current = Math.min(1, progress.current + dt / 1.8));
      let flat = 0;
      let scale = 0.35;
      if (p < 0.2) {
        g.position.lerpVectors(path.start, path.risen, smooth(p / 0.2));
      } else if (p < 0.8) {
        flat = smooth((p - 0.2) / 0.6);
        scale = 0.35 + 0.65 * flat;
        path.curve.getPoint(flat, g.position);
      } else {
        flat = 1;
        scale = 1;
        g.position.lerpVectors(path.above, path.rest, smooth((p - 0.8) / 0.2));
      }
      g.quaternion.slerpQuaternions(Q_UPRIGHT, Q_FLAT, flat);
      g.scale.setScalar(scale);

      const spinning = p >= 1 && (status === 'loading' || status === 'playing' || status === 'unavailable');
      if (spinning) {
        armTarget = ARM_PLAYING;
        spin.current.rotation.y -= dt * RPM_33;
        platter.current.rotation.y -= dt * RPM_33;
      }
    }
    arm.current.rotation.y = THREE.MathUtils.damp(arm.current.rotation.y, armTarget, 4, dt);
  });

  return (
    <group>
      <group {...handlers}>
        <RBox args={[1.05, 0.12, 0.8]} position={[TT.x, CAB.h + 0.06, TT.z]} material={mats().walnutDark} radius={0.02} />
        <mesh ref={platter} position={[PLATTER.x, PLINTH_TOP + 0.015, PLATTER.z]} material={mats().chrome} castShadow>
          <cylinderGeometry args={[0.33, 0.33, 0.03, 96]} />
        </mesh>
        <mesh position={[PLATTER.x, PLATTER.y + 0.02, PLATTER.z]}>
          <cylinderGeometry args={[0.008, 0.008, 0.04, 8]} />
          <meshStandardMaterial color="#ddd" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[TT.x + 0.42, PLINTH_TOP + 0.005, TT.z + 0.3]}>
          <cylinderGeometry args={[0.035, 0.035, 0.01, 32]} />
          <meshStandardMaterial color="#c9a24a" metalness={1} roughness={0.3} />
        </mesh>
      </group>

      {/* Tonearm */}
      <group ref={arm} position={ARM_PIVOT}>
        <mesh position-y={-0.035}>
          <cylinderGeometry args={[0.05, 0.05, 0.07, 20]} />
          <meshStandardMaterial color="#c8c8c8" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position-z={0.225} rotation-x={Math.PI / 2} castShadow>
          <cylinderGeometry args={[0.008, 0.008, 0.45, 8]} />
          <meshStandardMaterial color="#d8d8d8" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.02, 0.48]} castShadow>
          <boxGeometry args={[0.05, 0.02, 0.07]} />
          <meshStandardMaterial color="#15122b" />
        </mesh>
        <mesh position-z={-0.06} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 0.06, 16]} />
          <meshStandardMaterial color="#555" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* The record that travels from the shelf to the platter */}
      <group ref={record} visible={false}>
        <group ref={spin}>
          <mesh material={vinyl} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.004, 64]} />
          </mesh>
          <mesh material={labelMat} position-y={0.0025} rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.1, 48]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
