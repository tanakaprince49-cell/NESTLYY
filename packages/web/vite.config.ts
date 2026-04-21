import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '../..', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      esbuild: {
        legalComments: 'none',
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'motion': ['motion/react'],
              'firebase': ['firebase/app'],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@nestly/shared': path.resolve(__dirname, '../shared/src'),
        }
      }
    };
});
