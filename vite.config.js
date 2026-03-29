import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // ✅ importante pra funcionar bem no Android / TWA
      workbox: {
        navigateFallback: '/index.html'
      },

      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'],

      manifest: {
        name: 'Papo Reto',
        short_name: 'Papo Reto',

        // ✅ CORRETO para TWA
        start_url: '/',

        scope: '/',

        display: 'standalone',

        background_color: '#000000',
        theme_color: '#000000',

        icons: [
          {
            src: '/logo192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})