import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo192.png', 'logo512.png'], // garante que os ícones sejam incluídos
      manifest: {
        name: 'Papo Reto',
        short_name: 'Papo Reto',
        start_url: '.',               // melhor que '/' para TWA, evita mostrar a barra de URL
        display: 'standalone',       // abre como app sem barra de navegador
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: '/logo192.png',
            sizes: '512x512',
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