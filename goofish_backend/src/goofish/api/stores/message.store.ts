/**
 * 消息存储（兼容层）
 * 委托给 message.service 处理
 */

import {
  addMessage,
  getRecentMessages,
  getAllMessages,
  getMessageCount,
  clearMessages,
} from "../../services/index";
import type { StoredMessage, ChatMessage } from "../../types/index";

class MessageStore {
  add(msg: ChatMessage) {
    addMessage(msg);
  }

  getRecent(limit = 20): StoredMessage[] {
    return getRecentMessages(limit);
  }

  getAll(): StoredMessage[] {
    return getAllMessages();
  }

  count(): number {
    return getMessageCount();
  }

  clear() {
    clearMessages();
  }
}

export const messageStore = new MessageStore();
