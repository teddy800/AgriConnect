import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    proxy: { 
      '/api': 'http://localhost:4000', 
      '/uploads': 'http://localhost:4000' 
    } 
  },
  build: {
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
          'socket': ['socket.io-client']
        }
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Source maps for debugging in production
    sourcemap: true,
    // Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    }
  },
  // Performance optimizations
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts', 'lucide-react', 'socket.io-client']
  }
});