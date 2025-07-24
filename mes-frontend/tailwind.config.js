/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 0.5s ease',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(.39,.575,.565,1)',
        'shake': 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        fadeInUp: {
          '0%': { opacity: 0, transform: 'translateY(20px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-1px)' },
          '20%, 80%': { transform: 'translateX(2px)' },
          '30%, 50%, 70%': { transform: 'translateX(-4px)' },
          '40%, 60%': { transform: 'translateX(4px)' }
        }
      },
      colors: {
        primary: '#1e90ff', // Brand blue
        secondary: '#ff9800', // Brand orange
        accent: '#10b981', // Brand green
        background: '#18181b', // App background
        surface: '#23232a', // Card/surface
        error: '#ef4444', // Error red
        info: '#3b82f6', // Info blue
        success: '#22c55e', // Success green
        warning: '#f59e42', // Warning orange
      },
    },
  },
  plugins: [require('tailwindcss-motion')],
}

