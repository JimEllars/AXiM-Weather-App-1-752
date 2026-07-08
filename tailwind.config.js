/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        axim: {
          dark: '#0B0F19',
          panel: '#151A2C',
          accent: '#00E5FF',
          danger: '#FF3D71',
          warning: '#FFAA00',
          success: '#00D68F'
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}