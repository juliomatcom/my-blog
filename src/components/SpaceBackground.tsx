'use client';

import { useEffect, useRef, useState } from 'react';
import { initSpaceScene } from '@/lib/space';

/**
 * Mounts the animated WebGL space background. All of the Three.js work lives in
 * `@/lib/space`; this component owns the <canvas>, its lifecycle, and the small
 * FPS read-out that appears once the scene is running.
 */
export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // The meter throttles to ~3 Hz, so this setState runs a few times a second
    // and re-renders nothing but the tiny counter node.
    const cleanup = initSpaceScene(canvas, { onFps: setFps });
    // let the preloader know the first frame is up
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event('space-ready')));
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
      setFps(null);
    };
  }, []);

  // red below 20, yellow below 30, green at 30+
  const tier = fps === null ? null : fps < 20 ? 'low' : fps < 30 ? 'mid' : 'high';

  return (
    <>
      <canvas id="space" aria-hidden="true" ref={canvasRef} />
      {fps !== null && (
        <div id="fps" data-tier={tier} role="status" aria-live="off">
          {fps} <span>FPS</span>
        </div>
      )}
    </>
  );
}
