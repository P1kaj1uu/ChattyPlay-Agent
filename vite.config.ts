import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/translate': {
        target: 'https://fanyi-api.baidu.com/api/trans/vip',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/translate/, '/translate')
      },
      '/api/kuaikan': {
        target: 'https://www.kuaikanmanhua.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kuaikan/, '')
      },
      '/api/kuaikan-m': {
        target: 'https://m.kuaikanmanhua.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/kuaikan-m/, '')
      },
      '/api/netease': {
        target: 'https://netease-cloud-music-api.fe-mm.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/netease/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  }
})
