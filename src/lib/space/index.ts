/* Spaceship-window space background -- framework-agnostic Three.js scene.
 *
 * A deep cloud of real 3D star particles streaming past a fixed camera, plus
 * procedurally-shaded alien planets, a spiral galaxy, a lenticular galaxy, two
 * nebulae and a black hole. Pointer movement (or device tilt) slides and turns
 * the camera a few degrees with eased inertia, so near stars sweep across the
 * view while far ones barely move -- the parallax of looking through a moving
 * ship's window.
 *
 * Each celestial body lives in its own file under `bodies/` and implements the
 * `SceneBody` contract (see `types.ts`). This orchestrator only composes them:
 * pick positions and colours, sort them into depth layers, drive the frame loop.
 * The React side (components/SpaceBackground.tsx) only owns the <canvas>.
 *
 * Ported from the original public/space.js.
 */
import * as THREE from 'three';
import { CONFIG } from './config';
import { createInput } from './input';
import type { SceneBody } from './types';
import { buildStarField } from './bodies/star-field';
import { buildPlanet } from './bodies/planet';
import { buildGalaxy } from './bodies/galaxy';
import { buildLenticular } from './bodies/lenticular';
import { buildNebula } from './bodies/nebula';
import { buildBlackHole } from './bodies/black-hole';
import { buildMeteorField } from './bodies/meteor-field';

/**
 * Build the WebGL scene onto `canvas` and start its render loop.
 * Returns a cleanup function that stops the loop and frees GPU resources.
 * On a machine without WebGL it no-ops (the CSS `.starry` fallback stays).
 */
export function initSpaceScene(canvas: HTMLCanvasElement): () => void {
  // `#blog` marks a rendered post. Its presence is re-checked every frame (the
  // scene mounts once and outlives client-side navigation), so `atPost()` also
  // tracks moving between the home page and a post without a reload.
  const atPost = () => !!document.getElementById('blog');
  const readingMode = atPost();

  // Blog posts are for reading -- keep the field sparse and calm so a long
  // scroll over the moving background doesn't get distracting. Star density is
  // fixed here at build time; the pointer parallax is toggled live in the frame
  // loop so it fades out on a post and back in on the home page.
  if (readingMode) {
    CONFIG.starCount = 2600;
    CONFIG.drift = 0.1;
  } else {
    CONFIG.starCount = 7500;
    CONFIG.drift = 0.2;
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

  const camera = new THREE.PerspectiveCamera(CONFIG.fov, 1, 0.1, CONFIG.depth + 120);

  // Three depth-independent layers, composited back-to-front each frame so that
  // a distant galaxy never punches through a nearer planet regardless of its z.
  const layers = buildLayers(readingMode);
  for (const layer of layers) {
    for (const body of layer.bodies) body.setPixelRatio?.(dpr);
  }
  const allBodies = layers.flatMap((l) => l.bodies);

  const input = createInput();
  // 1 on the home page, eased to 0 on a post -- scales the whole pointer parallax.
  let parallax = readingMode ? 0 : 1;

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

    // In a blog post the cursor is for reading -- selecting text, chasing a link --
    // so swinging the whole window along with it is distracting. Ease the parallax
    // out to nothing on a post (camera locked forward) and back in on the home page.
    parallax += ((atPost() ? 0 : 1) - parallax) * (1 - Math.exp(-4 * dt));
    input.update(dt, t);
    camera.position.x = input.view.x * CONFIG.camShift * parallax;
    camera.position.y = -input.view.y * CONFIG.camShift * parallax;
    camera.lookAt(
      input.view.x * CONFIG.lookShift * parallax,
      -input.view.y * CONFIG.lookShift * parallax,
      -100,
    );

    for (const body of allBodies) body.update(dt, t);

    renderer.autoClear = false;
    renderer.clear();
    layers.forEach((layer, i) => {
      if (i > 0) renderer.clearDepth();
      renderer.render(layer.scene, camera);
    });
    renderer.autoClear = true;
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
    for (const body of allBodies) body.dispose();
    renderer.dispose();
    document.body.classList.remove('space-active');
  };
}

interface Layer {
  scene: THREE.Scene;
  bodies: SceneBody[];
}

