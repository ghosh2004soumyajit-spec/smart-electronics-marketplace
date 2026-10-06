import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — React SPA deployed to Vercel.
// Dev proxy forwards /api to the local Express backend so there are no CORS
// headaches during development. When the backend is not running, the mock API
// layer in src/services/mockDb.js answers requests instead (see api.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_PROXY_TARGET || 'http://localhost:5000',
        changeOrigin: true,
        // If the backend is down, let the request fail — api.js falls back to mocks.
      },
    },
  },
  build: {
    // Keep the initial bundle lean: motion + query are vendor-split.
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          motion: ['framer-motion'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true, // exposes describe/it/expect globally and enables RTL auto-cleanup
    setupFiles: './src/test/setup.js',
    css: false,
    testTimeout: 12000,
  },
});
