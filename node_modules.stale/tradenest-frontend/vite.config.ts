import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/api/products': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
      '/api/categories': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
          ui: ['framer-motion', 'lucide-react', 'swiper'],
        },
      },
    },
  },
})