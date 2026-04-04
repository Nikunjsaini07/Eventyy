/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          light: '#F8F6F0',
          dark:  '#0A0A0A',
        },
        surface: {
          light: '#FFFFFF',
          dark:  '#141414',
        },
        'surface-muted': {
          light: '#F0EDE5',
          dark:  '#1C1C1C',
        },
        border: {
          light: '#0A0A0A',
          dark:  '#2A2A2A',
        },
        'border-strong': {
          light: '#0A0A0A',
          dark:  '#FFFFFF',
        },
        primary: {
          DEFAULT: '#F2C200',
          light: '#FFD740',
          dark: '#C49A00',
        },
        secondary: {
          DEFAULT: '#0A0A0A',
          dark: '#F2C200', // Yellow becomes secondary in dark mode
        },
        text: {
          light: '#0A0A0A',
          dark:  '#F8F6F0',
          muted: {
            light: '#5C5852',
            dark:  '#A0A0A0',
          },
          dim: {
            light: '#9A9690',
            dark:  '#666666',
          }
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        heading: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace'],
      },
      boxShadow: {
        'comic':    '4px 4px 0px #0A0A0A',
        'comic-dark': '4px 4px 0px #F2C200',
        'comic-lg': '6px 6px 0px #0A0A0A',
        'comic-lg-dark': '6px 6px 0px #F2C200',
        'comic-xl': '8px 8px 0px #0A0A0A',
        'comic-xl-dark': '8px 8px 0px #F2C200',
        'comic-sm': '2px 2px 0px #0A0A0A',
        'comic-sm-dark': '2px 2px 0px #F2C200',
        'comic-yellow': '4px 4px 0px #F2C200',
      },
      animation: {
        'fade-in':    'fade-in 0.35s ease-out',
        'wiggle':     'wiggle 0.4s ease-in-out',
        'pop-in':     'pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'float':      'float 3.5s ease-in-out infinite',
        'float-alt':  'float-alt 4s ease-in-out infinite',
        'marquee':    'marquee 22s linear infinite',
        'blink':      'blink 0.9s step-end infinite',
        'slide-up':   'slide-up 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in':    { from: { opacity: '0' }, to: { opacity: '1' } },
        'wiggle':     { '0%,100%': { transform: 'rotate(0deg)' }, '25%': { transform: 'rotate(-4deg)' }, '75%': { transform: 'rotate(4deg)' } },
        'pop-in':     { '0%': { transform: 'scale(0.75)', opacity: '0' }, '70%': { transform: 'scale(1.04)' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        'float':      { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-10px)' } },
        'float-alt':  { '0%,100%': { transform: 'translateY(0px) rotate(1.5deg)' }, '50%': { transform: 'translateY(-15px) rotate(-1deg)' } },
        'marquee':    { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'blink':      { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        'slide-up':   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-glow': { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
      },
    },
  },
  plugins: [],
}
