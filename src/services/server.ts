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
import { authRoute } from '../goofish/api/routes/auth.route'

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
      '/api/latex': 'LaTeX compilation API proxy',
      '/ws': 'WebSocket endpoint',
      '/api/accounts': 'Goofish account management',
      '/api/conversations': 'Goofish conversations',
      '/api/orders': 'Goofish orders',
      '/api/autoreply': 'Auto reply rules',
      '/api/autosell': 'Auto sell rules',
      '/api/workflows': 'Workflow management',
      '/api/logs': 'System logs',
      '/api/auth': 'User authentication (login, register)',
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
app.route('/api/auth', authRoute)

// LaTeX 编译 API 代理
app.post('/api/latex/compile', async (c) => {
  try {
    const { code, compiler = 'xelatex', files = [] } = await c.req.json()

    // 添加时间戳确保请求唯一性
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] LaTeX 编译请求`)

    if (!code || typeof code !== 'string') {
      return c.json({
        success: false,
        error: '请提供有效的 LaTeX 代码'
      }, 400)
    }

    console.log('LaTeX 编译请求:', {
      compiler,
      codeLength: code.length,
      codePreview: code.substring(0, 100) + (code.length > 100 ? '...' : ''),
      filesCount: files.length,
      files: files.map((f: any) => ({ name: f.name, contentLength: f.content?.length }))
    })

    // 如果有图片文件，使用正确的 API 格式传递
    let processedCode = code
    if (files && files.length > 0) {
      console.log('检测到图片文件，使用多文件资源格式')
    }

    // 检测是否包含中文字符
    const hasChinese = /[一-龥]/.test(processedCode)
    console.log('包含中文:', hasChinese)

    // 如果包含中文，尝试使用专门处理中文的服务
    if (hasChinese) {
      console.log('检测到中文内容，使用特殊的中文处理方案')

      // 方案1: 尝试使用 Overleaf-style API
      try {
        const overleafUrl = 'https://compile.overleaf.com/docs'

        // 构建文件列表：主文件（图片已嵌入）
        const requestFiles: any[] = [{
          name: 'main.tex',
          content: processedCode
        }]

        // 不再需要添加附加文件，因为图片已经嵌入到代码中

        const response = await fetch(overleafUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            compiler: compiler,
            files: requestFiles,
            options: {
              timeout: 60
            }
          }),
        })

        if (response.ok) {
          const data = await response.json()
          if (data.pdfs && data.pdfs['main.pdf']) {
            const pdfData = data.pdfs['main.pdf']
            const pdfBuffer = Buffer.from(pdfData, 'base64')

            return new Response(pdfBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'attachment; filename="document.pdf"',
                'Access-Control-Allow-Origin': '*',
              },
            })
          }
        }
      } catch (error) {
        console.error('Overleaf API 失败:', error)
      }

      // 方案2: 修改LaTeX代码以使用更通用的字体设置
      console.log('尝试修改LaTeX代码以支持中文')
      let modifiedCode = processedCode  // 使用已经处理过（包含图片）的代码

      // 如果代码中没有ctex相关包，添加中文支持
      if (!processedCode.includes('ctex') && !processedCode.includes('CJK')) {
        // 在documentclass后添加中文支持
        modifiedCode = processedCode.replace(
          /\\documentclass(\[[^\]]*\])?\{([^}]+)\}/,
          (match, options, docclass) => {
            if (docclass === 'ctexart') {
              return match // 已经是ctexart，不修改
            }
            return `\\documentclass${options || ''}{${docclass}}\n\\usepackage{CJKutf8}\n\\usepackage{CJK}`
          }
        )

        // 在document环境中添加CJK支持
        if (modifiedCode.includes('\\begin{document}')) {
          modifiedCode = modifiedCode.replace(
            '\\begin{document}',
            '\\begin{document}\n\\begin{CJK*}{UTF8}{gbsn}'
          )
        }

        if (modifiedCode.includes('\\end{document}')) {
          modifiedCode = modifiedCode.replace(
            '\\end{document}',
            '\\end{CJK*}\n\\end{document}'
          )
        }
      }

      console.log('修改后的代码预览:', modifiedCode.substring(0, 200) + '...')

      // 使用修改后的代码尝试编译
      const latexApiUrl = 'https://latex.ytotech.com/builds/sync'

      // 构建请求数据 - 使用正确的 resources 格式
      const resources: any[] = [{
        main: true,
        content: modifiedCode
      }]

      // 添加附加文件（图片等）- 使用正确的格式
      if (files && files.length > 0) {
        for (const file of files) {
          if (file.name && file.content) {
            // 提取纯 base64 数据（去掉 data:image/...;base64, 前缀）
            let base64Data = file.content
            if (base64Data.startsWith('data:')) {
              base64Data = base64Data.split(',')[1] || base64Data
            }

            // 使用正确的 API 格式：path + file
            resources.push({
              path: file.name,
              file: base64Data
            })

            console.log(`添加图片资源（中文处理）: ${file.name}`)
          }
        }
      }

      const requestData = {
        compiler: compiler,
        resources: resources
      }

      console.log('发送到 LaTeX API 的请求（中文处理）:', {
        compiler,
        codeLength: modifiedCode.length,
        资源数量: resources.length,
        包含图片: files && files.length > 0
      })

      const response = await fetch(latexApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/pdf')) {
          const pdfBuffer = await response.arrayBuffer()
          console.log('中文PDF生成成功，大小:', pdfBuffer.byteLength, '字节')

          return new Response(pdfBuffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': 'attachment; filename="document.pdf"',
              'Access-Control-Allow-Origin': '*',
            },
          })
        }
      }
    }

    // 非中文内容或中文处理失败，使用标准流程
    const latexApiUrl = 'https://latex.ytotech.com/builds/sync'

    // 构建请求数据 - 使用正确的 resources 格式
    const resources: any[] = [{
      main: true,
      content: processedCode
    }]

    // 添加附加文件（图片等）- 使用正确的格式
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.name && file.content) {
          // 提取纯 base64 数据（去掉 data:image/...;base64, 前缀）
          let base64Data = file.content
          if (base64Data.startsWith('data:')) {
            base64Data = base64Data.split(',')[1] || base64Data
          }

          // 使用正确的 API 格式：path + file
          resources.push({
            path: file.name,
            file: base64Data
          })

          console.log(`添加图片资源: ${file.name}`)
        }
      }
    }

    const requestData = {
      compiler: compiler,
      resources: resources
    }

    console.log('发送到 LaTeX API 的请求:', {
      compiler,
      codeLength: processedCode.length,
      资源数量: resources.length,
      包含图片: files && files.length > 0
    })

    const response = await fetch(latexApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    })

    console.log('API 响应状态:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('LaTeX API 错误响应:', errorText)
      console.error('请求体详情:', JSON.stringify(requestData, null, 2))
      throw new Error(`LaTeX API 返回错误: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const contentType = response.headers.get('content-type') || ''
    console.log('响应内容类型:', contentType)

    if (contentType.includes('application/pdf')) {
      const pdfBuffer = await response.arrayBuffer()
      console.log('PDF 生成成功，大小:', pdfBuffer.byteLength, '字节')

      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })
    }

    const errorText = await response.text()
    console.error('非 PDF 响应:', errorText)
    return c.json({
      success: false,
      error: `编译失败，服务器返回非 PDF 内容: ${errorText.substring(0, 200)}`
    }, 500)

  } catch (error) {
    console.error('LaTeX 编译代理错误:', error)

    const errorMessage = error instanceof Error ? error.message : '未知错误'
    return c.json({
      success: false,
      error: `LaTeX 编译失败: ${errorMessage}`
    }, 500)
  }
})

