/* Spaceship-window space background -- framework-agnostic Three.js scene.
 *
 * A deep cloud of real 3D star particles streaming past a fixed camera, plus
 * procedurally-shaded alien planets, a spiral galaxy, a lenticular galaxy, a
 * nebula and a black hole. Pointer movement (or device tilt) slides and turns
 * the camera a few degrees with eased inertia, so near stars sweep across the
 * view while far ones barely move -- the parallax of looking through a moving
 * ship's window.
 *
 * `initSpaceScene(canvas)` wires everything up and returns a cleanup function.
 * The React side (components/SpaceBackground.tsx) only owns the <canvas>.
 *
 * Ported from the original public/space.js.
 */
import * as THREE from 'three';

const CONFIG = {
  starCount: 7500,
  near: 10, // nearest star distance
  depth: 260, // furthest star distance
  margin: 1.4, // spawn spread beyond the frustum edges
  drift: 7, // star travel speed toward the camera (units/sec)
  fov: 60,
  camShift: 1.1, // camera lateral travel per unit of pointer offset
  lookShift: 12, // look-target travel per unit of pointer offset (turn parallax)
  ease: 5, // pointer follow rate
  idleReturn: 0.5, // drift back to centre when the pointer is still
  idleAfter: 2.0, // seconds of stillness before drift-back
  maxDpr: 2,
};

// --- GLSL: value noise, shared by the planet / disk shaders ---------------

