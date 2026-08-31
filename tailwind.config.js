/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Medicore Clinic — Healthcare Green Theme
        green: {
          50:  '#f0f9f4',
          100: '#dcf0e4',
          200: '#b7e4c7',
          300: '#95d5b2',
          400: '#74c69d',
          500: '#52b788',
          600: '#40916c',
          700: '#2d6a4f',
          800: '#1b4332',
          900: '#0d3d2a',
          950: '#051f15',
        },
        brand: {
          primary: '#2d6a4f',
          hover: '#1b4332',
          light: '#d8f3dc',
        },
        status: {
          success: { light: '#2d6a4f', dark: '#6ee7b7' },
          warning: { light: '#e9c46a', dark: '#fcd34d' },
          danger:  { light: '#e76f51', dark: '#fca5a5' },
          info:    { light: '#48cae4', dark: '#93c5fd' },
        },
      },
      fontFamily: {
        // DM Sans — clean, professional, modern
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 5vw, 3.5rem)', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-lg': ['clamp(2rem, 4vw, 2.75rem)', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['clamp(1.5rem, 3vw, 2rem)', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'display-sm': ['clamp(1.25rem, 2.5vw, 1.5rem)', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-lg':  ['1.25rem', { lineHeight: '1.3', fontWeight: '600' }],
        'heading-md':  ['1.125rem', { lineHeight: '1.35', fontWeight: '600' }],
        'heading-sm':  ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg':     ['1rem', { lineHeight: '1.6' }],
        'body':        ['0.875rem', { lineHeight: '1.55' }],
        'body-sm':     ['0.8125rem', { lineHeight: '1.5' }],
        'caption':     ['0.75rem', { lineHeight: '1.4' }],
        'tiny':        ['0.6875rem', { lineHeight: '1.35' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(13, 61, 42, 0.08), 0 1px 3px -1px rgba(13, 61, 42, 0.04)',
        'soft-md': '0 4px 16px -4px rgba(13, 61, 42, 0.1), 0 2px 6px -2px rgba(13, 61, 42, 0.06)',
        'soft-lg': '0 12px 32px -8px rgba(13, 61, 42, 0.12), 0 4px 12px -4px rgba(13, 61, 42, 0.06)',
        'soft-xl': '0 20px 48px -12px rgba(13, 61, 42, 0.18), 0 8px 16px -8px rgba(13, 61, 42, 0.08)',
        glass: '0 8px 32px -8px rgba(13, 61, 42, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
        glow: '0 0 20px -5px rgba(45, 106, 79, 0.3)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
