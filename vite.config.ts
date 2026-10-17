import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // HSY sends no CORS headers; the browser calls /proxy/hsy and Vite forwards it.
      // Deployed hosts need the same rewrite (context/backendMovingPlan.md §4).
      '/proxy/hsy': {
        target: 'https://kartta.hsy.fi/geoserver',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/hsy/, ''),
      },
      // Local Ollama for the report summary (shared/services/aiSummary.ts). Same-origin, so no
      // OLLAMA_ORIGINS setup is needed.
      '/proxy/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/ollama/, ''),
      },
    },
  },
})
