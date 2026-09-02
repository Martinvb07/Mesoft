import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      // ws: true, si no el socket no pasa por el proxy y en local no hay tiempo real
      '/socket.io': { target: 'http://localhost:3001', ws: true, changeOrigin: true },
    },
  },
})
