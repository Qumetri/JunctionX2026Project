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
      // Local Ollama for the report summaries (shared/services/ollama.ts). Ollama answers 403 to
      // browser origins it doesn't know, such as the Network URL (http://10.x.x.x:5173) or a
      // phone on the same Wi-Fi, so the proxy drops the Origin header: no OLLAMA_ORIGINS needed.
      '/proxy/ollama': {
        target: 'http://127.0.0.1:11434',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy\/ollama/, ''),
        configure: (proxy) => proxy.on('proxyReq', (request) => request.removeHeader('origin')),
      },
    },
  },
})