// LaTeX 编译健康检查
app.get('/api/latex/health', async (c) => {
  try {
    const testCode = '\\documentclass{article}\\begin{document}Hello World\\end{document}'
    const response = await fetch(`https://latex.ytotech.com/builds/sync?content=${encodeURIComponent(testCode)}`, {
      method: 'GET',
    })

    return c.json({
      status: response.ok ? 'available' : 'unavailable',
      statusCode: response.status,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : '未知错误',
      timestamp: new Date().toISOString()
    }, 503)
  }
})

// 视频下载API代理
app.post('/api/resolve', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/resolve'

  try {
    const body = await c.req.json()
    console.log('[Video API] 解析请求:', body.url?.substring(0, 50))

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://xiazaishipin.com/',
        'Origin': 'https://xiazaishipin.com',
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(body),
    })

    const responseData = await response.json()
    console.log('[Video API] 解析成功:', responseData.title)

    // 将thumbnail URL替换为代理URL
    if (responseData.thumbnail) {
      responseData.thumbnail = `/api/image-proxy?url=${encodeURIComponent(responseData.thumbnail)}`
    }

    return c.json(responseData, response.status as any)
  } catch (error) {
    console.error('[Video API] 错误:', error)
    return c.json({
      error: '视频解析失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 图片代理 - 绕过防盗链
app.get('/api/image-proxy', async (c) => {
  const imageUrl = c.req.query('url')

  if (!imageUrl) {
    return c.json({ error: 'Missing url parameter' }, 400)
  }

  try {
    console.log('[Image Proxy] 代理图片:', imageUrl.substring(0, 80))

    const response = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'image/jpeg'

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 缓存1天
      },
    })
  } catch (error) {
    console.error('[Image Proxy] 错误:', error)
    return c.json({
      error: 'Failed to proxy image',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// B站视频下载代理
app.post('/api/bilibili-download', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/bilibili-download'

  try {
    const body = await c.req.json()
    console.log('[Bilibili Download] 下载请求:', body.url?.substring(0, 50))

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://xiazaishipin.com/',
        'Origin': 'https://xiazaishipin.com',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(body),
    })

    console.log('[Bilibili Download] 下载响应:', response.status, response.headers.get('content-type'))

    // 检查响应类型
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // JSON响应 - 可能包含下载链接或错误信息
      const jsonData = await response.json()
      return c.json(jsonData)
    } else {
      // 视频文件响应 - 流式转发以支持前端进度显示
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      // 创建一个新的 ReadableStream 来转发数据
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                controller.close()
                break
              }
              controller.enqueue(value)
            }
          } catch (error) {
            console.error('[Bilibili Download] 流传输错误:', error)
            controller.error(error)
          } finally {
            reader.releaseLock()
          }
        }
      })

      return new Response(stream, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="video.mp4"`,
          'Content-Length': response.headers.get('Content-Length') || '',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (error) {
    console.error('[Bilibili Download] 错误:', error)
    return c.json({
      error: 'B站视频下载失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// 抖音和小红书视频下载代理
app.post('/api/proxy-download', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/proxy-download'

  try {
    const body = await c.req.json()
    console.log('[Douyin Download] 下载请求:', body.url?.substring(0, 50), 'filename:', body.filename)

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://xiazaishipin.com/',
        'Origin': 'https://xiazaishipin.com',
        'Accept': '*/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: JSON.stringify(body),
    })

    console.log('[Douyin Download] 下载响应:', response.status, response.headers.get('content-type'))

    // 检查响应类型
    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      // JSON响应 - 可能包含错误信息
      const jsonData = await response.json()
      return c.json(jsonData)
    } else {
      // 视频文件响应 - 流式转发以支持前端进度显示
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('无法获取响应流')
      }

      // 创建一个新的 ReadableStream 来转发数据
      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                controller.close()
                break
              }
              controller.enqueue(value)
            }
          } catch (error) {
            console.error('[Douyin Download] 流传输错误:', error)
            controller.error(error)
          } finally {
            reader.releaseLock()
          }
        }
      })

      return new Response(stream, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="${body.filename || 'video.mp4'}"`,
          'Content-Length': response.headers.get('Content-Length') || '',
          'Cache-Control': 'no-cache',
        },
      })
    }
  } catch (error) {
    console.error('[Douyin Download] 错误:', error)
    return c.json({
      error: '抖音视频下载失败',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
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
  // 排除 Goofish 路由和认证路由
  const goofishRoutes = ['/api/accounts', '/api/goods', '/api/messages', '/api/conversations', '/api/logs', '/api/autoreply', '/api/orders', '/api/autosell', '/api/workflows', '/api/status', '/api/auth', '/ws']
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
  const method = c.req.method

  // 添加调试日志
  console.log(`[Proxy] ${method} ${path}`)

  // 检查是否是 goofish 路由，如果是则跳过代理处理，让下一个处理程序处理
  const goofishRoutes = ['/api/accounts', '/api/goods', '/api/messages', '/api/conversations', '/api/logs', '/api/autoreply', '/api/orders', '/api/autosell', '/api/workflows', '/api/status', '/api/info', '/api/auth']
  for (const route of goofishRoutes) {
    if (path.startsWith(route)) {
      // 这是一个 goofish 路由，让下一个处理程序处理
      console.log(`[Proxy] Skipping goofish route: ${path}`)
      return next()
    }
  }

  const matched = matchProxyTarget(path)

  if (!matched) {
    console.log(`[Proxy] No proxy target found for: ${path}`)
    return c.json(
      {
        error: 'No proxy target found',
        availableEndpoints: Object.keys(PROXY_CONFIG),
        path: path,
      },
      404
    )
  }

  console.log(`[Proxy] Matched target for ${path}:`, matched.prefix, '->', matched.config.target)

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

    console.log(`[Proxy] Forwarding ${c.req.method} request to: ${targetUrl}`)
    if (body) {
      console.log(`[Proxy] Request body:`, new TextDecoder().decode(body))
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

    console.log(`[Proxy] Response status: ${response.status} ${response.statusText}`)

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
      '/api/auth/*',
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
