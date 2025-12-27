/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '^/(healthz|readyz|fees|risk|presets|social|art)': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '^/stream': {
        target: 'ws://localhost:3001',
        ws: true,
      },
      '^/snipe': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})