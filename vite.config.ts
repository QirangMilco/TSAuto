import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  test: {
    environment: 'happy-dom'
  },
  // 配置插件目录的处理
  optimizeDeps: {
    include: ['/plugins/**/*.ts']
  },
  build: {
    // 确保插件文件被正确打包
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      // 允许打包插件目录
      plugins: []
    }
  }
})