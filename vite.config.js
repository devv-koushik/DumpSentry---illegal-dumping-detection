import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react/')) {
              return 'vendor'
            }
            if (id.includes('recharts')) {
              return 'recharts'
            }
            if (id.includes('leaflet')) {
              return 'leaflet'
            }
            if (id.includes('framer-motion')) {
              return 'framer'
            }
          }
        }
      }
    }
  }
})
