/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        neonPink: '#FF1CF7',
        neonBlue: '#00E5FF',
      },
      boxShadow: {
        'glow-md': '0 0 20px rgba(255,255,255,0.12)',
      }
    },
  },
  plugins: [],
};
