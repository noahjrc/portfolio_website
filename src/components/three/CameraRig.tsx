'use client';

import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getState, type View } from '@/lib/store';
import { isDiscLoaded } from './Arcade';

type Vec3 = [number, number, number];

interface Shot {
  target: Vec3;
  /** Direction from the target toward the camera. */
  dir: Vec3;
  /** Minimum distance from the target. */
  base: number;
  /** World width that must stay in frame (pushes the camera back on narrow screens). */
  width: number;
  /** World height that must stay in frame, including room for the HUD bars (short, wide screens). */
  height: number;
}

const SHOTS: Record<View, Shot> = {
  // Straight on and a little high, so both side walls (kitchen, hi-fi) read evenly.
  overview: { target: [0.3, 0.95, -0.5], dir: [0, 0.62, 1], base: 10.6, width: 11.8, height: 4.6 },
  about: { target: [1.35, 2.05, -2.8], dir: [0.05, 0.05, 1], base: 2.4, width: 2.6, height: 2 },
  experience: { target: [-2.05, 1.6, -2.2], dir: [0.1, 0.22, 1], base: 3.8, width: 4.2, height: 3.4 },
  projects: { target: [-4.5, 0.93, -0.33], dir: [0.8, 1.4, 0.04], base: 1.5, width: 1.25, height: 0.95 },
  interests: { target: [3.55, 1.75, -2.5], dir: [-0.08, 0.2, 1], base: 3.8, width: 3.4, height: 3.2 },
  resume: { target: [0.75, 1.1, -2.55], dir: [0, 0.25, 1], base: 1.6, width: 1.3, height: 1.1 },
};

/** Close-up on the CRT once a game is loaded. */
const TV_SHOT: Shot = { target: [-2.05, 1.3, -1.76], dir: [0, 0.06, 1], base: 1.4, width: 1.4, height: 1.3 };

export function CameraRig() {
  const look = useMemo(() => new THREE.Vector3(...SHOTS.overview.target), []);
  const goalLook = useMemo(() => new THREE.Vector3(), []);
  const goalPos = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const view = getState().view;
    const shot = view === 'experience' && isDiscLoaded() ? TV_SHOT : SHOTS[view];
    const camera = state.camera as THREE.PerspectiveCamera;
    const aspect = state.size.width / Math.max(1, state.size.height);
    const halfTan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const distance = Math.max(shot.base, shot.width / 2 / (halfTan * aspect), shot.height / 2 / halfTan);

    goalLook.set(...shot.target);
    dir.set(...shot.dir).normalize();
    goalPos.copy(goalLook).addScaledVector(dir, distance);

    // A little parallax with the pointer keeps the room feeling alive.
    const sway = view === 'overview' ? 0.5 : 0.08;
    goalPos.x += state.pointer.x * sway;
    goalPos.y += state.pointer.y * sway * 0.5;

    const k = 1 - Math.exp(-2.8 * Math.min(dt, 0.1));
    camera.position.lerp(goalPos, k);
    look.lerp(goalLook, k);
    camera.lookAt(look);
  });

  return null;
}
