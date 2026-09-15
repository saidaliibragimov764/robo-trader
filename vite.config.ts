import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * API proxy: agar VITE_API_URL bo'sh qoldirilsa, frontend nisbiy
 * `/api/...` so'rovlar yuboradi va Vite uni mock/real backendga
 * (default: http://localhost:8765) proksilaydi. Bu CORS va mixed-content
 * muammolarini yo'q qiladi (Telegram = HTTPS ichida http:// backendga
 * direct request bloklanishi mumkin).
 */
const apiTarget = process.env.VITE_PROXY_TARGET || 'http://127.0.0.1:8765'
const proxy = { '/api': { target: apiTarget, changeOrigin: true } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true, port: 5173, proxy, allowedHosts: true },
  preview: { host: true, port: 4173, proxy, allowedHosts: true },
})
