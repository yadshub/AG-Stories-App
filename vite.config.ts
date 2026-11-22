import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png', 'stories/*.json'],
      manifest: {
        name: 'Tier-Geschichten — Deutsch Bilderbücher',
        short_name: 'Geschichten',
        description: 'Kurze Schweizer Hochdeutsch Bildergeschichten mit Tieren für Kinder',
        theme_color: '#FDF6EC',
        background_color: '#FDF6EC',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        lang: 'de-CH',
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        runtimeCaching: [
          {
            urlPattern: /stories\/.*\.json$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'stories-cache',
              expiration: {
                maxEntries: 200,
              },
            },
          },
        ],
      },
    }),
  ],
});
