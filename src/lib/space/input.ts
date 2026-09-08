import { CONFIG } from './config';

/**
 * Pointer / device-tilt -> an eased offset in [-1, 1] on each axis. The scene
 * reads `view` every frame; after `CONFIG.idleAfter` seconds of stillness the
 * target drifts back to centre.
 */
export function createInput() {
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
