'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { rng } from '@/lib/canvas';
import { roomTheme } from '@/lib/themes';
import { mats } from './materials';

const T = roomTheme();
const POT = { r: 0.24, h: 0.42 };
/** Leaf clusters that make up the canopy: [x, y, z, radius]. */
const CLUSTERS: [number, number, number, number][] = [
  [0, 1.62, 0, 0.36],
  [-0.16, 1.9, 0.08, 0.3],
  [0.17, 1.84, -0.07, 0.3],
  [0.03, 2.12, 0, 0.25],
  [-0.05, 1.4, -0.12, 0.24],
];
const LEAF_COUNT = 520;
const BULB_COUNT = 90;

/** A point on the fairy-light wrap: low turns around the trunk, then wide loops through the canopy. */
function lightPath(t: number) {
  if (t < 0.3) {
    const k = t / 0.3;
    const a = k * Math.PI * 6;
    return new THREE.Vector3(Math.cos(a) * 0.055, POT.h + 0.1 + k * 0.85, Math.sin(a) * 0.055);
  }
  const k = (t - 0.3) / 0.7;
  const y = 1.32 + k * 0.9;
  const a = k * Math.PI * 9;
  const r = 0.12 + 0.3 * Math.sin(Math.PI * Math.min(1, k * 1.05));
  return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
}

/** Potted olive-style tree with warm fairy lights wound up the trunk and through the leaves. */
export function FairyTree({ position }: { position: [number, number, number] }) {
  const m = mats();
  const leaves = useRef<THREE.InstancedMesh>(null!);
  const bulbs = useRef<THREE.InstancedMesh>(null!);

  const local = useMemo(
    () => ({
      pot: m.ceramic('#e9dfcc'),
      soil: new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 1 }),
      bark: new THREE.MeshStandardMaterial({ color: '#5b4632', roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, side: THREE.DoubleSide }),
      wire: new THREE.MeshStandardMaterial({ color: '#2f3a24', roughness: 0.6 }),
      // Above the bloom threshold, so each bulb glows.
      bulb: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffcf7a').multiplyScalar(3), toneMapped: false }),
      leafGeometry: new THREE.SphereGeometry(1, 8, 6),
      bulbGeometry: new THREE.SphereGeometry(0.011, 8, 6),
    }),
    [m],
  );

  const trunk = useMemo(
    () =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, POT.h, 0),
          new THREE.Vector3(0.03, 0.9, 0.01),
          new THREE.Vector3(-0.02, 1.35, 0),
          new THREE.Vector3(0.02, 1.85, 0),
        ]),
        24,
        0.035,
        10,
      ),
    [],
  );
  const branches = useMemo(
    () =>
      CLUSTERS.slice(1).map(
        ([x, y, z]) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(0, y - 0.35, 0),
              new THREE.Vector3(x * 0.6, y - 0.12, z * 0.6),
              new THREE.Vector3(x, y, z),
            ]),
            12,
            0.014,
            6,
          ),
      ),
    [],
  );
  const wire = useMemo(() => {
    const points = Array.from({ length: 240 }, (_, i) => lightPath(i / 239));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 480, 0.0025, 4);
  }, []);

  useLayoutEffect(() => {
    const r = rng(77);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    const greens = ['#5f7445', '#6f8552', '#4f6438', '#7d9160'];
    for (let i = 0; i < LEAF_COUNT; i++) {
      const [cx, cy, cz, cr] = CLUSTERS[Math.floor(r() * CLUSTERS.length)];
      // Mostly near each cluster's surface, so the canopy reads as full but airy.
      const dir = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
      const dist = cr * (0.55 + r() * 0.45);
      dummy.position.set(cx + dir.x * dist, cy + dir.y * dist * 0.85, cz + dir.z * dist);
      dummy.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
      const s = 0.8 + r() * 0.5;
      dummy.scale.set(0.022 * s, 0.055 * s, 0.006);
      dummy.updateMatrix();
      leaves.current.setMatrixAt(i, dummy.matrix);
      leaves.current.setColorAt(i, color.set(greens[Math.floor(r() * greens.length)]));
    }
    leaves.current.instanceMatrix.needsUpdate = true;
    if (leaves.current.instanceColor) leaves.current.instanceColor.needsUpdate = true;

    for (let i = 0; i < BULB_COUNT; i++) {
      dummy.position.copy(lightPath((i + 0.5) / BULB_COUNT));
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      bulbs.current.setMatrixAt(i, dummy.matrix);
    }
    bulbs.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group position={position}>
      <mesh position-y={POT.h / 2} material={local.pot} castShadow receiveShadow>
        <cylinderGeometry args={[POT.r, POT.r * 0.8, POT.h, 40]} />
      </mesh>
      <mesh position-y={POT.h + 0.005} material={local.soil}>
        <cylinderGeometry args={[POT.r - 0.02, POT.r - 0.02, 0.012, 32]} />
      </mesh>
      <mesh geometry={trunk} material={local.bark} castShadow />
      {branches.map((g, i) => (
        <mesh key={i} geometry={g} material={local.bark} castShadow />
      ))}
      <instancedMesh ref={leaves} args={[local.leafGeometry, local.leaf, LEAF_COUNT]} castShadow />
      <mesh geometry={wire} material={local.wire} />
      <instancedMesh ref={bulbs} args={[local.bulbGeometry, local.bulb, BULB_COUNT]} />
      <pointLight position-y={1.6} intensity={T.lights.lampIntensity} distance={7} decay={2} color={T.lights.lamp} />
    </group>
  );
}
