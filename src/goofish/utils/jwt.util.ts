/**
 * JWT 工具
 * 简单的 token 生成和验证
 */

import CryptoJS from 'crypto-js'

const JWT_SECRET = 'chattyplay-jwt-secret-2024'
const TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7天

export interface TokenPayload {
  userId: number
  username: string
  exp?: number
}

/**
 * 生成 JWT token
 */
export function generateToken(payload: Omit<TokenPayload, 'exp'>): string {
  const tokenPayload: TokenPayload = {
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

/**
 * 验证 JWT token
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null
    }

    // 验证签名
    const signature = CryptoJS.HmacSHA256(`${encodedHeader}.${encodedPayload}`, JWT_SECRET).toString()
    const encodedSignatureCheck = base64UrlEncode(signature)

    if (encodedSignature !== encodedSignatureCheck) {
      return null
    }

    // 解析 payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as TokenPayload

    // 检查过期时间
    if (payload.exp && payload.exp < Date.now()) {
      return null
    }

    return payload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Base64 URL 编码
 */
function base64UrlEncode(str: string): string {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(str))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Base64 URL 解码
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4) {
    base64 += '='
  }
  return CryptoJS.enc.Base64.parse(base64).toString(CryptoJS.enc.Utf8)
}
