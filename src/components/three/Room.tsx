'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { roomTheme } from '@/lib/themes';
import { FairyTree } from './FairyTree';
import { RBox, mats } from './materials';
import { WALL_Z } from './util';

const T = roomTheme();
/** Floor runs from the back wall (z = -2.8) to the open front edge at z = 2.4. */
const ROOM = { depth: 5.2, cz: -0.2 };
/** Side-wall trim runs (z from → to). The left run ends where the kitchen begins. */
const SIDE_TRIM = [
  { side: -1, from: WALL_Z, to: -0.95 },
  { side: 1, from: WALL_Z, to: ROOM.cz + ROOM.depth / 2 },
];

function repeated(texture: THREE.Texture, x: number, y: number) {
  const t = texture.clone();
  t.repeat.set(x, y);
  t.needsUpdate = true;
  return t;
}

export function Room() {
  const m = mats();
  const surfaces = useMemo(() => {
    const floor = repeated(m.textures.planks, 5, ROOM.depth / 2);
    const backWall = repeated(m.textures.plaster, 8.3, 3.4);
    const sideWall = repeated(m.textures.plaster, ROOM.depth * 0.8, 3.4);
    const plaster = (map: THREE.Texture) =>
      new THREE.MeshStandardMaterial({ color: T.wall, map, bumpMap: map, bumpScale: 0.1, roughness: 0.95 });
    return {
      floor: new THREE.MeshStandardMaterial({ color: '#b07a48', map: floor, bumpMap: floor, bumpScale: 0.5, roughness: 0.45 }),
      backWall: plaster(backWall),
      sideWall: plaster(sideWall),
      panel: m.lacquer(T.trim),
      rug: new THREE.MeshStandardMaterial({ map: m.textures.rug, bumpMap: m.textures.fabric, bumpScale: 1.5, roughness: 1 }),
      soil: new THREE.MeshStandardMaterial({ color: '#2a1d14', roughness: 1 }),
      leaf: new THREE.MeshStandardMaterial({ color: T.leaves[0], roughness: 0.55, side: THREE.DoubleSide }),
      leafLight: new THREE.MeshStandardMaterial({ color: T.leaves[1], roughness: 0.55, side: THREE.DoubleSide }),
    };
  }, [m]);

  return (
    <group>
      {/* Floor slab: stops at the side walls' inner faces so their front faces never
          share a plane with it (that overlap z-fought at the front corners). */}
      <mesh position={[0, -0.15, ROOM.cz]} material={surfaces.floor} receiveShadow>
        <boxGeometry args={[10, 0.3, ROOM.depth]} />
      </mesh>

      {/* Walls: back, left and right */}
      <mesh position={[0, 1.85, WALL_Z - 0.1]} material={surfaces.backWall} receiveShadow>
        <boxGeometry args={[10.4, 4.3, 0.2]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 5.1, 1.85, ROOM.cz]} material={surfaces.sideWall} receiveShadow>
          <boxGeometry args={[0.2, 4.3, ROOM.depth]} />
        </mesh>
      ))}

      {/* Lacquered lower panelling with a walnut cap rail. The back run stops at the
          side walls' panelling and the side runs start in front of the back run, so
          no two pieces overlap at the corners. The left wall stops where the kitchen
          starts (cabinets and backsplash cover it). */}
      <RBox args={[9.94, 0.88, 0.03]} position={[0, 0.44, WALL_Z + 0.015]} material={surfaces.panel} radius={0.005} />
      <RBox args={[9.88, 0.05, 0.06]} position={[0, 0.9, WALL_Z + 0.03]} material={m.walnut} radius={0.01} />
      {SIDE_TRIM.map(({ side, from, to }) => (
        <group key={side}>
          <RBox
            args={[0.03, 0.88, to - from - 0.03]}
            position={[side * 4.985, 0.44, (from + 0.03 + to) / 2]}
            material={surfaces.panel}
            radius={0.005}
          />
          <RBox
            args={[0.06, 0.05, to - from - 0.06]}
            position={[side * 4.97, 0.9, (from + 0.06 + to) / 2]}
            material={m.walnut}
            radius={0.01}
          />
        </group>
      ))}

      {/* Patterned rug pulled up to the TV: the living-room nook */}
      <mesh position={[-2.05, 0.01, -1.0]} material={surfaces.rug} receiveShadow>
        <boxGeometry args={[2.6, 0.018, 1.6]} />
      </mesh>

      {/* Bouclé beanbag on the rug, facing the TV */}
      <mesh
        position={[-1.9, 0.27, -0.55]}
        rotation={[0.12, 0.4, 0.08]}
        scale={[0.48, 0.3, 0.46]}
        material={m.fabric(T.beanbag)}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[1, 48, 32]} />
      </mesh>

      {/* Potted tree wrapped in fairy lights, in the back corner between the kitchen and the TV credenza */}
      <FairyTree position={[-4.45, 0, -2.35]} />

      {/* Matching rug under and around the bed */}
      <mesh position={[3.69, 0.01, 0.35]} material={surfaces.rug} receiveShadow>
        <boxGeometry args={[2.55, 0.018, 2.2]} />
      </mesh>

      {/* Tall fiddle-leaf fig in a floor pot, beside the turntable credenza */}
      <group position={[1.9, 0, -2.42]}>
        <mesh position-y={0.225} material={m.ceramic(T.pot)} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.17, 0.45, 40]} />
        </mesh>
        {/* Soil sits just above the pot's top so the two surfaces never coincide (no z-fighting). */}
        <mesh position-y={0.452} material={surfaces.soil}>
          <cylinderGeometry args={[0.19, 0.19, 0.012, 32]} />
        </mesh>
        <mesh position={[0.02, 1.1, 0]} rotation-z={-0.04} material={m.walnutDark} castShadow>
          <cylinderGeometry args={[0.018, 0.028, 1.32, 10]} />
        </mesh>
        {Array.from({ length: 24 }, (_, i) => {
          // Leaves spiral up the upper trunk, larger and more spread toward the top.
          const t = i / 23;
          const angle = i * 2.4;
          const y = 0.95 + t * 0.9;
          // Far enough out that each leaf's base just meets the trunk instead of
          // passing through it or its neighbours.
          const reach = 0.15 + t * 0.06;
          const size = 0.85 + t * 0.35;
          return (
            <group key={i} position={[Math.cos(angle) * 0.03, y, Math.sin(angle) * 0.03]} rotation-y={angle}>
              <mesh
                position={[0, 0.06, reach]}
                rotation-x={0.9 - t * 0.5}
                scale={[0.11 * size, 0.17 * size, 0.012]}
                material={i % 2 ? surfaces.leaf : surfaces.leafLight}
                castShadow
              >
                <sphereGeometry args={[1, 20, 14]} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}
