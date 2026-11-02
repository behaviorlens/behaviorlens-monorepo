import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

// Most components are JSX in .js files; compile those before the React plugin.
const jsxInJsPlugin = () => ({
  name: 'behaviorlens-jsx-in-js',
  enforce: 'pre',
  async transform(code, id) {
    if (!id.includes('/src/') || !id.endsWith('.js')) {
      return null;
    }

    return transformWithEsbuild(code, id, {
      loader: 'jsx',
      jsx: 'automatic'
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiOrigin = (env.VITE_API_ORIGIN || 'http://localhost:8000').replace(/\/$/, '');

  return {
    plugins: [jsxInJsPlugin(), react()],
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
