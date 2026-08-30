/**
 * 用户认证路由
 */

import { Hono } from 'hono'
import { register, login, getUserByToken } from '../../services/auth.service'
import { createLogger } from '../../core/logger'
import { verifyTurnstileToken } from '../../../services/turnstile'

const logger = createLogger('AuthRoute')
const authRoute = new Hono()

/**
 * 用户注册
 * POST /api/auth/register
 */
authRoute.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password, email, 'cf-turnstile-response': turnstileToken } = body

    const isDev = process.env.NODE_ENV !== 'production'

    // 验证 Turnstile token（开发环境跳过）
    if (turnstileToken && !isDev) {
      const verifyResult = await verifyTurnstileToken(turnstileToken)
      if (!verifyResult.success) {
        return c.json({
          success: false,
          message: `人机验证失败: ${verifyResult.error}`,
        }, 403)
      }
    }

    if (!username || !password) {
      return c.json({
        success: false,
        message: '用户名和密码不能为空'
      }, 400)
    }

    const result = await register({ username, password, email })

    if (result.success) {
      return c.json(result)
    } else {
      return c.json(result, 400)
    }
  } catch (error) {
    // @ts-ignore
    logger.error('注册接口错误:', error)
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
authRoute.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const { username, password, 'cf-turnstile-response': turnstileToken } = body

    const isDev = process.env.NODE_ENV !== 'production'

    // 验证 Turnstile token（开发环境跳过）
    if (turnstileToken && !isDev) {
      const verifyResult = await verifyTurnstileToken(turnstileToken)
      if (!verifyResult.success) {
        return c.json({
          success: false,
          message: `人机验证失败: ${verifyResult.error}`,
        }, 403)
      }
    }

    if (!username || !password) {
      return c.json({
        success: false,
        message: '用户名和密码不能为空'
      }, 400)
    }

    const result = await login({ username, password })

    if (result.success) {
      return c.json(result)
    } else {
      return c.json(result, 400)
    }
  } catch (error) {
    // @ts-ignore
    logger.error('登录接口错误:', error)
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
authRoute.get('/me', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return c.json({
        success: false,
        message: '未提供认证令牌'
      }, 401)
    }

    const user = getUserByToken(token)

    if (!user) {
      return c.json({
        success: false,
        message: '无效的认证令牌'
      }, 401)
    }

    return c.json({
      success: true,
      user
    })
  } catch (error) {
    // @ts-ignore
    logger.error('获取用户信息接口错误:', error)
    return c.json({
      success: false,
      message: '服务器错误'
    }, 500)
  }
})

export { authRoute }
