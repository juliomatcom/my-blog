'use client';

import { useEffect, useState } from 'react';

// Minimal + inlined so the black screen paints on the very first frame even if
// the stylesheet is a beat behind. The comet itself is styled in globals.css
// (render-blocking, so it's there by first paint) and shared with the nav veil.
//
// The dismiss is a CSS animation, not a JS toggle: it clears itself after ~2.3s
// even if the JS bundle is slow, errors, or never runs -- so a reader who deep
// links to a post (or a crawler) is never stuck staring at black over content
// that is already in the HTML. `.is-done` just lets JS clear it sooner.
const CSS = `
#preloader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  overflow: hidden;
  animation: preloader-dismiss 0.5s ease 1.8s forwards;
}
#preloader.is-done {
  animation: preloader-dismiss 0.5s ease forwards;
}
@keyframes preloader-dismiss {
  to { opacity: 0; visibility: hidden; pointer-events: none; }
}
@media (prefers-reduced-motion: reduce) {
  #preloader,
  #preloader.is-done { animation-duration: 0.01s; }
}
`;

const MIN_SHOW_MS = 400;
const MAX_WAIT_MS = 2000;
const REMOVE_MS = 550;

export default function Preloader() {
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const start = performance.now();

    const finish = () => {
      const wait = Math.max(0, MIN_SHOW_MS - (performance.now() - start));
      window.setTimeout(() => setDone(true), wait);
    };

    window.addEventListener('space-ready', finish, { once: true });
    const cap = window.setTimeout(finish, MAX_WAIT_MS);

    return () => {
      window.removeEventListener('space-ready', finish);
      window.clearTimeout(cap);
    };
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = window.setTimeout(() => setGone(true), REMOVE_MS);
    return () => window.clearTimeout(t);
  }, [done]);

  if (gone) return null;

  return (
    <>
      <style>{CSS}</style>
      <div id="preloader" className={done ? 'is-done' : undefined} aria-hidden="true">
        <span className="comet" />
      </div>
      <noscript>
        <style>{`#preloader { display: none; }`}</style>
      </noscript>
    </>
  );
}
