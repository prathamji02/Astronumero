/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070A12',
          900: '#0B0F19',
          800: '#111827',
          700: '#1E293B',
          600: '#334155',
        },
        emerald: {
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
    },
  },
  plugins: [],
};
