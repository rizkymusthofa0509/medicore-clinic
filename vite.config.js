import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // Load .env + .env.[mode] supaya VITE_BE_URL terbaca di server config
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      port: 5174,
      // listen agar Vite bisa diakses via [::1]:5174 (IPv6 localhost) di Mac.
      host: true,
      strictPort: true,
      proxy: {
        '/api': {
          // Prioritas: VITE_BE_URL eksplisit, lalu default BE (.env BE: 8000).
          // Sebelumnya fallback ke 8001 yang sering kosong → 502 Bad Gateway.
          target: env.VITE_BE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
