/**
 * 用户认证服务
 */

import { userRepository, ChattyplayUser, UserWithoutPassword } from '../db/user.repository'
import { hashPassword, verifyPassword } from '../utils/password.util'
import { generateToken, verifyToken, TokenPayload } from '../utils/jwt.util'
import { createLogger } from '../core/logger'

const logger = createLogger('AuthService')

export interface RegisterData {
  username: string
  password: string
  email?: string
}

export interface LoginData {
  username: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  token?: string
  user?: UserWithoutPassword
}

/**
 * 用户注册
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  try {
    // 验证用户名长度
    if (data.username.length < 3 || data.username.length > 20) {
      return {
        success: false,
        message: '用户名长度必须在3-20个字符之间'
      }
    }

    // 验证密码长度
    if (data.password.length < 6 || data.password.length > 20) {
      return {
        success: false,
        message: '密码长度必须在6-20个字符之间'
      }
    }

    // 验证邮箱格式（如果提供）
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        return {
          success: false,
          message: '邮箱格式不正确'
        }
      }
    }

    // 检查用户名是否已存在
    const existingUser = userRepository.findByUsername(data.username)
    if (existingUser) {
      return {
        success: false,
        message: '用户名已存在'
      }
    }

    // 检查邮箱是否已存在（如果提供）
    if (data.email) {
      const existingEmail = userRepository.findByEmail(data.email)
      if (existingEmail) {
        return {
          success: false,
          message: '邮箱已被注册'
        }
      }
    }

    // 加密密码
    const hashedPassword = hashPassword(data.password)

    // 创建用户
    const userId = userRepository.create({
      username: data.username,
      password: hashedPassword,
      email: data.email
    })

    // 获取用户信息（不包含密码）
    const user = userRepository.findById(userId)
    if (!user) {
      return {
        success: false,
        message: '创建用户失败'
      }
    }

    // 生成 token
    const token = generateToken({
      userId: user.id,
      username: user.username
    })

    logger.info(`用户注册成功: ${data.username}`)

    return {
      success: true,
      message: '注册成功',
      token,
      user
    }
  } catch (error) {
    // @ts-ignore
    logger.error('注册失败:', error)
    return {
      success: false,
      message: '注册失败，请稍后重试'
    }
  }
}

/**
 * 用户登录
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    // 查找用户
    const user = userRepository.findByUsername(data.username)
    if (!user) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 验证密码
    const isPasswordValid = verifyPassword(data.password, user.password)
    if (!isPasswordValid) {
      return {
        success: false,
        message: '用户名或密码错误'
      }
    }

    // 更新最后登录时间
    userRepository.updateLastLogin(user.id!)

    // 获取用户信息（不包含密码）
    const userWithoutPassword = userRepository.findById(user.id!)
    if (!userWithoutPassword) {
      return {
        success: false,
        message: '登录失败'
      }
    }

    // 生成 token
    const token = generateToken({
      userId: userWithoutPassword.id,
      username: userWithoutPassword.username
    })

    logger.info(`用户登录成功: ${data.username}`)

    return {
      success: true,
      message: '登录成功',
      token,
      user: userWithoutPassword
    }
  } catch (error) {
    // @ts-ignore
    logger.error('登录失败:', error)
    return {
      success: false,
      message: '登录失败，请稍后重试'
    }
  }
}

/**
 * 验证 token
 */
export function authenticateToken(token: string): TokenPayload | null {
  return verifyToken(token)
}

/**
 * 根据 token 获取用户信息
 */
export function getUserByToken(token: string): UserWithoutPassword | null {
  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  const user = userRepository.findById(payload.userId)
  return user || null
}
