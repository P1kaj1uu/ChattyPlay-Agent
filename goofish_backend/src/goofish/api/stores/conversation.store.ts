/**
 * 对话存储（兼容层）
 * 委托给 conversation.service 处理
 */

import {
  addIncomingMessage,
  addOutgoingMessage,
  updateUserAvatar as updateAvatar,
  getAllConversations,
  getConversationDetail,
  markAsRead,
} from "../../services/index";
import type { ChatMessage, Conversation } from "../../types/index";

class ConversationStore {
  addIncoming(accountId: string, msg: ChatMessage) {
    addIncomingMessage(accountId, msg);
  }

  addOutgoing(
    accountId: string,
    chatId: string,
    toUserId: string,
    content: string,
  ) {
    addOutgoingMessage(accountId, chatId, toUserId, content);
  }

  updateUserAvatar(accountId: string, chatId: string, avatar: string) {
    updateAvatar(accountId, chatId, avatar);
  }

  getAll(
    limit = 20,
    offset = 0,
  ): { conversations: Conversation[]; total: number } {
    return getAllConversations(limit, offset);
  }

  get(
    accountId: string,
    chatId: string,
    messageLimit = 50,
    beforeId?: number,
  ): Conversation | undefined {
    return getConversationDetail(accountId, chatId, messageLimit, beforeId);
  }

  markRead(accountId: string, chatId: string) {
    markAsRead(accountId, chatId);
  }
}

export const conversationStore = new ConversationStore();
