/**
 * 消息服务
 * 处理消息存储和查询
 */

import type { StoredMessage, ChatMessage } from "../types/index";

const MAX_MESSAGES = 100;

// 内存消息存储
const messages: StoredMessage[] = [];

/**
 * 添加消息
 */
export function addMessage(msg: ChatMessage) {
  const stored: StoredMessage = { ...msg, timestamp: Date.now() };
  messages.push(stored);

  if (messages.length > MAX_MESSAGES) {
    messages.splice(0, messages.length - MAX_MESSAGES);
  }
}

/**
 * 获取最近消息
 */
export function getRecentMessages(limit = 20): StoredMessage[] {
  return messages.slice(-limit);
}

/**
 * 获取所有消息
 */
export function getAllMessages(): StoredMessage[] {
  return [...messages];
}

/**
 * 获取消息数量
 */
export function getMessageCount(): number {
  return messages.length;
}

/**
 * 清空消息
 */
export function clearMessages() {
  messages.length = 0;
}
