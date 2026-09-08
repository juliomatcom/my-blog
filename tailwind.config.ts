import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  // The site ships its own complete stylesheet (globals.css, ported from the
  // original main.css). Tailwind is available for new markup, but its Preflight
  // reset would clobber the existing element styling (list bullets, heading
  // sizes, image centering), so it stays off.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
