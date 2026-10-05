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
      injectRegister: 'script',
      includeAssets: ['brand/batchaman-mark.png', 'brand/icon-192.png', 'brand/icon-512.png'],
      manifest: {
        name: 'BatchAman — Catatan dapur',
        short_name: 'BatchAman',
        description: 'Catatan batch makanan lokal. Ambang bawaan belum diverifikasi ahli.',
        lang: 'id',
        theme_color: '#164b3b',
        background_color: '#f6f5f0',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'brand/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        maximumFileSizeToCacheInBytes: 2_000_000,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: { manifest: true },
});
