import * as THREE from 'three';

/** Value noise + fbm, shared by the planet, ring and black-hole disk shaders. */
export const NOISE_GLSL = `
  float hash13 (vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float vnoise (vec3 x) {
    vec3 i = floor(x); vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i), hash13(i + vec3(1,0,0)), f.x),
          mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), f.x),
          mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm (vec3 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { s += a * vnoise(p); p *= 2.03; a *= 0.5; }
    return s;
  }
`;

/** Additive round-sprite point cloud, shared by the spiral and lenticular galaxies. */
export function buildGalaxyPointsMaterial(pointSize: number) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uDpr: { value: 1 },
      uSize: { value: pointSize },
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
        gl_PointSize = clamp(uSize * aSize / max(1.0, -mv.z), 0.5, 9.0) * uDpr;
      }
    `,
    fragmentShader: `
      precision mediump float;
      varying vec3 vColor;
      void main () {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        a *= a;
        if (a < 0.004) discard;
        gl_FragColor = vec4(vColor, a);
      }
    `,
  });
}
