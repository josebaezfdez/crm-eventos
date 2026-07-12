/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Acento principal: Teal (basado en #4ecdc4)
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#4ecdc4', // Color base pub-malatesta
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
        // Acento cálido: Naranja (basado en #fca311)
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#fca311', // Color base pub-malatesta
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        pink: '#ff6b6b', // Rosa pub-malatesta
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        accent: ['Creepster', 'cursive'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.05)',
        cardHover: '0 10px 30px -12px rgb(8 145 178 / 0.18), 0 4px 10px -4px rgb(15 23 42 / 0.06)',
        glow: '0 0 0 1px rgb(8 145 178 / 0.08), 0 8px 24px -8px rgb(6 182 212 / 0.35)',
        soft: '0 1px 0 0 rgb(255 255 255 / 0.6) inset, 0 1px 2px 0 rgb(15 23 42 / 0.06)',
      },
      backgroundImage: {
        'grid-light':
          'linear-gradient(to right, rgb(15 23 42 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgb(15 23 42 / 0.04) 1px, transparent 1px)',
        'dot-light':
          'radial-gradient(rgb(15 23 42 / 0.06) 1px, transparent 1px)',
      },
      backgroundSize: {
        grid: '32px 32px',
        dot: '18px 18px',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease-out both',
        'slide-in-left': 'slide-in-left 0.3s ease-out both',
      },
    },
  },
  plugins: [],
}
