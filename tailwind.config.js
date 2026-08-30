/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Tritama Estetika Konstruksi — palet soft, glassy, friendly
        // Bone (warm paper), Iron (soft graphite), Safety (warm coral), Cement (warm gray), Steel (soft blue)
        iron: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        bone: {
          50:  '#fdfcfa',  // background light utama — soft warm white
          100: '#f7f4ee',  // warm paper, background light default
          200: '#ece7dd',  // divider subtle
          300: '#d8d0c2',
          400: '#b9b1a0',
          500: '#988f7e',
        },
        safety: {
          50:  '#fff4ed',
          100: '#ffe6d5',
          200: '#ffc9a8',
          300: '#ffa372',
          400: '#ff7a47',
          500: '#f5612a',  // warm coral — aksen utama, lebih lembut dari orange safety
          600: '#e64a16',
          700: '#c13a0e',
          800: '#9a2f0c',
          900: '#7c2a0e',
        },
        cement: {
          100: '#f1efe9',
          200: '#e2dfd6',
          300: '#b8b3a8',
          400: '#8a857a',
          500: '#65615a',
        },
        steel: {
          400: '#7d9bbb',
          500: '#5b83a8',
          600: '#3f6991',  // soft blue steel — info/data
          700: '#2d5074',
          800: '#1f3d5c',
        },
        // Semantic status colors — pastel/soft
        status: {
          success: { light: '#2f9b6a', dark: '#6ee7b7' },
          warning: { light: '#c47a1a', dark: '#fcd34d' },
          danger:  { light: '#d65548', dark: '#fca5a5' },
          info:    { light: '#3f6991', dark: '#93c5fd' },
        },
      },
      fontFamily: {
        // Body: IBM Plex Sans — typeface engineering/technical (NASA, IBM industrial)
        // Heading: sama, dengan weight lebih berat — lebih solid, less playful
        // Mono: IBM Plex Mono untuk nomor SPB, kode material
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        // Skala tipografi utilitarian — tidak ada display yang terlalu besar
        'display-xl': ['clamp(2.25rem, 4.5vw, 3.25rem)', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-lg': ['clamp(1.75rem, 3.5vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'display-md': ['clamp(1.375rem, 2.5vw, 1.875rem)', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['clamp(1.125rem, 2vw, 1.5rem)', { lineHeight: '1.25', letterSpacing: '-0.005em', fontWeight: '600' }],
        'heading-lg':  ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-md':  ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-sm':  ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':     ['1rem', { lineHeight: '1.55' }],
        'body':        ['0.875rem', { lineHeight: '1.55' }],
        'body-sm':     ['0.8125rem', { lineHeight: '1.5' }],
        'caption':     ['0.75rem', { lineHeight: '1.4' }],
        'tiny':        ['0.6875rem', { lineHeight: '1.35' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      borderRadius: {
        // Soft, generous rounding — glassy/friendly
        'sm': '0.5rem',
        DEFAULT: '0.75rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        // Soft layered shadows — bukan plate offset yang kaku
        'soft': '0 2px 4px -1px rgb(15 23 42 / 0.04), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        'soft-md': '0 4px 8px -2px rgb(15 23 42 / 0.06), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        'soft-lg': '0 10px 24px -6px rgb(15 23 42 / 0.08), 0 4px 8px -4px rgb(15 23 42 / 0.05), 0 0 0 1px rgb(15 23 42 / 0.04)',
        'soft-xl': '0 20px 40px -12px rgb(15 23 42 / 0.18), 0 8px 16px -8px rgb(15 23 42 / 0.08), 0 0 0 1px rgb(15 23 42 / 0.04)',
        'glass': '0 8px 32px -8px rgb(15 23 42 / 0.10), inset 0 1px 0 0 rgb(255 255 255 / 0.6)',
        'pressed': 'inset 0 1px 2px 0 rgb(15 23 42 / 0.06)',
        'glow': '0 0 0 4px rgb(99 102 241 / 0.12)',
        'ring-soft': '0 0 0 1px rgb(15 23 42 / 0.06)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'mech': 'cubic-bezier(0.2, 0, 0, 1)',  // mekanik, cepat, tidak playful
      },
    },
  },
  plugins: [],
}
