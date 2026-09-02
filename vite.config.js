import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig(({ mode }) => {
  // Load .env + .env.[mode] supaya URL backend terbaca di server config.
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
          // Gunakan key yang sama dengan Axios. VITE_BE_URL dipertahankan
          // sebagai fallback kompatibilitas untuk konfigurasi lama.
          target: env.VITE_API_URL || env.VITE_BE_URL || 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
