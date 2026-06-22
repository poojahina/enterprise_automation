/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'surface-900': 'hsl(220, 25%, 8%)',
        'surface-800': 'hsl(220, 25%, 12%)',
        'surface-700': 'hsl(220, 20%, 18%)',
        'surface-600': 'hsl(220, 15%, 25%)',
        'surface-500': 'hsl(220, 12%, 35%)',
        primary: 'hsl(210, 100%, 55%)',
        'primary-light': 'hsl(210, 100%, 70%)',
        'primary-dark': 'hsl(210, 100%, 40%)',
        secondary: 'hsl(340, 80%, 60%)',
        'secondary-light': 'hsl(340, 80%, 75%)',
        accent: 'hsl(160, 70%, 50%)',
        'accent-light': 'hsl(160, 70%, 65%)',
        warning: 'hsl(40, 95%, 55%)',
        'warning-light': 'hsl(40, 95%, 70%)',
        danger: 'hsl(0, 75%, 55%)',
        'danger-light': 'hsl(0, 75%, 70%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 4px 30px rgba(0, 0, 0, 0.15)',
        'glass-lg': '0 8px 40px rgba(0, 0, 0, 0.25)',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-accent': '0 0 20px rgba(52, 211, 153, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-right': 'slideRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(59, 130, 246, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' },
        },
      },
    },
  },
  plugins: [],
};
