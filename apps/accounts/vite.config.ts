import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: path.resolve(__dirname, '../..'),
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, './src/shared'),
      '@packages/design-system': path.resolve(__dirname, '../../packages/design-system/src'),
      '@packages/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  server: {
    host: '0.0.0.0', // Allow access from outside container
    port: 3002,
    strictPort: true,
    allowedHosts: ['local.accounts.ddcn41.com', 'localhost'],
    watch: {
      usePolling: true, // Better compatibility with Docker volumes
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