const NOISE_GLSL = `
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

// --- Star field ----------------------------------------------------------

function buildStarField() {
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

// --- Planets ------------------------------------------------------------

interface PlanetOpts {
  radius: number;
  position: [number, number, number];
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

function buildPlanet(opts: PlanetOpts) {
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

  let ring: ReturnType<typeof buildRing> | null = null;
  if (opts.ring) {
    ring = buildRing(opts.ring);
    group.add(ring.object);
  }

  return {
    object: group,
    update(dt: number) {
      mesh.rotation.y += dt * opts.spin;
      if (ring) ring.update(dt);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      ring?.dispose();
    },
  };
}

// --- Planet rings ------------------------------------------------------

interface RingOpts {
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

// --- Point-cloud material shared by the galaxies -----------------------

function buildGalaxyPointsMaterial(pointSize: number) {
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

// --- Distant spiral galaxy -------------------------------------------

interface GalaxyOpts {
  position: [number, number, number];
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

function buildGalaxy(opts: GalaxyOpts) {
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

// --- Lenticular (S0) galaxy -----------------------------------------
// Big smooth central bulge fading into a thin lens-shaped disk, no arms,
// older warm stars -- so: strongly core-concentrated points, thick at the
// centre and thin at the rim, on a near-edge-on tilt.

interface LenticularOpts {
  position: [number, number, number];
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

function buildLenticular(opts: LenticularOpts) {
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

// --- Nebula / star cluster ------------------------------------------

interface NebulaClump {
  color: string;
  offset: [number, number, number];
  scale: [number, number, number];
  spread: number;
  weight: number;
}

interface NebulaOpts {
  position: [number, number, number];
  radius: number;
  gasCount: number;
  starCount: number;
  spin: number;
  tilt?: number;
  pointSize?: number;
  clumps: NebulaClump[];
}

function buildNebula(opts: NebulaOpts) {
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

// --- Black hole (near face-on, NASA-visualisation style) ------------
// Looking almost straight down the spin axis: a round black shadow, a thin
// blazing photon ring hugging it, and the accretion disk seen from above as
// a broad annulus of swirling warm gas that fades outward. Plus a soft bloom.

interface BlackHoleOpts {
  position: [number, number, number];
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

const RING_VERT = `
  varying vec2 vLocal;
  void main () {
    vLocal = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

function buildBlackHole(opts: BlackHoleOpts) {
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
    update(time: number) {
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

// --- Input: pointer / device tilt -> eased offset [-1, 1] ----------------

function createInput() {
  const target = { x: 0, y: 0 };
  const view = { x: 0, y: 0 };
  let lastInput = 0;

  const onPointer = (e: PointerEvent) => {
    target.x = (e.clientX / window.innerWidth) * 2 - 1;
    target.y = (e.clientY / window.innerHeight) * 2 - 1;
    lastInput = performance.now() / 1000;
  };
  const onTilt = (e: DeviceOrientationEvent) => {
    if (e.gamma == null) return;
    target.x = Math.max(-1, Math.min(1, e.gamma / 35));
    target.y = Math.max(-1, Math.min(1, ((e.beta || 0) - 45) / 35));
    lastInput = performance.now() / 1000;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('deviceorientation', onTilt, { passive: true });

  return {
    view,
    update(dt: number, now: number) {
      if (now - lastInput > CONFIG.idleAfter) {
        const back = Math.min(1, CONFIG.idleReturn * dt);
        target.x -= target.x * back;
        target.y -= target.y * back;
      }
      const a = 1 - Math.exp(-CONFIG.ease * dt);
      view.x += (target.x - view.x) * a;
      view.y += (target.y - view.y) * a;
    },
    dispose() {
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('deviceorientation', onTilt);
    },
  };
}

// --- Scene entry point ------------------------------------------------

/**
 * Build the WebGL scene onto `canvas` and start its render loop.
 * Returns a cleanup function that stops the loop and frees GPU resources.
 * On a machine without WebGL it no-ops (the CSS `.starry` fallback stays).
 */
export function initSpaceScene(canvas: HTMLCanvasElement): () => void {
  const readingMode = !!document.getElementById('blog');

  // Blog posts are for reading -- keep the field sparse and calm so a long
  // scroll over the moving background doesn't get distracting.
  if (readingMode) {
    CONFIG.starCount = 2600;
    CONFIG.drift = 2.5;
    CONFIG.camShift = 0.7;
    CONFIG.lookShift = 7;
  } else {
    CONFIG.starCount = 7500;
    CONFIG.drift = 7;
    CONFIG.camShift = 1.1;
    CONFIG.lookShift = 12;
  }

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
  } catch {
    return () => {}; // no WebGL: keep the CSS `.starry` fallback
  }
  document.body.classList.add('space-active');

  const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, CONFIG.depth + 120);

  const stars = buildStarField();
  stars.setPixelRatio(dpr);
  scene.add(stars.object);

  const planets = [
    buildPlanet({
      radius: 11,
      position: [64, 28, -145],
      seed: 8.0,
      freq: 2.4,
      bandMix: 0.55,
      spin: 0.03,
      tilt: 0.15,
      colorA: '#3a2016',
      colorB: '#c9743a',
      atmosphere: '#ff8a4a',
      ring: {
        inner: 13.5,
        outer: 30,
        opacity: 0.6,
        color: '#f0b784',
        tilt: 0.42,
        yaw: 0.3,
        spin: 0.016,
        seed: 2.0,
        rings: [
          { pos: 0.08, width: 0.09, strength: 1.0 },
          { pos: 0.34, width: 0.1, strength: 0.62 },
          { pos: 0.58, width: 0.08, strength: 0.36 },
          { pos: 0.82, width: 0.07, strength: 0.16 },
        ],
      },
    }),
    buildPlanet({
      radius: 18,
      position: [-125, -50, -205],
      seed: 21.0,
      freq: 2.8,
      bandMix: 0.15,
      spin: 0.018,
      tilt: -0.3,
      colorA: '#16323d',
      colorB: '#4fbfc9',
      atmosphere: '#6cc8ff',
      ring: {
        inner: 19,
        outer: 37,
        opacity: 0.3,
        color: '#a9def5',
        tilt: -0.55,
        yaw: -0.2,
        spin: 0.008,
        seed: 5.0,
        rings: [
          { pos: 0.2, width: 0.13, strength: 0.9 },
          { pos: 0.58, width: 0.07, strength: 0.22 },
        ],
      },
    }),
  ];
  planets.forEach((p) => scene.add(p.object));

  const galaxy = buildGalaxy({
    position: [-88, 50, -150],
    radius: 26,
    arms: 2,
    count: 2800,
    twist: 0.9,
    randomness: 0.22,
    spin: 0.05,
    tiltX: 1.15,
    tiltZ: -0.55,
    coreColor: '#ffe7c4',
    armColor: '#7ba7ff',
    brightness: readingMode ? 0.72 : 1,
  });
  galaxy.setPixelRatio(dpr);
  scene.add(galaxy.object);

  // lenticular galaxy low in the frame -- half the black hole's span, and
  // dimmer, so a post scrolling over it stays readable
  const lenticular = buildLenticular({
    position: [6, -55, -150],
    radius: 14,
    count: 2600,
    spin: 0.04,
    tiltX: 1.24,
    tiltZ: -0.38,
    coreColor: '#ffe7cb',
    edgeColor: '#aebbdd',
    pointSize: 260,
    brightness: readingMode ? 0.68 : 1,
  });
  lenticular.setPixelRatio(dpr);
  scene.add(lenticular.object);

  const nebula = buildNebula({
    position: [-104, 15, -150],
    radius: 19,
    gasCount: 6000,
    starCount: 75,
    spin: 0.004,
    tilt: 0.4,
    clumps: [
      { color: '#ff5f7a', offset: [4, -2, 0], scale: [1.0, 0.75, 0.7], spread: 0.9, weight: 0.34 },
      { color: '#8a63d8', offset: [-6, 4, -3], scale: [1.1, 0.9, 0.7], spread: 1.1, weight: 0.24 },
      { color: '#4f8fe6', offset: [-16, 9, 2], scale: [1.2, 0.8, 0.6], spread: 1.2, weight: 0.22 },
      { color: '#37c2ac', offset: [12, -10, 3], scale: [0.8, 0.8, 0.6], spread: 0.8, weight: 0.12 },
      { color: '#f0c885', offset: [2, 1, 1], scale: [0.5, 0.45, 0.4], spread: 0.5, weight: 0.08 },
    ],
  });
  nebula.setPixelRatio(dpr);
  scene.add(nebula.object);

  // black hole down in the bottom-right (swapped with the spiral galaxy)
  const blackHole = buildBlackHole({
    position: [90, -54, -172],
    radius: 5,
    diskOuter: 15,
    intensity: readingMode ? 0.56 : 0.95,
    roll: -0.1,
    tilt: 0.32,
  });
  scene.add(blackHole.object);

  const input = createInput();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let running = false;
  let last = 0;
  let rafId = 0;

  function frame(now: number) {
    if (!running) return;
    const t = now / 1000;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    input.update(dt, t);
    camera.position.x = input.view.x * CONFIG.camShift;
    camera.position.y = -input.view.y * CONFIG.camShift;
    camera.lookAt(input.view.x * CONFIG.lookShift, -input.view.y * CONFIG.lookShift, -100);

    stars.update(dt, t);
    planets.forEach((p) => p.update(dt));
    galaxy.update(dt);
    lenticular.update(dt);
    nebula.update(dt);
    blackHole.update(t);
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    rafId = window.requestAnimationFrame(frame);
  }

  const onVisibility = () => {
    if (document.hidden) running = false;
    else start();
  };
  document.addEventListener('visibilitychange', onVisibility);
  start();

  return () => {
    running = false;
    window.cancelAnimationFrame(rafId);
    window.removeEventListener('resize', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    input.dispose();
    stars.dispose();
    planets.forEach((p) => p.dispose());
    galaxy.dispose();
    lenticular.dispose();
    nebula.dispose();
    blackHole.dispose();
    renderer.dispose();
    document.body.classList.remove('space-active');
  };
}
