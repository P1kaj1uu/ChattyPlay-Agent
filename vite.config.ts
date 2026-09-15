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

      console.log('\x1b[36m%s\x1b[0m', 'Hono Proxy Server with Goofish started')

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
  optimizeDeps: {
    esbuildOptions: {
      // 这里改的是「依赖预打包」，与上面顶层的 define 无关。
      // Monaco 由 @monaco-editor/react 从 CDN 以 AMD loader 方式加载，会注入全局 define；
      // 而部分依赖是 UMD 包，检测到 define 后会在加载时走 AMD 分支，执行匿名 define(...)，
      // 触发 Monaco loader 的限制并抛出
      // "Can only have one anonymous define call per script file"。
      //
      // UMD 的检测有两种写法，必须都覆盖：
      //   1) typeof define === "function" && define.amd   -> 用 define.amd = false 关闭
      //   2) typeof define === "function"（不检查 amd，如 fastdom）-> 用 define = undefined 关闭
      // esbuild 只会替换「未被局部变量遮蔽」的全局标识符，因此 axios 这类
      // `const define = (arr) => ...` 的局部函数不受影响。
      define: {
        'define.amd': 'false',
        define: 'undefined'
      }
    }
  },
  plugins: [react(), honoServerPlugin(), copyHtaccessPlugin()],
  server: {
    host: '0.0.0.0', // 允许真机通过局域网 IP 访问
    port: 3000,
    open: true,
    // 代理配置：开发环境下将 /api 请求转发到后端服务器
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/api/latex': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
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
