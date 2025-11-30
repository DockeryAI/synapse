/**
 * Vite config for Proof Dev Page - Port 3002
 *
 * Run with: npm run dev:proof
 *
 * Isolated dev server for Proof tab development.
 * Same config as main app, just different port.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    host: true,
    hmr: {
      overlay: false,
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  logLevel: 'info',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
