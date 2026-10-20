import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression2';

export default defineConfig({
  plugins: [
    react({
      // Enable Fast Refresh for instant HMR
      fastRefresh: true,
      // Optimize JSX runtime
      jsxRuntime: 'automatic'
    }),
    // Gzip compression for production
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    // Brotli compression for modern browsers
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    // Bundle analyzer (run with ANALYZE=true npm run build)
    visualizer({
      open: process.env.ANALYZE === 'true',
      gzipSize: true,
      brotliSize: true
    })
  ],
  server: { 
    proxy: { 
      '/api': 'http://localhost:4000', 
      '/uploads': 'http://localhost:4000' 
    },
    // Enable HMR with optimized settings
    hmr: {
      overlay: true
    }
  },
  build: {
    // Target modern browsers for better optimization
    target: 'es2020',
    // Enable code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'icons': ['lucide-react'],
          'socket': ['socket.io-client']
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    // Disable source maps in production for smaller size
    sourcemap: false,
    // Minify for production with advanced settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
        unsafe_arrows: true,
        unsafe_methods: true
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false // Remove all comments
      }
    },
    // CSS optimization
    cssCodeSplit: true,
    cssMinify: true,
    // Reduce initial bundle size
    reportCompressedSize: true,
    // Optimize assets
    assetsInlineLimit: 4096 // Inline assets smaller than 4kb
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'recharts', 
      'lucide-react', 
      'socket.io-client'
    ],
    // Exclude large dependencies that don't need pre-bundling
    exclude: []
  },
  // Enable esbuild for faster builds
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
    legalComments: 'none',
    drop: ['console', 'debugger']
  }
});