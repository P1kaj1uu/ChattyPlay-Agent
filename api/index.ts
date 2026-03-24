import { Hono } from 'hono'
import { cors } from 'hono/cors'
import CryptoJS from 'crypto-js'

const app = new Hono()

// CORS
app.use('/*', cors())

// ============ 认证相关常量 ============

const JWT_SECRET = 'chattyplay-jwt-secret-2024'
const PASSWORD_SECRET = 'chattyplay-secret-key-2024'
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7天

// Redis 配置
const REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL
const REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

// 用户计数器 key
const USER_COUNTER_KEY = 'user:id_counter'
// 用户 Hash key prefix
const USER_HASH_PREFIX = 'user:'
// 用户名索引 key
const USERNAME_INDEX_KEY = 'user:username_index'

// ============ Redis HTTP API 调用函数 ============

interface RedisResult {
  result?: any
  error?: string
}

async function redisCommand(command: string[]): Promise<RedisResult> {
  if (!REDIS_REST_URL || !REDIS_REST_TOKEN) {
    return { error: 'Redis 未配置' }
  }

  try {
    const response = await fetch(`${REDIS_REST_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REDIS_REST_TOKEN}`
      },
      body: JSON.stringify(command)
    })

    if (!response.ok) {
      return { error: `Redis 请求失败: ${response.status}` }
    }

    const data = await response.json()
    return { result: data.result }
  } catch (error) {
    return { error: `Redis 连接错误: ${error instanceof Error ? error.message : '未知错误'}` }
  }
}

// Redis 操作函数
async function getNextUserId(): Promise<number | null> {
  const { result, error } = await redisCommand(['INCR', USER_COUNTER_KEY])
  if (error || result === null) return null
  return result as number
}

async function getUserById(id: number): Promise<User | null> {
  const { result, error } = await redisCommand(['HGETALL', `${USER_HASH_PREFIX}${id}`])
  if (error || !result || result.length === 0) return null

  // HGETALL 返回 [key1, val1, key2, val2, ...] 格式
  const user: any = {}
  for (let i = 0; i < result.length; i += 2) {
    user[result[i]] = result[i + 1]
  }
  user.id = Number(user.id)
  return user as User
}

async function getUserByUsername(username: string): Promise<User | null> {
  // 从用户名索引获取用户 ID
  const { result: userId, error } = await redisCommand(['HGET', USERNAME_INDEX_KEY, username])
  if (error || !userId) return null
  return getUserById(Number(userId))
}

async function getUserByEmail(email: string): Promise<User | null> {
  // 扫描查找邮箱匹配的用户（较慢但可行）
  const { result: keys, error } = await redisCommand(['KEYS', `${USER_HASH_PREFIX}*`])
  if (error || !keys || keys.length === 0) return null

  for (const key of keys) {
    const { result: emailVal, error: emailError } = await redisCommand(['HGET', key, 'email'])
    if (!emailError && emailVal === email) {
      return getUserById(Number(key.replace(USER_HASH_PREFIX, '')))
    }
  }
  return null
}

async function createUser(user: User): Promise<void> {
  const { error } = await redisCommand([
    'HMSET',
    `${USER_HASH_PREFIX}${user.id}`,
    'id', String(user.id),
    'username', user.username,
    'password', user.password,
    'email', user.email || '',
    'created_at', user.created_at
  ])
  if (error) throw new Error(error)

  // 保存用户名索引
  await redisCommand(['HSET', USERNAME_INDEX_KEY, user.username, String(user.id)])
}

async function updateUserField(id: number, field: string, value: string): Promise<void> {
  await redisCommand(['HSET', `${USER_HASH_PREFIX}${id}`, field, value])
}

// ============ 数据类型定义 ============

interface User {
  id: number
  username: string
  password: string
  email?: string
  avatar?: string
  created_at: string
  last_login?: string
}

interface UserWithoutPassword {
  id: number
  username: string
  email?: string
  avatar?: string
  created_at: string
  last_login?: string
}

// ============ 密码工具函数 ============

function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + PASSWORD_SECRET).toString()
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashed = hashPassword(password)
  return hashed === hashedPassword
}

// ============ JWT Token 函数 ============

function generateToken(payload: { userId: number; username: string }): string {
  const tokenPayload = {
    ...payload,
    exp: Date.now() + TOKEN_EXPIRY
  }

  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload))
  const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET).toString()
  const encodedSignature = base64UrlEncode(signature)

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

