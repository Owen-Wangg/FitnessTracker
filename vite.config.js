import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // VITE_ is the Vite convention; REACT_APP_ is still read so existing .env files and
  // hosting environment variables keep working.
  envPrefix: ['VITE_', 'REACT_APP_'],
  server: { port: 3000 },
  // Same output folder Create React App used, so the Vercel project settings stay valid.
  build: { outDir: 'build' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
    mockReset: true,
    css: false,
  },
});
