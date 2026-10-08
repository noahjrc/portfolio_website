import * as THREE from 'three';

export const smooth = (t: number) => t * t * (3 - 2 * t);

/** A cylinder (disc/record) standing upright with its top face toward the viewer. */
export const Q_UPRIGHT = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
/** A cylinder lying flat with its top face up. */
export const Q_FLAT = new THREE.Quaternion();
export const Y_AXIS = new THREE.Vector3(0, 1, 0);

/** Front face of the back wall. */
export const WALL_Z = -2.8;
