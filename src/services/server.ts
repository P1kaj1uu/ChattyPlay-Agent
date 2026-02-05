import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { networkInterfaces } from 'os'

const app = new Hono()

// 获取局域网 IP 地址
function getLocalIP(): string {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

const localIP = getLocalIP()

// 环境判断
const isDev = process.env.NODE_ENV !== 'production'

// CORS 配置
app.use('/*', cors({
  origin: isDev
    ? '*'
    : ['http://123.60.91.107'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24小时预检缓存
}))

// 日志中间件
app.use('/*', logger())

// 请求计时中间件
app.use('/*', async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  c.header('X-Response-Time', `${duration}ms`)
})

// 健康检查
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    environment: isDev ? 'development' : 'production',
    timestamp: new Date().toISOString(),
    version: '4.0.0'
  })
})

// API 路由信息
app.get('/api', (c) => {
  return c.json({
    message: 'API Proxy Server',
    version: '4.0.0',
    environment: isDev ? 'development' : 'production',
    endpoints: {
      '/health': 'Health check endpoint',
      '/api/translate': 'Baidu Translate API proxy',
      '/api/kuaiken/*': 'Kuaikan Manhua API proxy (PC)',
      '/api/kuaiken-m/*': 'Kuaikan Manhua API proxy (Mobile)',
      '/api/netease/*': 'Netease Cloud Music API proxy'
    },
    timestamp: new Date().toISOString()
  })
})

// 代理配置映射
const PROXY_CONFIG: Record<string, {
  target: string
  pathRewrite: string
  timeout?: number
  headers?: Record<string, string>
}> = {
  '/api/translate': {
    target: 'https://fanyi-api.baidu.com/api/trans/vip',
    pathRewrite: '/translate',
    timeout: 10000,
    headers: {
      'Referer': 'https://fanyi.baidu.com/',
      'Origin': 'https://fanyi.baidu.com',
    },
  },
  '/api/kuaikan': {
    target: 'https://www.kuaikanmanhua.com',
    pathRewrite: '',
    timeout: 15000,
    headers: {
      'Referer': 'https://www.kuaikanmanhua.com/',
      'Origin': 'https://www.kuaikanmanhua.com',
    },
  },
  '/api/kuaikan-m': {
    target: 'https://m.kuaikanmanhua.com',
    pathRewrite: '',
    timeout: 15000,
    headers: {
      'Referer': 'https://m.kuaikanmanhua.com/',
      'Origin': 'https://m.kuaikanmanhua.com',
    },
  },
  '/api/netease': {
    target: 'https://netease-cloud-music-api.fe-mm.com',
    pathRewrite: '',
    timeout: 10000,
    headers: {
      'Referer': 'https://netease-cloud-music-api.fe-mm.com/',
    },
  },
}

// 匹配代理目标（优先匹配最长路径）
function matchProxyTarget(path: string): { prefix: string; config: typeof PROXY_CONFIG[keyof typeof PROXY_CONFIG] } | null {
  const sortedPrefixes = Object.keys(PROXY_CONFIG).sort((a, b) => b.length - a.length)
  for (const prefix of sortedPrefixes) {
    if (path.startsWith(prefix)) {
      return { prefix, config: PROXY_CONFIG[prefix] }
    }
  }
  return null
}

// 路径重写
function rewritePath(path: string, prefix: string, replacement: string): string {
  return path.replace(new RegExp(`^${prefix}`), replacement)
}

// 请求缓存（仅用于开发环境）
const cache = new Map<string, { data: ArrayBuffer; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5分钟

// 代理中间件
app.all('/api/*', async (c) => {
  const path = c.req.path
  const matched = matchProxyTarget(path)

  if (!matched) {
    return c.json(
      {
        error: 'No proxy target found',
        availableEndpoints: Object.keys(PROXY_CONFIG),
        path: path,
      },
      404
    )
  }

  const { prefix, config } = matched
  const { target, pathRewrite, timeout = 10000, headers: customHeaders = {} } = config

  // 构建目标URL
  const rewrittenPath = rewritePath(path, prefix, pathRewrite)
  const queryString = c.req.query()
  const queryParams = new URLSearchParams(queryString).toString()
  const targetUrl = `${target}${rewrittenPath}${queryParams ? `?${queryParams}` : ''}`

  // 检查缓存（仅GET请求）
  if (isDev && c.req.method === 'GET') {
    const cached = cache.get(targetUrl)
    if (cached && cached.expiry > Date.now()) {
      return new Response(cached.data, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
        },
      })
    }
  }

  try {
    // 构建 AbortController 用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    // 获取请求体（非 GET/HEAD 请求）
    let body: ArrayBuffer | undefined
    if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
      body = await c.req.arrayBuffer()
    }

    // 转发请求
    const response = await fetch(targetUrl, {
      method: c.req.method,
      headers: {
        'Content-Type': c.req.header('Content-Type') || 'application/json',
        'User-Agent': c.req.header('User-Agent') ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...customHeaders,
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // 获取响应内容
    const responseData = await response.arrayBuffer()

    // 缓存成功的 GET 响应
    if (isDev && c.req.method === 'GET' && response.ok) {
      cache.set(targetUrl, {
        data: responseData,
        expiry: Date.now() + CACHE_TTL,
      })
      // 限制缓存大小
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        if (firstKey) cache.delete(firstKey)
      }
    }

    // 返回响应
    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        'X-Cache': 'MISS',
        'Access-Control-Expose-Headers': 'Content-Type, X-Cache, X-Response-Time',
      },
    })
  } catch (error) {
    // 清理超时的缓存
    if (c.req.method === 'GET') {
      cache.delete(targetUrl)
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const isAbort = error instanceof Error && error.name === 'AbortError'

    console.error('Proxy error:', {
      url: targetUrl,
      method: c.req.method,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    })

    return c.json(
      {
        error: isAbort ? 'Request timeout' : 'Proxy request failed',
        message: errorMessage,
        target: targetUrl,
        method: c.req.method,
        timestamp: new Date().toISOString(),
      },
      isAbort ? 504 : 502
    )
  }
})

// 404 处理
app.notFound((c) => {
  return c.json({
    error: 'Not Found',
    message: `Route ${c.req.method} ${c.req.path} not found`,
    availableRoutes: [
      'GET /health',
      'GET /api',
      'ALL /api/*',
    ],
  }, 404)
})

// 错误处理
app.onError((err, c) => {
  console.error('Server error:', err)
  return c.json({
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString(),
  }, 500)
})

// 启动服务器
const port = Number(process.env.PORT) || 3001
const hostname = '0.0.0.0' // 允许真机通过局域网 IP 访问

console.log('\n' + '='.repeat(50))
console.log(`Hono Proxy Server`)
console.log('='.repeat(50))
console.log(`Environment: ${isDev ? 'development' : 'production'}`)
console.log(`Local access:   http://localhost:${port}`)
console.log(`Network access: http://${localIP}:${port}`)
console.log(`API info:       http://${localIP}:${port}/api`)
console.log(`Health check:   http://${localIP}:${port}/health`)
console.log('='.repeat(50) + '\n')

serve({
  fetch: app.fetch,
  port,
  hostname,
})
