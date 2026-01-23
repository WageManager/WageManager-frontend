import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // 백엔드에서 5173만 허용중
    proxy: {
      '/api': {
        target: 'https://port-0-paycheck-backend-mkmluzdp5be20e47.sel3.cloudtype.app',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
})
