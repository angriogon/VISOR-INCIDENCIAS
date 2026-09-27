import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Visor Incidencias',
        short_name: 'Visor Incidencias',
        description: 'Planificador local de incidencias para Dispatcher IT',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f5f7fa',
        theme_color: '#1f2937',
        lang: 'es',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,svg,ico,png,json}']
      }
    })
  ],
  build: {
    target: 'es2022'
  }
});