function verifyToken(token: string): { userId: number; username: string } | null {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null
    }

    const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET).toString()
    const encodedSignatureCheck = base64UrlEncode(signature)

    if (encodedSignature !== encodedSignatureCheck) {
      return null
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as { userId: number; username: string; exp?: number }

    if (payload.exp && payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

function base64UrlEncode(str: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Utf8)
}

// ============ 认证路由 ============

/**
 * 用户注册
 * POST /api/auth/register
 */
app.post('/api/auth/register', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password, email } = body

    if (!username || !password) {
      return c.json({
        success: false,
        message: '用户名和密码不能为空'
      }, 400)
    }

    if (username.length < 3 || username.length > 20) {
      return c.json({
        success: false,
        message: '用户名长度必须在3-20个字符之间'
      }, 400)
    }

    if (password.length < 6 || password.length > 20) {
      return c.json({
        success: false,
        message: '密码长度必须在6-20个字符之间'
      }, 400)
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return c.json({
          success: false,
          message: '邮箱格式不正确'
        }, 400)
      }
    }

    // 检查用户名是否已存在
    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return c.json({
        success: false,
        message: '用户名已存在'
      }, 400)
    }

    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await getUserByEmail(email)
      if (existingEmail) {
        return c.json({
          success: false,
          message: '邮箱已被注册'
        }, 400)
      }
    }

    // 创建用户
    const userId = await getNextUserId()
    if (userId === null) {
      return c.json({
        success: false,
        message: '用户服务暂不可用，请检查 Redis 配置'
      }, 500)
    }

    const hashedPassword = hashPassword(password)
    const createdAt = new Date().toISOString()

    const newUser: User = {
      id: userId,
      username,
      password: hashedPassword,
      email,
      created_at: createdAt
    }

    await createUser(newUser)

    // 生成 token
    const token = generateToken({
      userId: newUser.id,
      username: newUser.username
    })

    const userWithoutPassword: UserWithoutPassword = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      created_at: newUser.created_at
    }

    return c.json({
      success: true,
      message: '注册成功',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('注册接口错误:', error)
    return c.json({
      success: false,
      message: '服务器错误'
    }, 500)
  }
})

/**
 * 用户登录
 * POST /api/auth/login
 */
app.post('/api/auth/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password } = body

    if (!username || !password) {
      return c.json({
        success: false,
        message: '用户名和密码不能为空'
      }, 400)
    }

    // 查找用户
    const user = await getUserByUsername(username)
    if (!user) {
      return c.json({
        success: false,
        message: '用户名或密码错误'
      }, 400)
    }

    // 验证密码
    const isPasswordValid = verifyPassword(password, user.password)
    if (!isPasswordValid) {
      return c.json({
        success: false,
        message: '用户名或密码错误'
      }, 400)
    }

    // 更新最后登录时间
    const lastLogin = new Date().toISOString()
    await updateUserField(user.id, 'last_login', lastLogin)

    // 生成 token
    const token = generateToken({
      userId: user.id,
      username: user.username
    })

    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      created_at: user.created_at,
      last_login: lastLogin
    }

    return c.json({
      success: true,
      message: '登录成功',
      token,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('登录接口错误:', error)
    return c.json({
      success: false,
      message: '服务器错误'
    }, 500)
  }
})

/**
 * 验证 token 并获取用户信息
 * GET /api/auth/me
 */
app.get('/api/auth/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return c.json({
        success: false,
        message: '未提供认证令牌'
      }, 401)
    }

    const payload = verifyToken(token)

    if (!payload) {
      return c.json({
        success: false,
        message: '无效的认证令牌'
      }, 401)
    }

    // 查找用户
    const user = await getUserById(payload.userId)
    if (!user) {
      return c.json({
        success: false,
        message: '用户不存在'
      }, 401)
    }

    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      created_at: user.created_at,
      last_login: user.last_login
    }

    return c.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('获取用户信息接口错误:', error)
    return c.json({
      success: false,
      message: '服务器错误'
    }, 500)
  }
})

// 简单的健康检查
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 视频下载代理端点
app.post('/api/resolve', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/resolve'
  const body = await c.req.json()

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

  if (responseData.thumbnail) {
    responseData.thumbnail = `/api/image-proxy?url=${encodeURIComponent(responseData.thumbnail)}`
  }

  return c.json(responseData, response.status as any)
})

// 图片代理 - 绕过防盗链
app.get('/api/image-proxy', async (c) => {
  const imageUrl = c.req.query('url')

  if (!imageUrl) {
    return c.json({ error: 'Missing url parameter' }, 400)
  }

  try {
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
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return c.json({
      error: 'Failed to proxy image',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// B站视频下载代理
app.post('/api/bilibili-download', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/bilibili-download'
  const body = await c.req.json()

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

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const jsonData = await response.json()
    return c.json(jsonData)
  } else {
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('无法获取响应流')
    }

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
})

// 抖音/其他视频下载代理
app.post('/api/proxy-download', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/proxy-download'
  const body = await c.req.json()

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

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const jsonData = await response.json()
    return c.json(jsonData)
  } else {
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('无法获取响应流')
    }

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
})

export default app
