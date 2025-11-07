import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@packages/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@packages/design-system': path.resolve(__dirname, '../../packages/design-system'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0', // Allow access from outside container
    port: 3001,
    open: false,
    strictPort: true,
    allowedHosts: ['local.admin.ddcn41.com', 'localhost'],
    watch: {
      usePolling: true, // Better compatibility with Docker volumes
    },
  },
});
