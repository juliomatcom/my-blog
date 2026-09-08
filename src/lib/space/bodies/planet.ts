import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders';
import type { SceneBody, Vec3 } from '../types';

// --- Planet rings -----------------------------------------------------

export interface RingOpts {
  inner: number;
  outer: number;
  opacity: number;
  color: string;
  tilt?: number;
  yaw?: number;
  spin?: number;
  seed?: number;
  rings: { pos: number; width: number; strength: number }[];
}

/** A flat annulus with up to four soft gaussian bands of fbm-grained dust. */
function buildRing(opts: RingOpts) {
  const pad = (arr: number[], len: number) => {
    const out = arr.slice(0, len);
    while (out.length < len) out.push(0);
    return out;
  };
  const geometry = new THREE.RingGeometry(opts.inner, opts.outer, 180, 1);
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uInner: { value: opts.inner },
      uOuter: { value: opts.outer },
      uColor: { value: new THREE.Color(opts.color) },
      uOpacity: { value: opts.opacity },
      uSeed: { value: opts.seed || 3.0 },
      uCount: { value: opts.rings.length },
      uPos: {
        value: pad(
          opts.rings.map((r) => r.pos),
          4,
        ),
      },
      uWidth: {
        value: pad(
          opts.rings.map((r) => r.width),
          4,
        ),
      },
      uAmp: {
        value: pad(
          opts.rings.map((r) => r.strength),
          4,
        ),
      },
    },
    vertexShader: `
      varying vec2 vLocal;
      void main () {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform float uInner;
      uniform float uOuter;
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uSeed;
      uniform int uCount;
      uniform float uPos[4];
      uniform float uWidth[4];
      uniform float uAmp[4];
      varying vec2 vLocal;
      ${NOISE_GLSL}
      void main () {
        float r = length(vLocal);
        float t = (r - uInner) / (uOuter - uInner);
        if (t < 0.0 || t > 1.0) discard;
        float ang = atan(vLocal.y, vLocal.x);
        float grain = 0.6 + 0.4 * fbm(vec3(r * 0.5, ang * 1.5, uSeed));
        float density = 0.0;
        for (int i = 0; i < 4; i++) {
          if (i >= uCount) break;
          float x = (t - uPos[i]) / uWidth[i];
          density += uAmp[i] * exp(-x * x);
        }
        float a = density * grain * uOpacity;
        if (a < 0.002) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2 - (opts.tilt ?? 0.35);
  mesh.rotation.y = opts.yaw || 0;
  return {
    object: mesh,
    update(dt: number) {
      mesh.rotation.z += dt * (opts.spin ?? 0.01);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}

// --- Planet ----------------------------------------------------------

export interface PlanetOpts {
  radius: number;
  position: Vec3;
  seed: number;
  freq: number;
  bandMix: number;
  spin: number;
  tilt?: number;
  colorA: string;
  colorB: string;
  atmosphere: string;
  ring?: RingOpts;
}

/** An fbm-shaded sphere with banding, a fresnel atmosphere rim and an optional ring. */
export function buildPlanet(opts: PlanetOpts): SceneBody {
  const geometry = new THREE.SphereGeometry(opts.radius, 64, 64);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.55, 0.4, 0.6).normalize() },
      uColorA: { value: new THREE.Color(opts.colorA) },
      uColorB: { value: new THREE.Color(opts.colorB) },
      uAtm: { value: new THREE.Color(opts.atmosphere) },
      uFreq: { value: opts.freq },
      uBandMix: { value: opts.bandMix },
      uSeed: { value: opts.seed },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main () {
        vNormal = normalize(mat3(modelMatrix) * normal);
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vView = normalize(cameraPosition - worldPos);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uLightDir;
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uAtm;
      uniform float uFreq;
      uniform float uBandMix;
      uniform float uSeed;
      varying vec3 vNormal;
      varying vec3 vView;
      ${NOISE_GLSL}
      void main () {
        vec3 n = normalize(vNormal);
        float surf = fbm(n * uFreq + vec3(uSeed));
        float bands = 0.5 + 0.5 * sin(n.y * 7.0 + surf * 4.0);
        vec3 base = mix(uColorA, uColorB, mix(surf, bands, uBandMix));
        float diff = clamp(dot(n, uLightDir), 0.0, 1.0);
        vec3 col = base * (0.05 + diff);
        col += base * 0.3 * smoothstep(0.0, 0.4, diff);
        float fres = pow(1.0 - clamp(dot(n, vView), 0.0, 1.0), 3.0);
        col += uAtm * fres * (0.3 + 0.7 * diff);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const group = new THREE.Group();
  group.position.set(opts.position[0], opts.position[1], opts.position[2]);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.z = opts.tilt || 0;
  group.add(mesh);

  const ring = opts.ring ? buildRing(opts.ring) : null;
  if (ring) group.add(ring.object);

  return {
    object: group,
    update(dt: number) {
      mesh.rotation.y += dt * opts.spin;
      ring?.update(dt);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      ring?.dispose();
    },
  };
}
