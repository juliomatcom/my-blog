import * as THREE from 'three';
import { buildGalaxyPointsMaterial } from '../shaders';
import type { SceneBody, Vec3 } from '../types';

export interface GalaxyOpts {
  position: Vec3;
  radius: number;
  arms: number;
  count: number;
  twist: number;
  randomness: number;
  randomnessPower?: number;
  spin: number;
  tiltX: number;
  tiltZ?: number;
  coreColor: string;
  armColor: string;
  pointSize?: number;
  brightness?: number;
}

/**
 * A distant spiral galaxy: core-concentrated points wound into `arms` logarithmic
 * arms with power-law scatter, colour lerping core -> arm with radius, brighter
 * toward the middle. Spins slowly about its own axis.
 */
export function buildGalaxy(opts: GalaxyOpts): SceneBody {
  const bright = opts.brightness ?? 1;
  const n = opts.count;
  const position = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const core = new THREE.Color(opts.coreColor);
  const arm = new THREE.Color(opts.armColor);
  const tmp = new THREE.Color();
  const R = opts.radius;
  const power = opts.randomnessPower || 3;

  for (let i = 0; i < n; i++) {
    const radius = Math.pow(Math.random(), 2.2) * R; // core-concentrated
    const branch = ((i % opts.arms) / opts.arms) * Math.PI * 2;
    const spin = radius * opts.twist;
    const scatter = () =>
      Math.pow(Math.random(), power) *
      (Math.random() < 0.5 ? 1 : -1) *
      opts.randomness *
      (radius + R * 0.08);

    position[i * 3] = Math.cos(branch + spin) * radius + scatter();
    position[i * 3 + 1] = scatter() * 0.35; // thin disk
    position[i * 3 + 2] = Math.sin(branch + spin) * radius + scatter();

    const edge = radius / R;
    tmp.copy(core).lerp(arm, Math.pow(edge, 0.7));
    const glow = (0.4 + 0.6 * (1 - edge)) * bright;
    color[i * 3] = tmp.r * glow;
    color[i * 3 + 1] = tmp.g * glow;
    color[i * 3 + 2] = tmp.b * glow;
    size[i] = (0.6 + 1.7 * Math.pow(1 - edge, 2)) * (0.7 + Math.random() * 0.6);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = buildGalaxyPointsMaterial(opts.pointSize || 260);

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
