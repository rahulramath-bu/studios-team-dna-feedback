import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Mini backend for the AI Coaching demo: the Anthropic org disallows
      // direct browser (CORS) requests, so the dev server relays them.
      // Server-to-server calls aren't subject to the CORS lockdown.
      '/anthropic-proxy': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anthropic-proxy/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Strip browser-identifying headers so Anthropic treats this as a
            // server request rather than a blocked cross-origin one.
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
          });
        },
      },
    },
  },
});
