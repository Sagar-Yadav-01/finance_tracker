import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5005',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (err.code === 'ECONNREFUSED') {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ offline: true, message: 'Backend API server offline' }));
            }
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
});
