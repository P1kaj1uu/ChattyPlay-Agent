/**
 * AI 聊天历史工具
 * 获取当前会话的历史消息作为上下文
 */

import { db } from '../db/connection'

export interface ChatHistoryContext {
  accountId: string
  chatId: string
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant'
  content: string
  time: string
}

/**
 * 获取会话历史消息
 * 返回最近的消息，按时间正序排列
 */
export function getChatHistory(ctx: ChatHistoryContext, limit = 10): ChatHistoryMessage[] {
  const { accountId, chatId } = ctx
  
  if (!accountId || !chatId) {
    return []
  }

  try {
    const rows = db.prepare(`
            SELECT content, direction, msg_time
            FROM conversation_messages
            WHERE account_id = ? AND chat_id = ?
            ORDER BY created_at DESC
            LIMIT ?
        `).all(accountId, chatId, limit) as any[]

        // 反转为时间正序
        return rows.reverse().map(row => ({
            role: row.direction === 'in' ? 'user' as const : 'assistant' as const,
            content: row.content,
            time: row.msg_time
        }))
      } catch {
        return []
    }
}
