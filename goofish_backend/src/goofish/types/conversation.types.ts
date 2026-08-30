/**
 * 对话相关类型定义
 */

import type { ConversationMessage, MessageDirection } from "./message.types";

// 对话信息
export interface Conversation {
  accountId: string;
  accountNickname?: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastTime: number;
  unread: number;
  messageCount?: number;
  messages?: ConversationMessage[];
}

// 数据库对话记录
export interface DbConversation {
  account_id: string;
  chat_id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  last_message: string;
  last_time: number;
  unread: number;
}

// 数据库对话消息记录
export interface DbConversationMessage {
  id: number;
  account_id: string;
  chat_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  msg_time: string;
  msg_id: string | null;
  direction: MessageDirection;
  created_at: number;
}

// 创建/更新对话参数
export interface UpsertConversationParams {
  accountId: string;
  chatId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  lastMessage: string;
  lastTime: number;
  unread?: number;
}

// 添加对话消息参数
export interface AddConversationMessageParams {
  accountId: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  msgTime: string;
  msgId?: string;
  direction: MessageDirection;
}
