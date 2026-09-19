import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = (env.VITE_API_URL || 'http://172.20.10.12:8000/api').replace('/api', '')

  return {
    plugins: [react()],
    server: {
      host: true, // écoute sur 0.0.0.0 (réseau local accessible)
      port: 5173,
      proxy: {
        // Proxifie /storage/* vers le backend — contourne le CORS sur les images
        '/storage': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    define: {
      // Polyfill Buffer pour @react-pdf/renderer en browser
      global: 'globalThis',
    },
    optimizeDeps: {
      include: ['buffer'],
    },
    resolve: {
      alias: {
        buffer: 'buffer',
      },
    },
  }
})
