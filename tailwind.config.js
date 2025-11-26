/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      boxShadow: {
        'glow-md': '0 0 20px rgba(255,255,255,0.12)',
      }
    },
  },
  plugins: [],
};
