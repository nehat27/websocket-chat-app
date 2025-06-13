import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,       // Use the specific port
    proxy: {
      '/socket.io': {
        target: 'https://chat-app-back-new.onrender.com',
        changeOrigin: true,
        ws: true
      }
    },
    cors: true
  },
})
