/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        syne: ['Syne', 'sans-serif'],
      },
      colors: {
        bg: {
          deep: '#0a0a0f',
          card: '#13111c',
          border: '#1e1b2e',
          muted: '#0d0b16',
        },
        accent: {
          DEFAULT: '#7c5cfc',
          hover: '#6a48f0',
          light: '#a08aff',
          dim: 'rgba(124,92,252,0.1)',
        },
        text: {
          primary: '#e8e6f0',
          secondary: '#c4bfda',
          muted: '#6b6880',
          faint: '#3d3a52',
        },
      },
      animation: {
        'check-pop': 'check-pop 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'fade-in': 'fade-in 0.3s ease',
        'slide-up': 'slide-up 0.3s ease',
      },
      keyframes: {
        'check-pop': {
          '0%': { transform: 'scale(0.8)' },
          '100%': { transform: 'scale(1.1)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
