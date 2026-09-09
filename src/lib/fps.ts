/*
 * Copyright (c) 2026 Julio Cesar Martin
 * SPDX-License-Identifier: MIT
 */

/* Ultra-light FPS meter for any requestAnimationFrame loop.
 *
 * Call `tick(now)` once per frame with the high-resolution timestamp that rAF
 * already hands you (or `performance.now()`). It keeps an exponential moving
 * average of the instantaneous frame rate -- smooth to read, but still quick to
 * follow a real dip -- and passes the rounded value to `onSample` only a few
 * times a second, so the DOM write (or React state set) never rides the frame.
 *
 * The hot path allocates nothing: no objects, no per-call closures, no array
 * churn. All state is a handful of numbers captured in the closure once. That
 * keeps the meter itself off the GC's radar, which is the whole point of
 * measuring frame rate in the first place.
 *
 * It knows nothing about this site or Three.js -- give it timestamps, it gives
 * you a number. Wrap any loop with it.
 */

export interface FpsMeterOptions {
  /**
   * EMA weight applied to each new sample, in (0, 1]. Lower is smoother and
   * slower to react; 1 disables smoothing. Default 0.1 (~a 10-frame memory).
   */
  smoothing?: number;
  /**
   * How often `onSample` fires, in Hz. Clamped to 1..10 -- 2..4 is the sweet
   * spot: readable, and far below the rate that would cause layout thrash.
   * Default 3.
   */
  sampleHz?: number;
  /** Receives the smoothed, rounded FPS. Safe place to touch the DOM. */
  onSample: (fps: number) => void;
}

export interface FpsMeter {
  /** Feed one frame. `now` is a `performance.now()`-style timestamp in ms. */
  tick(now: number): void;
  /** Drop the running average -- call after the loop was paused/backgrounded. */
  reset(): void;
}

const clamp = (n: number, lo: number, hi: number): number => (n < lo ? lo : n > hi ? hi : n);

export function createFpsMeter(options: FpsMeterOptions): FpsMeter {
  const smoothing = clamp(options.smoothing ?? 0.1, 0.001, 1);
  const sampleMs = 1000 / clamp(options.sampleHz ?? 3, 1, 10);
  const onSample = options.onSample;

  let prev = 0; // timestamp of the previous frame (0 = none yet)
  let ema = 0; // smoothed fps (0 = not warmed up)
  let lastSample = 0; // timestamp of the last onSample call

  function tick(now: number): void {
    if (prev === 0) {
      prev = lastSample = now;
      return;
    }
    const delta = now - prev;
    prev = now;

    // A backgrounded tab or a paused debugger produces a multi-second gap.
    // Skip it: one bogus 0.3fps sample would poison the average for seconds.
    if (delta <= 0 || delta > 1000) return;

    const instant = 1000 / delta;
    ema = ema === 0 ? instant : ema + (instant - ema) * smoothing;

    if (now - lastSample >= sampleMs) {
      lastSample = now;
      onSample(Math.round(ema));
    }
  }

  function reset(): void {
    prev = 0;
    ema = 0;
    lastSample = 0;
  }

  return { tick, reset };
}
