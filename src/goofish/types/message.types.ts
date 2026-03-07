/**
 * 消息相关类型定义
 */

// 聊天消息
export interface ChatMessage {
  senderId: string;
  senderName: string;
  msgTime: string;
  content: string;
  chatId: string;
  msgId?: string;
  raw: unknown;
  // 订单相关信息
  orderId?: string;
  orderStatus?: string;
  isOrderMessage?: boolean;
}

// 存储的消息（带时间戳）
export interface StoredMessage extends ChatMessage {
  timestamp: number;
}

// 消息方向
export type MessageDirection = "in" | "out";

// 对话消息
export interface ConversationMessage {
  id: number;
  senderId: string;
  senderName: string;
  content: string;
  msgTime: string;
  msgId?: string;
  timestamp: number;
  direction: MessageDirection;
}

// 消息回调
export type MessageCallback = (
  accountId: string,
  msg: ChatMessage,
) => void | Promise<void>;
