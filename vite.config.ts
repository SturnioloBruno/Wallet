import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/proxy-auth': {
          target: 'https://usuarios-836529000285.southamerica-east1.run.app',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/proxy-auth/, ''),
        },
        '/proxy-wallet': {
          target: 'https://wallet-836529000285.southamerica-east1.run.app',
          changeOrigin: true,
          secure: false,
          rewrite: (p) => p.replace(/^\/proxy-wallet/, ''),
        },
      },
    },
  };
});
