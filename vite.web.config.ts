import { resolve } from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standalone Vite config for web mode (no electron-vite dependency)
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer')
    }
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 7568,
    proxy: {
      '/api': {
        target: 'http://localhost:7567',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:7567',
        ws: true
      },
      '/files': {
        target: 'http://localhost:7567',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: resolve(__dirname, 'out/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'src/renderer/index.html')
      }
    }
  }
});
