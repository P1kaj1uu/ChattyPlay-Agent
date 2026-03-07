import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { networkInterfaces } from 'os'
import { createNodeWebSocket } from '@hono/node-ws'
import { initDatabase, closeDatabase } from '../goofish/db'
import { ClientManager } from '../goofish/websocket'
import { fetchUserHead, handleOrderMessage, fetchAndUpdateOrderDetail } from '../goofish/services'
import { messageStore, conversationStore, setClientManager } from '../goofish/api'
import { createLogger, cleanOldLogs, setLogLevel, LogLevel } from '../goofish/core/logger'
import { LOG_CONFIG } from '../goofish/core/constants'
import { createStatusRoutes } from '../goofish/api/routes'
import { createWSPushHandler } from '../goofish/api/routes/ws-push.route'
import { createAccountRoutes } from '../goofish/api/routes/accounts'
import { createGoodsRoutes } from '../goofish/api/routes/goods'
import { createMessageRoutes } from '../goofish/api/routes/messages'
import { createConversationRoutes } from '../goofish/api/routes/conversations'
import { createLogsRoutes } from '../goofish/api/routes/logs'
import { createAutoReplyRoutes } from '../goofish/api/routes/autoreply'
import { createOrderRoutes } from '../goofish/api/routes/order.route'
import { createAutoSellRoutes } from '../goofish/api/routes/autosell'
import { createWorkflowRoutes } from '../goofish/api/routes/workflow.route'

const goofishLogger = createLogger('Goofish:Integration')
const app = new Hono()

// WebSocket 支持
const nodeWS = createNodeWebSocket({ app })
const { upgradeWebSocket, injectWebSocket } = nodeWS

// Goofish ClientManager
let clientManager: ClientManager

// 初始化 Goofish
async function initGoofish() {
  goofishLogger.info('初始化 Goofish 服务...')

  // 设置日志级别
  setLogLevel(LOG_CONFIG.LEVEL as LogLevel)

  // 清理过期日志
  cleanOldLogs(LOG_CONFIG.RETENTION_DAYS)

  // 初始化数据库
  initDatabase()

  // 创建客户端管理器
  clientManager = new ClientManager(async (accountId, msg) => {
    goofishLogger.info(`收到新消息: ${msg.senderName}: ${msg.content}`)
    messageStore.add(msg)
    conversationStore.addIncoming(accountId, msg)

    // 处理订单状态消息
    if (msg.isOrderMessage && msg.orderId) {
      goofishLogger.info(`订单消息: orderId=${msg.orderId}`)
      handleOrderMessage(accountId, msg.orderId, msg.chatId)
      fetchOrderDetailAsync(accountId, msg.orderId)
    }

    // 异步获取用户头像（不阻塞消息处理）
    fetchUserAvatarAsync(accountId, msg.chatId, msg.senderId)
  })

  // 设置 API 客户端管理器引用
  setClientManager(clientManager)

  // 从数据库加载并启动所有启用的账号
  await clientManager.startAll()

  goofishLogger.info('Goofish 服务初始化完成')
}

// 异步获取用户头像
async function fetchUserAvatarAsync(accountId: string, chatId: string, userId: string) {
  try {
    const { userHead } = await fetchUserHead(accountId, userId)
    if (userHead?.avatar) {
      conversationStore.updateUserAvatar(accountId, chatId, userHead.avatar)
    }
  } catch (e) {
    goofishLogger.debug(`获取用户头像失败: ${e}`)
  }
}

// 异步获取订单详情
async function fetchOrderDetailAsync(accountId: string, orderId: string) {
  try {
    const client = clientManager.getClient(accountId)
    if (!client) {
      goofishLogger.warn(`获取订单详情失败: 账号 ${accountId} 客户端不存在`)
      return
    }
    await fetchAndUpdateOrderDetail(client, orderId)
  } catch (e) {
    goofishLogger.debug(`获取订单详情失败: ${e}`)
  }
}

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
  maxAge: 86400,
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

