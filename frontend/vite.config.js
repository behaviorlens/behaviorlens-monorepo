import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = (env.VITE_API_ORIGIN || 'http://localhost:8000').replace(/\/$/, '');

  return {
    plugins: [react()],
    json: {
      stringify: true
    },
    server: {
      host: true,
      port: 5173,
      // Docker bind mounts on Windows/macOS do not deliver file events.
      watch: env.VITE_USE_POLLING === 'true' ? { usePolling: true, interval: 300 } : undefined,
      proxy: {
        '/api': {
          target: apiOrigin,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: true,
      port: 4173
    },
    build: {
      target: 'es2020',
      sourcemap: false,
      chunkSizeWarningLimit: 4000
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}'],
      css: false
    }
  };
});
