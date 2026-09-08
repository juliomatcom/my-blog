import * as THREE from 'three';
import { buildGalaxyPointsMaterial } from '../shaders';
import type { SceneBody, Vec3 } from '../types';

export interface LenticularOpts {
  position: Vec3;
  radius: number;
  count: number;
  spin: number;
  tiltX: number;
  tiltZ?: number;
  coreColor: string;
  edgeColor: string;
  pointSize?: number;
  brightness?: number;
}

/**
 * A lenticular (S0) galaxy: a big smooth central bulge fading into a wafer-thin
 * lens-shaped disk, no arms, older warm stars -- strongly core-concentrated
 * points, thick at the centre and thin at the rim, on a near-edge-on tilt.
 */
export function buildLenticular(opts: LenticularOpts): SceneBody {
  const bright = opts.brightness ?? 1;
  const n = opts.count;
  const position = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const core = new THREE.Color(opts.coreColor);
  const edge = new THREE.Color(opts.edgeColor);
  const tmp = new THREE.Color();
  const R = opts.radius;
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

  for (let i = 0; i < n; i++) {
    const rr = Math.pow(Math.random(), 1.35); // enough points out in the disk to read as a sheet
    const radius = rr * R;
    const ang = Math.random() * Math.PI * 2;
    // lens profile: a small round bulge, everything else a wafer-thin disk
    const thickness = R * (0.16 * Math.pow(1 - rr, 2.0) + 0.022);

    position[i * 3] = Math.cos(ang) * radius;
    position[i * 3 + 1] = gauss() * thickness;
    position[i * 3 + 2] = Math.sin(ang) * radius;

    const e = radius / R;
    tmp.copy(core).lerp(edge, Math.pow(e, 0.5));
    const glow = (0.32 + 0.55 * Math.pow(1 - e, 1.4)) * bright;
    color[i * 3] = tmp.r * glow;
    color[i * 3 + 1] = tmp.g * glow;
    color[i * 3 + 2] = tmp.b * glow;
    size[i] = (0.7 + 1.1 * Math.pow(1 - e, 1.6)) * (0.7 + Math.random() * 0.5);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = buildGalaxyPointsMaterial(opts.pointSize || 240);

  const disk = new THREE.Points(geometry, material);
  disk.frustumCulled = false;

  const pivot = new THREE.Group();
  pivot.position.set(opts.position[0], opts.position[1], opts.position[2]);
  pivot.rotation.x = opts.tiltX;
  pivot.rotation.z = opts.tiltZ || 0;
  pivot.add(disk);

  return {
    object: pivot,
    setPixelRatio(dpr: number) {
      material.uniforms.uDpr.value = dpr;
    },
    update(dt: number) {
      disk.rotation.y += dt * opts.spin;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