// WebSocket 推送端点
app.get('/ws', upgradeWebSocket(() => createWSPushHandler(() => clientManager)))

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
app.get('/api/info', (c) => {
  return c.json({
    message: 'API Proxy Server',
    version: '4.0.0',
    environment: isDev ? 'development' : 'production',
    endpoints: {
      '/health': 'Health check endpoint',
      '/api/translate': 'Baidu Translate API proxy',
      '/api/kuaikan/*': 'Kuaikan Manhua API proxy (PC)',
      '/api/kuaikan-m/*': 'Kuaikan Manhua API proxy (Mobile)',
      '/api/netease/*': 'Netease Cloud Music API proxy',
      '/ws': 'WebSocket endpoint',
      '/api/accounts': 'Goofish account management',
      '/api/conversations': 'Goofish conversations',
      '/api/orders': 'Goofish orders',
      '/api/autoreply': 'Auto reply rules',
      '/api/autosell': 'Auto sell rules',
      '/api/workflows': 'Workflow management',
      '/api/logs': 'System logs',
      '/api/info': 'This endpoint',
    },
    timestamp: new Date().toISOString()
  })
})

// Goofish 路由（必须在代理中间件之前注册）
const getClientManager = () => clientManager
app.route('/', createStatusRoutes(getClientManager))
app.route('/api', createStatusRoutes(getClientManager))
app.route('/api/accounts', createAccountRoutes(getClientManager))
app.route('/api/goods', createGoodsRoutes(getClientManager))
app.route('/api/messages', createMessageRoutes(getClientManager))
app.route('/api/conversations', createConversationRoutes())
app.route('/api/logs', createLogsRoutes())
app.route('/api/autoreply', createAutoReplyRoutes())
app.route('/api/orders', createOrderRoutes(getClientManager))
app.route('/api/autosell', createAutoSellRoutes())
app.route('/api/workflows', createWorkflowRoutes())

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
  // 排除 Goofish 路由
  const goofishRoutes = ['/api/accounts', '/api/goods', '/api/messages', '/api/conversations', '/api/logs', '/api/autoreply', '/api/orders', '/api/autosell', '/api/workflows', '/api/status', '/ws']
  for (const route of goofishRoutes) {
    if (path.startsWith(route)) {
      return null
    }
  }

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

// 代理中间件（必须在所有 goofish 路由之后注册）
app.all('/api/*', async (c, next) => {
  const path = c.req.path

  // 检查是否是 goofish 路由，如果是则跳过代理处理，让下一个处理程序处理
  const goofishRoutes = ['/api/accounts', '/api/goods', '/api/messages', '/api/conversations', '/api/logs', '/api/autoreply', '/api/orders', '/api/autosell', '/api/workflows', '/api/status', '/api/info']
  for (const route of goofishRoutes) {
    if (path.startsWith(route)) {
      // 这是一个 goofish 路由，让下一个处理程序处理
      return next()
    }
  }

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
      'GET /ws',
      'GET /api/info',
      '/api/accounts/*',
      '/api/conversations/*',
      '/api/orders/*',
      '/api/autoreply/*',
      '/api/autosell/*',
      '/api/workflows/*',
      '/api/logs/*',
      'ALL /api/* (proxy)',
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
const hostname = '0.0.0.0'

console.log('\n' + '='.repeat(50))
console.log(`Hono Proxy Server with Goofish`)
console.log('='.repeat(50))
console.log(`Environment: ${isDev ? 'development' : 'production'}`)
console.log(`Local access:   http://localhost:${port}`)
console.log(`Network access: http://${localIP}:${port}`)
console.log(`API info:       http://${localIP}:${port}/api/info`)
console.log(`Health check:   http://${localIP}:${port}/health`)
console.log(`WebSocket:      ws://${localIP}:${port}/ws`)
console.log('='.repeat(50) + '\n')

// 初始化 Goofish 后启动服务器
initGoofish().then(() => {
  const server = serve({
    fetch: app.fetch,
    port,
    hostname,
  })

  // 注入 WebSocket 支持
  injectWebSocket(server)

  // 优雅退出
  process.on('SIGINT', () => {
    goofishLogger.info('收到退出信号，正在断开连接...')
    if (clientManager) {
      clientManager.stopAll()
    }
    closeDatabase()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    goofishLogger.info('收到终止信号，正在断开连接...')
    if (clientManager) {
      clientManager.stopAll()
    }
    closeDatabase()
    process.exit(0)
  })
}).catch((err) => {
  console.error('Failed to initialize Goofish:', err)
  process.exit(1)
})
