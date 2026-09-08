import * as THREE from 'three';
import type { SceneBody } from '../types';

export interface MeteorFieldOpts {
  count: number;
  /** travel toward the camera (units/sec) */
  speed: number;
  brightness: number;
  /** rock scale range [min, max] */
  scale: [number, number];
  /** icosahedron subdivision (higher = rounder, pricier) */
  detail?: number;
}

/**
 * A few irregular rocks drifting toward the camera along the star-stream axis.
 * Kept sparse, small, and biased out toward the frame edges so text over the
 * background stays readable. Each rock is a unique lumpy icosphere; they respawn
 * at the back once they pass the camera.
 */
export function buildMeteorField(opts: MeteorFieldOpts): SceneBody {
  const BACK = 220; // spawn depth
  const NEAR = 6; // respawn once it has drifted past the camera
  // rough half-extent of the view at the distance where a rock frames well;
  // x/y offsets are anchored to this so every rock actually crosses the cone
  const FRAME_W = 52;
  const FRAME_H = 34;
  const rng = (a: number, b: number) => a + Math.random() * (b - a);
  const randDir = () => {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    return new THREE.Vector3(s * Math.cos(t), s * Math.sin(t), u);
  };

  // an irregular rock: a finely-subdivided sphere displaced by a few broad
  // lumps for the overall lopsided form plus many small ones for surface
  // relief -- rounded, never faceted, and no two alike
  const makeRock = () => {
    const geo = new THREE.IcosahedronGeometry(1, opts.detail ?? 5); // rounded silhouette
    const broad = Array.from({ length: 5 }, () => ({
      dir: randDir(),
      amp: rng(-0.26, 0.28),
      sharp: rng(1.0, 1.8),
    }));
    const fine = Array.from({ length: 16 }, () => ({
      dir: randDir(),
      amp: rng(-0.09, 0.1),
      sharp: rng(3.0, 7.0),
    }));
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).normalize();
      let d = 1;
      for (const l of broad) d += l.amp * Math.pow(Math.max(0, v.dot(l.dir)), l.sharp);
      for (const l of fine) d += l.amp * Math.pow(Math.max(0, v.dot(l.dir)), l.sharp);
      v.multiplyScalar(Math.max(0.5, d));
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  };

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uLightDir: { value: new THREE.Vector3(-0.55, 0.4, 0.6).normalize() },
      uColor: { value: new THREE.Color('#7c7062') },
      uRim: { value: new THREE.Color('#465878') },
      uBright: { value: opts.brightness },
    },
    vertexShader: `
      varying vec3 vN;
      varying vec3 vView;
      void main () {
        vN = normalize(mat3(modelMatrix) * normal);
        vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
        vView = normalize(cameraPosition - wp);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uLightDir;
      uniform vec3 uColor;
      uniform vec3 uRim;
      uniform float uBright;
      varying vec3 vN;
      varying vec3 vView;
      void main () {
        vec3 n = normalize(vN);
        float diff = clamp(dot(n, uLightDir), 0.0, 1.0);
        vec3 col = uColor * (0.16 + 0.9 * diff) * uBright;
        float fres = pow(1.0 - clamp(dot(n, vView), 0.0, 1.0), 2.2);
        col += uRim * fres * 0.8; // cool rim so the silhouette reads on black
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  interface Rock {
    mesh: THREE.Mesh;
    spin: THREE.Vector3;
    speed: number;
  }
  const group = new THREE.Group();
  const rocks: Rock[] = [];

  const respawn = (r: Rock, first: boolean) => {
    const m = r.mesh;
    // first batch starts already near the visible band so rocks show up fast
    m.position.z = first ? rng(-140, -35) : rng(-BACK, -BACK * 0.78);
    // offsets anchored to the view frame (not to spawn depth): off-centre so the
    // reading column stays clear, but close enough that the rock crosses the cone
    m.position.x = (Math.random() < 0.5 ? -1 : 1) * rng(0.3, 0.95) * FRAME_W;
    m.position.y = (Math.random() < 0.5 ? -1 : 1) * rng(0.14, 0.78) * FRAME_H;
    m.scale.setScalar(rng(opts.scale[0], opts.scale[1]));
    m.rotation.set(Math.random() * 6.28, Math.random() * 6.28, Math.random() * 6.28);
    r.spin.copy(randDir()).multiplyScalar(rng(0.05, 0.45));
    r.speed = opts.speed * rng(0.85, 1.6);
  };

  for (let i = 0; i < opts.count; i++) {
    const mesh = new THREE.Mesh(makeRock(), material);
    mesh.frustumCulled = false;
    const rock: Rock = { mesh, spin: new THREE.Vector3(), speed: 0 };
    respawn(rock, true);
    rocks.push(rock);
    group.add(mesh);
  }

  return {
    object: group,
    update(dt: number) {
      for (const r of rocks) {
        const p = r.mesh.position;
        p.z += r.speed * dt;
        r.mesh.rotation.x += r.spin.x * dt;
        r.mesh.rotation.y += r.spin.y * dt;
        r.mesh.rotation.z += r.spin.z * dt;
        if (p.z > NEAR) respawn(r, false);
      }
    },
    dispose() {
      for (const r of rocks) r.mesh.geometry.dispose();
      material.dispose();
    },
  };
}
