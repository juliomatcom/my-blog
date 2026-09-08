import * as THREE from 'three';
import type { SceneBody, Vec3 } from '../types';

export interface NebulaClump {
  color: string;
  offset: Vec3;
  scale: Vec3;
  spread: number;
  weight: number;
}

export interface NebulaOpts {
  position: Vec3;
  radius: number;
  gasCount: number;
  starCount: number;
  spin: number;
  tilt?: number;
  pointSize?: number;
  clumps: NebulaClump[];
}

/**
 * A soft emission nebula: overlapping gaussian clumps of coloured gas (weighted
 * by `weight`, each fading from its centre) with a scatter of hot young cluster
 * stars sprinkled through. Rolls slowly about the view axis.
 */
export function buildNebula(opts: NebulaOpts): SceneBody {
  const R = opts.radius;
  const clumps = opts.clumps;
  const totalW = clumps.reduce((s, c) => s + c.weight, 0);
  const gas = opts.gasCount;
  const n = gas + opts.starCount;
  const position = new Float32Array(n * 3);
  const color = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const tmp = new THREE.Color();
  const white = new THREE.Color(1, 1, 1);
  const gauss = () => Math.random() + Math.random() + Math.random() - 1.5;

  let i = 0;

  // diffuse gas: overlapping coloured clumps
  for (const clump of clumps) {
    const count = Math.round((clump.weight / totalW) * gas);
    const base = new THREE.Color(clump.color);
    for (let k = 0; k < count && i < gas; k++, i++) {
      const lx = gauss() * clump.spread * R * clump.scale[0];
      const ly = gauss() * clump.spread * R * clump.scale[1];
      const lz = gauss() * clump.spread * R * clump.scale[2];
      position[i * 3] = clump.offset[0] + lx;
      position[i * 3 + 1] = clump.offset[1] + ly;
      position[i * 3 + 2] = clump.offset[2] + lz;
      const d = Math.sqrt(lx * lx + ly * ly + lz * lz) / (clump.spread * R);
      const falloff = Math.max(0, 1 - d);
      const glow = (0.05 + 0.28 * falloff * falloff) * (0.5 + Math.random() * 1.0);
      tmp.copy(base).lerp(white, Math.random() * 0.3 * falloff);
      color[i * 3] = tmp.r * glow;
      color[i * 3 + 1] = tmp.g * glow;
      color[i * 3 + 2] = tmp.b * glow;
      size[i] = 3.0 + Math.random() * 5.0;
    }
  }
  while (i < gas) {
    size[i] = 0;
    i++;
  }

  // hot young cluster stars sprinkled through it
  for (let s = 0; s < opts.starCount; s++, i++) {
    position[i * 3] = gauss() * R * 0.8;
    position[i * 3 + 1] = gauss() * R * 0.55;
    position[i * 3 + 2] = gauss() * R * 0.6;
    tmp.set(Math.random() < 0.18 ? '#ffd7a0' : '#d2e2ff');
    const b = 0.5 + Math.random() * 1.1;
    color[i * 3] = tmp.r * b;
    color[i * 3 + 1] = tmp.g * b;
    color[i * 3 + 2] = tmp.b * b;
    size[i] = 1.6 + Math.random() * 3.6;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uDpr: { value: 1 },
      uSize: { value: opts.pointSize || 300 },
    },
    vertexShader: `
      attribute vec3 aColor;
      attribute float aSize;
      uniform float uDpr;
      uniform float uSize;
      varying vec3 vColor;
      void main () {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vColor = aColor;
        gl_PointSize = clamp(uSize * aSize / max(1.0, -mv.z), 0.5, 22.0) * uDpr;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying vec3 vColor;
      void main () {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const group = new THREE.Group();
  group.position.set(opts.position[0], opts.position[1], opts.position[2]);
  group.rotation.z = opts.tilt || 0;
  group.add(points);

  return {
    object: group,
    setPixelRatio(dpr: number) {
      material.uniforms.uDpr.value = dpr;
    },
    update(dt: number) {
      group.rotation.z += dt * (opts.spin || 0);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
