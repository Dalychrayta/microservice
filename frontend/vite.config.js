import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Configuration Vite.
 *
 * Le proxy redirige les appels /api/* vers la Gateway (port 8080).
 * En développement, le frontend tourne sur :3000 et la Gateway sur :8080.
 * Le proxy évite les problèmes CORS en développement local.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Gateway
        changeOrigin: true
      }
    }
  }
})
