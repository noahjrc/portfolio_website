'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { profile } from '@/data/content';
import { coverFit } from '@/lib/canvas';
import { RBox, mats } from './materials';
import { useInteractive } from './useInteractive';
import { WALL_Z } from './util';

/** Hung centred over the desk (the résumé lives on the desk's monitor). */
const PORTRAIT_POS: [number, number, number] = [0.8, 2.25, WALL_Z + 0.03];

export function WallDecor() {
  return <Portrait />;
}

/** Eases a wall-hung group off the wall while it's hovered. */
function useLift(hovered: boolean, restZ: number, tilt: number) {
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    ref.current.position.z = THREE.MathUtils.damp(ref.current.position.z, restZ + (hovered ? 0.05 : 0), 8, dt);
    ref.current.rotation.z = THREE.MathUtils.damp(ref.current.rotation.z, hovered ? 0 : tilt, 6, dt);
  });
  return ref;
}

function Portrait() {
  const photo = useTexture(profile.photo);
  useMemo(() => {
    photo.colorSpace = THREE.SRGBColorSpace;
    coverFit(photo, 0.74 / 0.94);
    photo.needsUpdate = true;
  }, [photo]);
  const { hovered, handlers } = useInteractive('about');
  const ref = useLift(hovered, PORTRAIT_POS[2], -0.03);

  return (
    <group ref={ref} position={PORTRAIT_POS} rotation-z={-0.03} {...handlers}>
      <RBox args={[0.95, 1.15, 0.05]} material={mats().walnutDark} radius={0.012} />
      <mesh position-z={0.0255}>
        <planeGeometry args={[0.86, 1.06]} />
        <meshStandardMaterial color="#f4ecdc" roughness={0.9} />
      </mesh>
      <mesh position-z={0.027}>
        <planeGeometry args={[0.74, 0.94]} />
        <meshStandardMaterial map={photo} roughness={0.8} />
      </mesh>
    </group>
  );
}
