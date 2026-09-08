'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'zen';

/**
 * Floating top-right toggle that hides every bit of page chrome (nav, content,
 * feeds, footer) so the space background can be watched on its own. Click again
 * to bring the page back. The choice is remembered per browser.
 */
export default function ZenToggle() {
  const [zen, setZen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') setZen(true);
    } catch {
      /* private mode / storage blocked — start with the page visible */
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('zen', zen);
    try {
      localStorage.setItem(STORAGE_KEY, zen ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [zen]);

  return (
    <button
      type="button"
      className="zen-toggle"
      aria-pressed={zen}
      aria-label={zen ? 'Show page content' : 'Hide page content and watch space'}
      title={zen ? 'Show content' : 'Hide content'}
      onClick={() => setZen((v) => !v)}
    >
      {zen ? <EyeOpen /> : <EyeClosed />}
    </button>
  );
}

const svgProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function EyeOpen() {
  return (
    <svg {...svgProps}>
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeClosed() {
  return (
    <svg {...svgProps}>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
