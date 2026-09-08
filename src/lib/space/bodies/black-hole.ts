import * as THREE from 'three';
import { NOISE_GLSL } from '../shaders';
import type { SceneBody, Vec3 } from '../types';

export interface BlackHoleOpts {
  position: Vec3;
  /** event-horizon (shadow) radius; every other feature scales from this */
  radius: number;
  /** outer edge of the accretion disk (world units) */
  diskOuter?: number;
  /** master brightness */
  intensity: number;
  /** slight roll of the whole system */
  roll?: number;
  /** how open the disk ellipse is (0 = perfectly face-on) */
  tilt?: number;
}

/** Flat "screen-space local coords" vertex shader shared by the bloom/disk/photon meshes. */
const RING_VERT = `
  varying vec2 vLocal;
  void main () {
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A near face-on black hole, NASA-visualisation style: a round black shadow, a
 * thin blazing photon ring hugging it, the accretion disk seen from above as a
 * broad annulus of sheared, differentially-rotating gas, and a soft warm bloom.
 */
export function buildBlackHole(opts: BlackHoleOpts): SceneBody {
  const rH = opts.radius;
  const diskInner = rH * 1.12;
  const diskOuter = opts.diskOuter ?? rH * 3.6;
  const group = new THREE.Group();
  group.position.set(opts.position[0], opts.position[1], opts.position[2]);
  group.rotation.z = opts.roll ?? 0;

  // soft outer bloom -> the whole system sits in a warm haze
  const bloomR = diskOuter * 1.3;
  const bloomGeo = new THREE.CircleGeometry(bloomR, 64);
  const bloomMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uRadius: { value: bloomR },
      uIntensity: { value: opts.intensity },
      uColor: { value: new THREE.Color('#ff8f47') },
    },
    vertexShader: RING_VERT,
    fragmentShader: `
      precision highp float;
      uniform float uRadius;
      uniform float uIntensity;
      uniform vec3 uColor;
      varying vec2 vLocal;
      void main () {
        float d = length(vLocal) / uRadius;
        float a = pow(1.0 - clamp(d, 0.0, 1.0), 2.8) * 0.16 * uIntensity;
        if (a < 0.002) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const bloom = new THREE.Mesh(bloomGeo, bloomMat);
  bloom.renderOrder = 0;
  group.add(bloom);

  // the shadow: an opaque black disc facing the camera
  const shadowGeo = new THREE.CircleGeometry(rH, 64);
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.renderOrder = 1;
  group.add(shadow);

  // accretion disk: face-on annulus of swirling gas, brightest at the inner rim
  const diskGeo = new THREE.RingGeometry(diskInner, diskOuter, 220, 1);
  const diskMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uInner: { value: diskInner },
      uOuter: { value: diskOuter },
      uIntensity: { value: opts.intensity },
      uHot: { value: new THREE.Color('#fff1dd') },
      uCool: { value: new THREE.Color('#dd5a18') },
    },
    vertexShader: RING_VERT,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uInner;
      uniform float uOuter;
      uniform float uIntensity;
      uniform vec3 uHot;
      uniform vec3 uCool;
      varying vec2 vLocal;
      ${NOISE_GLSL}
      void main () {
        float r = length(vLocal);
        float t = (r - uInner) / (uOuter - uInner);
        if (t < 0.0 || t > 1.0) discard;
        float ang = atan(vLocal.y, vLocal.x);
        // differential rotation: sheared spiral streaks, inner orbits faster
        float shear = ang + 1.0 / (t * 0.5 + 0.12) - uTime * (1.15 - 0.7 * t);
        float streak = fbm(vec3(cos(shear), sin(shear), t * 4.2) * 1.8);
        streak = 0.14 + 1.05 * streak;
        // radial: peak just outside the photon ring, long outward fade
        float radial = smoothstep(0.0, 0.06, t) * pow(1.0 - t, 1.3);
        float rim = pow(1.0 - t, 3.4); // white-hot inner lip
        // slight forward-beamed brightening on one side
        float doppler = 0.82 + 0.18 * cos(ang - 1.0);
        float a = (radial * streak + rim * 0.6) * doppler * uIntensity * 2.0;
        vec3 col = mix(uHot, uCool, pow(t, 0.62));
        col = mix(col, vec3(1.0, 0.95, 0.88), rim * 0.85);
        if (a < 0.002) discard;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const disk = new THREE.Mesh(diskGeo, diskMat);
  disk.rotation.x = opts.tilt ?? 0.2; // a touch of ellipse, still near face-on
  disk.renderOrder = 2;
  group.add(disk);

  // photon ring: thin, blazing, right at the shadow's edge
  const photonGeo = new THREE.RingGeometry(rH * 0.99, rH * 1.13, 180, 1);
  const photonMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uInner: { value: rH * 0.99 },
      uOuter: { value: rH * 1.13 },
      uIntensity: { value: opts.intensity },
      uColor: { value: new THREE.Color('#fff1de') },
    },
    vertexShader: RING_VERT,
    fragmentShader: `
      precision highp float;
      uniform float uTime;
      uniform float uInner;
      uniform float uOuter;
      uniform float uIntensity;
      uniform vec3 uColor;
      varying vec2 vLocal;
      void main () {
        float r = length(vLocal);
        float t = (r - uInner) / (uOuter - uInner);
        if (t < 0.0 || t > 1.0) discard;
        float band = pow(sin(t * 3.14159), 1.1); // brightest mid-band
        float ang = atan(vLocal.y, vLocal.x);
        float doppler = 0.84 + 0.16 * (0.5 + 0.5 * cos(ang - 1.0));
        float flick = 0.95 + 0.05 * sin(uTime * 2.5);
        float a = band * doppler * flick * uIntensity * 2.5;
        if (a < 0.003) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const photon = new THREE.Mesh(photonGeo, photonMat);
  photon.rotation.x = (opts.tilt ?? 0.2) * 0.4; // barely tilted -> stays round
  photon.renderOrder = 3;
  group.add(photon);

  return {
    object: group,
    update(_dt: number, time: number) {
      diskMat.uniforms.uTime.value = time;
      photonMat.uniforms.uTime.value = time;
    },
    dispose() {
      bloomGeo.dispose();
      bloomMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      diskGeo.dispose();
      diskMat.dispose();
      photonGeo.dispose();
      photonMat.dispose();
    },
  };
}
