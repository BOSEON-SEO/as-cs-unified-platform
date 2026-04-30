import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Electron prod 빌드 시 상대 경로로 로드 (file:// 프로토콜 대응)
  base: './',

  server: {
    port: 5173,
    // Electron dev 모드에서는 자동 브라우저 열기 비활성화
    open: false,
    // Spring Boot API 프록시 (dev 모드 CORS 우회)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // Renderer에서 접근 가능한 빌드 타임 상수
  define: {
    VITE_DEV_SERVER_URL: JSON.stringify('http://localhost:5173'),
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
