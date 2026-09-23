import type { Config } from 'tailwindcss';

// Organic design tokens. The source of truth is the :root block in
// app/globals.css; keep the two in sync.
const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5ead8',
        surface: '#ebddc5',
        ink: '#201e1d',
        sage: '#7a8a5e',
        /* Ink washes. color-mix rather than an opacity modifier so they
           match the design system's values exactly. */
        divider: 'color-mix(in srgb, #201e1d 16%, transparent)',
        hairline: 'color-mix(in srgb, #201e1d 8%, transparent)',
        tint: 'color-mix(in srgb, #201e1d 4%, transparent)',
        'tint-strong': 'color-mix(in srgb, #201e1d 7%, transparent)',
        neutral: {
          100: '#f9f4ed',
          200: '#eee7db',
          300: '#dcd3c4',
          400: '#c0b6a5',
          500: '#a19786',
          600: '#82796a',
          700: '#645c50',
          800: '#474238',
          900: '#2e2b25',
        },
        accent: {
          DEFAULT: '#c67139',
          100: '#fff2eb',
          200: '#ffe1d0',
          300: '#ffc6a5',
          400: '#f6a06b',
          500: '#d67f48',
          600: '#b2622d',
          700: '#8c491a',
          800: '#643312',
          900: '#402310',
        },
        'accent-2': {
          DEFAULT: '#7a8a5e',
          100: '#f0fae1',
          200: '#e1eecc',
          300: '#ccdbb2',
          400: '#aebf92',
          500: '#8fa073',
          600: '#728157',
          700: '#56633f',
          800: '#3d472b',
          900: '#272e1b',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '28px',
        /* lg × 1.15: the design system softens cards past the panel radius. */
        card: '32.2px',
        pill: '999px',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
