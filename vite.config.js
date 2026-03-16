import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // SPA fallback: serve index.html for client-side routes (fixes 404 on refresh)
    {
      name: 'spa-fallback',
      enforce: 'pre',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url?.split('?')[0] ?? ''
          if (url && url !== '/' && !url.startsWith('/@') && !url.includes('.')) {
            req.url = req.url?.replace(/^[^?]*/, '/index.html') ?? '/index.html'
          }
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && !req.url.startsWith('/@') && !req.url.includes('.')) {
            req.url = '/index.html'
          }
          next()
        })
      },
    },
  ],
})
