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
      // Proxy PHP API calls to the PHP built-in server running on port 8000
      // Incoming '/php/products.php' -> forwarded to 'http://localhost:8000/products.php'
      '/php': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        // strip the leading /php prefix so the PHP server (docroot = php/) receives '/products.php'
        rewrite: (path) => path.replace(/^\/php/, '')
      }
    }
  },
})
