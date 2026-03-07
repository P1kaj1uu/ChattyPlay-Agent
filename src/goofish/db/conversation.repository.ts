/**
 * 对话数据仓库
 */

import { db } from "./connection";
import { emitConversationsUpdated } from "../core/event-emitter";
import type {
  DbConversation,
  DbConversationMessage,
  UpsertConversationParams,
  AddConversationMessageParams,
} from "../types/index";

// 获取对话列表（分页）
export function getConversations(limit = 20, offset = 0): DbConversation[] {
  const stmt = db.prepare(`
        SELECT account_id, chat_id, user_id, user_name, user_avatar, last_message, last_time, unread
        FROM conversations ORDER BY last_time DESC LIMIT ? OFFSET ?
    `);
  return stmt.all(limit, offset) as DbConversation[];
}

// 获取对话总数
export function getConversationCount(): number {
  const stmt = db.prepare("SELECT COUNT(*) as count FROM conversations");
  return (stmt.get() as { count: number }).count;
}

// 获取单个对话
export function getConversation(
  accountId: string,
  chatId: string,
): DbConversation | undefined {
  const stmt = db.prepare(
    "SELECT * FROM conversations WHERE account_id = ? AND chat_id = ?",
  );
  return stmt.get(accountId, chatId) as DbConversation | undefined;
}

// 创建或更新对话（不触发事件，由调用方统一触发）
export function upsertConversation(
  conv: UpsertConversationParams,
  emitEvent = true,
) {
  const existing = getConversation(conv.accountId, conv.chatId);
  if (existing) {
    const stmt = db.prepare(`
            UPDATE conversations SET
                user_name = ?, user_avatar = COALESCE(?, user_avatar),
                last_message = ?, last_time = ?, unread = unread + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE account_id = ? AND chat_id = ?
        `);
    stmt.run(
      conv.userName,
      conv.userAvatar,
      conv.lastMessage,
      conv.lastTime,
      conv.unread || 0,
      conv.accountId,
      conv.chatId,
    );
  } else {
    const stmt = db.prepare(`
            INSERT INTO conversations (account_id, chat_id, user_id, user_name, user_avatar, last_message, last_time, unread)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
    stmt.run(
      conv.accountId,
      conv.chatId,
      conv.userId,
      conv.userName,
      conv.userAvatar || null,
      conv.lastMessage,
      conv.lastTime,
      conv.unread || 0,
    );
  }
  if (emitEvent) {
    emitConversationsUpdated();
  }
}

// 更新用户头像
export function updateConversationAvatar(
  accountId: string,
  chatId: string,
  avatar: string,
) {
  const stmt = db.prepare(
    "UPDATE conversations SET user_avatar = ? WHERE account_id = ? AND chat_id = ?",
  );
  stmt.run(avatar, accountId, chatId);
}

// 标记已读
export function markConversationRead(accountId: string, chatId: string) {
  const stmt = db.prepare(
    "UPDATE conversations SET unread = 0 WHERE account_id = ? AND chat_id = ?",
  );
  stmt.run(accountId, chatId);
  emitConversationsUpdated();
}

// 获取对话消息（分页）
export function getConversationMessages(
  accountId: string,
  chatId: string,
  limit = 50,
  beforeId?: number,
): DbConversationMessage[] {
  if (beforeId) {
    const stmt = db.prepare(`
            SELECT * FROM conversation_messages
            WHERE account_id = ? AND chat_id = ? AND id < ?
            ORDER BY created_at DESC LIMIT ?
        `);
    return (
      stmt.all(accountId, chatId, beforeId, limit) as DbConversationMessage[]
    ).reverse();
  }
  const stmt = db.prepare(`
        SELECT * FROM conversation_messages
        WHERE account_id = ? AND chat_id = ?
        ORDER BY created_at DESC LIMIT ?
    `);
  return (
    stmt.all(accountId, chatId, limit) as DbConversationMessage[]
  ).reverse();
}

// 获取对话消息总数
export function getConversationMessageCount(
  accountId: string,
  chatId: string,
): number {
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM conversation_messages WHERE account_id = ? AND chat_id = ?",
  );
  return (stmt.get(accountId, chatId) as { count: number }).count;
}

// 获取所有消息总数
export function getAllMessagesCount(): number {
  const stmt = db.prepare(
    "SELECT COUNT(*) as count FROM conversation_messages",
  );
  return (stmt.get() as { count: number }).count;
}

// 添加消息
export function addConversationMessage(
  msg: AddConversationMessageParams,
): number {
  const stmt = db.prepare(`
        INSERT INTO conversation_messages (account_id, chat_id, sender_id, sender_name, content, msg_time, msg_id, direction, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  const result = stmt.run(
    msg.accountId,
    msg.chatId,
    msg.senderId,
    msg.senderName,
    msg.content,
    msg.msgTime,
    msg.msgId || null,
    msg.direction,
    Date.now(),
  );
  emitConversationsUpdated();
  return result.lastInsertRowid as number;
}