/** Populate the three render layers, back-to-front. Each body is dropped into
 *  its layer's scene here; the caller drives update / dispose over all of them. */
function buildLayers(readingMode: boolean): Layer[] {
  // deep background: stars, galaxies, nebulae
  const far: SceneBody[] = [
    buildStarField(),
    buildGalaxy({
      position: [-88, 50, -150],
      radius: 26,
      arms: 2,
      count: 2800,
      twist: 0.9,
      randomness: 0.22,
      spin: 0.015,
      tiltX: 1.15,
      tiltZ: -0.55,
      coreColor: '#ffe7c4',
      armColor: '#7ba7ff',
      brightness: readingMode ? 0.72 : 1,
    }),
    // lenticular galaxy low in the frame -- half the black hole's span, and
    // dimmer, so a post scrolling over it stays readable
    buildLenticular({
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
    }),
    buildNebula({
      position: [-82, 4, -150],
      radius: 19,
      gasCount: 6000,
      starCount: 75,
      spin: 0.004,
      tilt: 0.4,
      clumps: [
        {
          color: '#ff5f7a',
          offset: [4, -2, 0],
          scale: [1.0, 0.75, 0.7],
          spread: 0.9,
          weight: 0.34,
        },
        {
          color: '#8a63d8',
          offset: [-6, 4, -3],
          scale: [1.1, 0.9, 0.7],
          spread: 1.1,
          weight: 0.24,
        },
        {
          color: '#4f8fe6',
          offset: [-16, 9, 2],
          scale: [1.2, 0.8, 0.6],
          spread: 1.2,
          weight: 0.22,
        },
        {
          color: '#37c2ac',
          offset: [12, -10, 3],
          scale: [0.8, 0.8, 0.6],
          spread: 0.8,
          weight: 0.12,
        },
        { color: '#f0c885', offset: [2, 1, 1], scale: [0.5, 0.45, 0.4], spread: 0.5, weight: 0.08 },
      ],
    }),
    // small blue bubble nebula floating above the orange planet (64, 28, -145)
    buildNebula({
      position: [20, 34, -150],
      radius: 8,
      gasCount: 2600,
      starCount: 22,
      spin: 0.006,
      tilt: -0.25,
      pointSize: 260,
      clumps: [
        { color: '#3f7fe0', offset: [0, 0, 0], scale: [1.0, 0.95, 0.8], spread: 1.0, weight: 0.4 },
        { color: '#6ba8ff', offset: [-3, 2, 1], scale: [0.9, 0.8, 0.7], spread: 0.8, weight: 0.28 },
        { color: '#2a5fb0', offset: [3, -2, -1], scale: [0.8, 0.9, 0.7], spread: 0.9, weight: 0.2 },
        {
          color: '#a9d0ff',
          offset: [1, 3, 1],
          scale: [0.5, 0.45, 0.4],
          spread: 0.45,
          weight: 0.12,
        },
      ],
    }),
  ];

  // midground: planets and the black hole, always drawn over the background
  const mid: SceneBody[] = [
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
    // black hole down in the bottom-right (swapped with the spiral galaxy)
    buildBlackHole({
      position: [90, -54, -172],
      radius: 5,
      diskOuter: 15,
      intensity: readingMode ? 0.56 : 0.95,
      roll: -0.1,
      tilt: 0.32,
    }),
  ];

  // overlay: meteoroids, drawn over everything. Two classes -- a few big slow
  // rocks that read as landmarks, and a scattering of tiny fast ones streaking
  // past, which are what sell the sense of motion.
  const over: SceneBody[] = [
    buildMeteorField({
      count: readingMode ? 2 : 4,
      speed: readingMode ? 1 : 1.6,
      brightness: readingMode ? 0.7 : 1,
      scale: [0.7, 2.1],
    }),
    buildMeteorField({
      count: readingMode ? 4 : 8,
      speed: readingMode ? 5 : 8,
      brightness: readingMode ? 0.6 : 0.85,
      scale: [0.14, 0.44],
      detail: 3,
    }),
  ];

  return [far, mid, over].map((bodies) => {
    const scene = new THREE.Scene();
    for (const body of bodies) scene.add(body.object);
    return { scene, bodies };
  });
}
