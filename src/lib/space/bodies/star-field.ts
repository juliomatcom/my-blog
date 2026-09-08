import * as THREE from 'three';
import { CONFIG } from '../config';
import type { SceneBody } from '../types';

/**
 * A deep cloud of real 3D point stars streaming toward the camera along +z.
 * Power-law brightness (most barely visible, a few bright), warm/cool tint mix,
 * a per-star twinkle phase. Count and drift speed come from `CONFIG` so the
 * orchestrator can thin the field for blog posts.
 */
export function buildStarField(): SceneBody {
  const n = CONFIG.starCount;
  const position = new Float32Array(n * 3);
  const size = new Float32Array(n);
  const color = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  const tint = new THREE.Color();

  const halfFov = (CONFIG.fov * Math.PI) / 180 / 2;
  const spread = Math.tan(halfFov) * CONFIG.margin;

  const place = (i: number, atBack: boolean) => {
    const z = atBack
      ? -CONFIG.depth
      : -(CONFIG.near + Math.random() * (CONFIG.depth - CONFIG.near));
    const reach = Math.abs(z) * spread;
    position[i * 3] = (Math.random() * 2 - 1) * reach * 1.5; // extra width for landscape
    position[i * 3 + 1] = (Math.random() * 2 - 1) * reach;
    position[i * 3 + 2] = z;

    // power-law brightness: most stars barely visible, a few bright
    const m = Math.pow(Math.random(), 4.5);
    size[i] = 0.5 + m * 3.0;
    const b = 0.12 + m * 1.35;
    tint.setRGB(0.6, 0.72, 1.0).lerp(new THREE.Color(1.0, 0.82, 0.62), Math.random());
    color[i * 3] = tint.r * b;
    color[i * 3 + 1] = tint.g * b;
    color[i * 3 + 2] = tint.b * b;
    phase[i] = Math.random() * Math.PI * 2;
  };
  for (let i = 0; i < n; i++) place(i, false);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phase, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDpr: { value: 1 },
      uSize: { value: 135 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute vec3 aColor;
      attribute float aPhase;
      uniform float uTime;
      uniform float uDpr;
      uniform float uSize;
      varying vec3 vColor;
      varying float vTw;
      void main () {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        vColor = aColor;
        vTw = 0.78 + 0.22 * sin(uTime * (0.6 + aPhase) + aPhase * 8.0);
        float s = uSize * aSize / max(1.0, -mv.z);
        gl_PointSize = clamp(s, 0.6, 22.0) * uDpr;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying vec3 vColor;
      varying float vTw;
      void main () {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        if (a < 0.003) discard;
        gl_FragColor = vec4(vColor * vTw, a);
      }
    `,
  });

  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  return {
    object: points,
    setPixelRatio(dpr: number) {
      material.uniforms.uDpr.value = dpr;
    },
    update(dt: number, time: number) {
      material.uniforms.uTime.value = time;
      const p = position;
      const step = CONFIG.drift * dt;
      for (let i = 0; i < n; i++) {
        p[i * 3 + 2] += step;
        if (p[i * 3 + 2] > 2) place(i, true);
      }
      geometry.attributes.position.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
