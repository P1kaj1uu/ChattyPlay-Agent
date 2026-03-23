/**
 * ChattyPlay 用户数据访问层
 */

import { db } from './connection'
import { createLogger } from '../core/logger'

const logger = createLogger('Db:UserRepository')

export interface ChattyplayUser {
  id?: number
  username: string
  password: string
  email?: string
  avatar?: string
  created_at?: string
  updated_at?: string
  last_login?: string
}

export interface UserWithoutPassword {
  id: number
  username: string
  email?: string
  avatar?: string
  created_at?: string
  updated_at?: string
  last_login?: string
}

export class UserRepository {
  /**
   * 根据用户名查找用户
   */
  findByUsername(username: string): ChattyplayUser | undefined {
    try {
      const stmt = db.prepare('SELECT * FROM chattyplay_user WHERE username = ?')
      return stmt.get(username) as ChattyplayUser | undefined
    } catch (error) {
      // @ts-ignore
      logger.error('根据用户名查找用户失败:', error)
      throw error
    }
  }

  /**
   * 根据邮箱查找用户
   */
  findByEmail(email: string): ChattyplayUser | undefined {
    try {
      const stmt = db.prepare('SELECT * FROM chattyplay_user WHERE email = ?')
      return stmt.get(email) as ChattyplayUser | undefined
    } catch (error) {
      // @ts-ignore
      logger.error('根据邮箱查找用户失败:', error)
      throw error
    }
  }

  /**
   * 根据 ID 查找用户（不包含密码）
   */
  findById(id: number): UserWithoutPassword | undefined {
    try {
      const stmt = db.prepare('SELECT id, username, email, avatar, created_at, updated_at, last_login FROM chattyplay_user WHERE id = ?')
      return stmt.get(id) as UserWithoutPassword | undefined
    } catch (error) {
      // @ts-ignore
      logger.error('根据ID查找用户失败:', error)
      throw error
    }
  }

  /**
   * 创建新用户
   */
  create(user: Omit<ChattyplayUser, 'id' | 'created_at' | 'updated_at'>): number {
    try {
      const stmt = db.prepare(`
        INSERT INTO chattyplay_user (username, password, email, avatar)
        VALUES (?, ?, ?, ?)
      `)
      const result = stmt.run(user.username, user.password, user.email || null, user.avatar || null)
      logger.info(`创建用户成功: ${user.username}`)
      return result.lastInsertRowid as number
    } catch (error) {
      // @ts-ignore
      logger.error('创建用户失败:', error)
      throw error
    }
  }

  /**
   * 更新最后登录时间
   */
  updateLastLogin(userId: number): void {
    try {
      const stmt = db.prepare(`
        UPDATE chattyplay_user
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      stmt.run(userId)
    } catch (error) {
      // @ts-ignore
      logger.error('更新最后登录时间失败:', error)
      throw error
    }
  }

  /**
   * 更新用户头像
   */
  updateAvatar(userId: number, avatar: string): void {
    try {
      const stmt = db.prepare(`
        UPDATE chattyplay_user
        SET avatar = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      stmt.run(avatar, userId)
    } catch (error) {
      // @ts-ignore
      logger.error('更新用户头像失败:', error)
      throw error
    }
  }

  /**
   * 更新用户邮箱
   */
  updateEmail(userId: number, email: string): void {
    try {
      const stmt = db.prepare(`
        UPDATE chattyplay_user
        SET email = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `)
      stmt.run(email, userId)
    } catch (error) {
      // @ts-ignore
      logger.error('更新用户邮箱失败:', error)
      throw error
    }
  }
}

export const userRepository = new UserRepository()
