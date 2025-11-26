import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    hmr: {
      overlay: false, // Disable error overlay
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  },
  logLevel: 'info', // Show startup info for debugging
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split into smaller chunks based on imports
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            // Radix UI components - split by component
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }
            // Icons and animations
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'ui-animations';
            }
            // Utility libraries
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('class-variance-authority')) {
              return 'ui-utils';
            }
            // Supabase
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            // Calendar libraries
            if (id.includes('@fullcalendar')) {
              return 'calendar-libs';
            }
            // All other node_modules
            return 'vendor-misc';
          }

          // App-specific chunks
          if (id.includes('/src/services/campaign/')) {
            return 'campaign';
          }
          if (id.includes('/src/components/content-calendar/') || id.includes('/src/services/content-calendar')) {
            return 'content';
          }
          if (id.includes('/src/services/synapse/') || id.includes('/src/services/intelligence/')) {
            return 'synapse';
          }
          if (id.includes('/src/services/analytics')) {
            return 'analytics';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500, // Warn if chunks exceed 500 KB
  },
})
