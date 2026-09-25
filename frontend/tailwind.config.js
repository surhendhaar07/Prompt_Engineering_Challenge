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
        xentrix: {
          bg: {
            deep: '#070b14',
            dark: '#0d1322',
            card: '#121a2d',
            hover: '#19243d',
            border: '#1f2e4d',
          },
          blue: {
            light: '#67e8f9',
            DEFAULT: '#00d2ff',
            dark: '#0284c7',
            glow: 'rgba(0, 210, 255, 0.25)',
          },
          purple: {
            light: '#e879f9',
            DEFAULT: '#c026d3',
            dark: '#7e22ce',
            glow: 'rgba(192, 38, 211, 0.25)',
          },
          orange: {
            light: '#fb923c',
            DEFAULT: '#ff5722',
            dark: '#c2410c',
            glow: 'rgba(255, 87, 34, 0.25)',
          },
          green: {
            DEFAULT: '#10b981',
            glow: 'rgba(16, 185, 129, 0.25)',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 210, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(192, 38, 211, 0.3)',
        'glow-orange': '0 0 20px rgba(255, 87, 34, 0.3)',
        'glow-red': '0 0 25px rgba(239, 68, 68, 0.4)',
        'cyber-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 10px rgba(0, 210, 255, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(0, 210, 255, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
