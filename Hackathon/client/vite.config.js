import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react', 'framer-motion'],
          'utils': ['react-hot-toast', 'qrcode']
        }
      }
    },
    // Increase chunk size warning limit to 1000kb (only for MVP)
    chunkSizeWarningLimit: 1000
  }
});
