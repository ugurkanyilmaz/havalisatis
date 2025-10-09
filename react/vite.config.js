import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Use absolute base so assets are referenced from site root (/assets/...) —
  // prevents relative asset URLs that break when index.html is served at nested paths.
  base: '/',
  plugins: [react()],
  server: {
    host: true, // listen on all addresses, including LAN IP
    port: 5173,
    strictPort: false,
    proxy: {
      // Proxy API calls to the PHP built-in server running on port 8001
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        secure: false,
        // Keep /api prefix - PHP expects /api/v2/... paths
        rewrite: (path) => path
      }
    }
  },
})
