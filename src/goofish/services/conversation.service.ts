/**
 * 对话服务
 * 处理对话相关的业务逻辑
 */

import {
  getConversations,
  getConversation,
  upsertConversation,
  updateConversationAvatar,
  markConversationRead,
  getConversationMessages,
  getConversationMessageCount,
  addConversationMessage,
  getConversationCount,
  getAccount,
} from "../db/index";
import type {
  ChatMessage,
  Conversation,
  ConversationMessage,
} from "../types/index";

/**
 * 添加收到的消息
 */
export function addIncomingMessage(accountId: string, msg: ChatMessage) {
  const timestamp = Date.now();

  // 先更新对话，不触发事件
  upsertConversation(
    {
      accountId,
      chatId: msg.chatId,
      userId: msg.senderId,
      userName: msg.senderName,
      lastMessage: msg.content,
      lastTime: timestamp,
      unread: 1,
    },
    false,
  );

  // 添加消息，触发事件
  addConversationMessage({
    accountId,
    chatId: msg.chatId,
    senderId: msg.senderId,
    senderName: msg.senderName,
    content: msg.content,
    msgTime: msg.msgTime,
    msgId: msg.msgId,
    direction: "in",
  });
}

/**
 * 添加发出的消息
 */
export function addOutgoingMessage(
  accountId: string,
  chatId: string,
  toUserId: string,
  content: string,
) {
  const timestamp = Date.now();
  const conv = getConversation(accountId, chatId);
  if (!conv) return;

  const account = getAccount(accountId);
  const senderName = account?.nickname || "我";

  // 先更新对话，不触发事件
  upsertConversation(
    {
      accountId,
      chatId,
      userId: conv.user_id,
      userName: conv.user_name,
      lastMessage: content,
      lastTime: timestamp,
      unread: 0,
    },
    false,
  );

  // 添加消息，触发事件
  addConversationMessage({
    accountId,
    chatId,
    senderId: accountId,
    senderName,
    content,
    msgTime: new Date().toLocaleString("zh-CN", { hour12: false }),
    direction: "out",
  });
}

/**
 * 更新用户头像
 */
export function updateUserAvatar(
  accountId: string,
  chatId: string,
  avatar: string,
) {
  updateConversationAvatar(accountId, chatId, avatar);
}

/**
 * 获取所有对话列表
 */
export function getAllConversations(
  limit = 20,
  offset = 0,
): { conversations: Conversation[]; total: number } {
  const dbConvs = getConversations(limit, offset);
  const total = getConversationCount();

  const conversations = dbConvs.map((c) => {
    const account = getAccount(c.account_id);
    return {
      accountId: c.account_id,
      accountNickname: account?.nickname || c.account_id,
      chatId: c.chat_id,
      userId: c.user_id,
      userName: c.user_name,
      userAvatar: c.user_avatar || undefined,
      lastMessage: c.last_message,
      lastTime: c.last_time,
      unread: c.unread,
      messageCount: getConversationMessageCount(c.account_id, c.chat_id),
    };
  });

  return { conversations, total };
}

/**
 * 获取单个对话详情
 */
export function getConversationDetail(
  accountId: string,
  chatId: string,
  messageLimit = 50,
  beforeId?: number,
): Conversation | undefined {
  const conv = getConversation(accountId, chatId);
  if (!conv) return undefined;

  const account = getAccount(accountId);
  const dbMsgs = getConversationMessages(
    accountId,
    chatId,
    messageLimit,
    beforeId,
  );

  const messages: ConversationMessage[] = dbMsgs.map((m) => ({
    id: m.id,
    senderId: m.sender_id,
    senderName: m.sender_name,
    content: m.content,
    msgTime: m.msg_time,
    msgId: m.msg_id || undefined,
    timestamp: m.created_at,
    direction: m.direction,
  }));

  return {
    accountId: conv.account_id,
    accountNickname: account?.nickname || conv.account_id,
    chatId: conv.chat_id,
    userId: conv.user_id,
    userName: conv.user_name,
    userAvatar: conv.user_avatar || undefined,
    lastMessage: conv.last_message,
    lastTime: conv.last_time,
    unread: conv.unread,
    messageCount: getConversationMessageCount(accountId, chatId),
    messages,
  };
}

/**
 * 标记对话已读
 */
export function markAsRead(accountId: string, chatId: string) {
  markConversationRead(accountId, chatId);
}
