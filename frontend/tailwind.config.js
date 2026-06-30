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
        brand: {
          50: '#f0f6ff',
          100: '#e0efff',
          200: '#b8deff',
          300: '#7cc2ff',
          400: '#3aa0ff',
          500: '#0a7eff',
          600: '#005ed6',
          700: '#004aa6',
          800: '#003e8c',
          900: '#053470',
          950: '#03204a',
        },
        slate: {
          950: '#070a13', # Extra deep rich dark slate
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
