import type * as THREE from 'three';

export type Vec3 = [number, number, number];

/**
 * The contract every celestial body implements. `initSpaceScene` only ever talks
 * to a body through this shape: drop `object` into a scene, feed `update` each
 * frame, `dispose` on teardown. `setPixelRatio` is optional -- only the
 * point-cloud bodies (stars, galaxies, nebulae) care about DPR.
 */
export interface SceneBody {
  readonly object: THREE.Object3D;
  setPixelRatio?(dpr: number): void;
  /** @param dt seconds since last frame @param time seconds since start */
  update(dt: number, time: number): void;
  dispose(): void;
}
