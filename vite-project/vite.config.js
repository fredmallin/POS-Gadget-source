import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/icon-192.png'],
      manifest: {
        name: 'Gadget Source POS',
        short_name: 'GadgetPOS',
        description: 'POS for Gadget Source',
        theme_color: '#0d47a1',
        icons: [
          { src: '/icons/icon 1.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon2.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,png,ico}'],
      },
    }),
  ],
});
