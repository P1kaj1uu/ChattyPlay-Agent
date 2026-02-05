import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'
import { spawn } from 'child_process'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Hono 服务器插件 - 自动启动后端服务
function honoServerPlugin() {
  return {
    name: 'hono-server',
    configureServer() {
      const serverProcess = spawn('npx', ['tsx', 'src/services/server.ts'], {
        stdio: 'inherit',
        shell: true
      })

      console.log('\x1b[36m%s\x1b[0m', 'Hono Proxy Server started')

      // Vite 服务器关闭时也关闭 Hono 服务器
      return () => {
        serverProcess.kill()
        console.log('\x1b[33m%s\x1b[0m', 'Hono Proxy Server stopped')
      }
    }
  }
}

// 复制 .htaccess 到 dist 目录
function copyHtaccessPlugin() {
  return {
    name: 'copy-htaccess',
    closeBundle() {
      const publicHtaccess = resolve(__dirname, 'public', '.htaccess')
      const distHtaccess = resolve(__dirname, 'dist', '.htaccess')

      if (existsSync(publicHtaccess)) {
        copyFileSync(publicHtaccess, distHtaccess)
        console.log('\x1b[32m%s\x1b[0m', 'Copied .htaccess to dist/')
      } else {
        console.log('\x1b[33m%s\x1b[0m', 'No .htaccess found in public/')
      }
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [react(), honoServerPlugin(), copyHtaccessPlugin()],
  server: {
    host: '0.0.0.0', // 允许真机通过局域网 IP 访问
    port: 3000,
    open: true,
    // 代理配置：开发环境下将 /api 请求转发到 Hono 服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true
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
