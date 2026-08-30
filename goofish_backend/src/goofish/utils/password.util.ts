/**
 * 密码加密工具
 * 使用 crypto-js 进行密码哈希
 */

import CryptoJS from 'crypto-js'

const SECRET_KEY = 'chattyplay-secret-key-2024'

/**
 * 对密码进行哈希加密
 * @param password 原始密码
 * @returns 加密后的密码
 */
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password + SECRET_KEY).toString()
}

/**
 * 验证密码
 * @param password 原始密码
 * @param hashedPassword 加密后的密码
 * @returns 是否匹配
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashed = hashPassword(password)
  return hashed === hashedPassword
}
