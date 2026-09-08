'use client';

import { useEffect, useRef } from 'react';
import { initSpaceScene } from '@/lib/space';

/**
 * Mounts the animated WebGL space background. All of the Three.js work lives in
 * `@/lib/space`; this component only owns the <canvas> and its lifecycle.
 */
export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cleanup = initSpaceScene(canvas);
    // let the preloader know the first frame is up
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event('space-ready')));
    return () => {
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  return <canvas id="space" aria-hidden="true" ref={canvasRef} />;
}
