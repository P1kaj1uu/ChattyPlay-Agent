import { createLogger } from "../core/logger";
import {
  decryptSyncData,
  extractChatMessage,
  isOrderStatusMessage,
} from "./message.parser";
import { checkAutoReply, handleUserReply } from "../services/index";
import { addRawMessage } from "../api/routes/dev-messages.route";
import type { ChatMessage, MessageCallback } from "../types/index";
import type { GoofishClient } from "./client";

const logger = createLogger("Ws:Receiver");

export interface MessageReceiverContext {
  accountId: string;
  myId: string;
  client?: GoofishClient;
  onMessage?: MessageCallback;
  onAutoReply?: (
    chatId: string,
    senderId: string,
    content: string,
  ) => Promise<boolean | void>;
}

/**
 * 处理同步消息数据
 */
export async function handleSyncMessage(
  msgData: any,
  ctx: MessageReceiverContext,
): Promise<ChatMessage[]> {
  const { accountId, myId, onMessage, onAutoReply } = ctx;
  const body = msgData.body || {};
  let dataList: any[] = [];

  if (body.syncPushPackage?.data) {
    dataList = body.syncPushPackage.data;
    logger.debug(
      `[${accountId}] 从 syncPushPackage.data 获取到 ${dataList.length} 条数据`,
    );
  } else if (Array.isArray(body.data)) {
    dataList = body.data;
    logger.debug(
      `[${accountId}] 从 body.data 获取到 ${dataList.length} 条数据`,
    );
  } else if (Array.isArray(body)) {
    dataList = body;
    logger.debug(
      `[${accountId}] body 本身是数组，包含 ${dataList.length} 条数据`,
    );
  }

  if (dataList.length === 0) {
    logger.debug(`[${accountId}] 没有数据需要处理`);
    return [];
  }

  const messages: ChatMessage[] = [];

  for (const item of dataList) {
    const data = typeof item === "object" ? item.data || item : item;
    if (!data) {
      logger.debug(`[${accountId}] 跳过空数据项`);
      continue;
    }

    logger.debug(
      `[${accountId}] 尝试解密数据: ${typeof data === "string" ? data.substring(0, 50) + "..." : JSON.stringify(data).substring(0, 50) + "..."}`,
    );

    const message = decryptSyncData(data);
    if (!message) {
      logger.debug(`[${accountId}] 解密失败或非聊天消息`);
      continue;
    }

    const chatMsg = extractChatMessage(message, myId);
    if (!chatMsg) {
      logger.debug(`[${accountId}] 提取聊天消息失败`);
      continue;
    }

    logger.info(
      `[${accountId}] [${chatMsg.msgTime}] 收到消息 - 发送者: ${chatMsg.senderName}, chatId: ${chatMsg.chatId}, 内容: ${chatMsg.content}${chatMsg.orderId ? `, 订单ID: ${chatMsg.orderId}` : ""}`,
    );
    messages.push(chatMsg);

    // 订单状态消息不触发自动回复
    if (chatMsg.isOrderMessage) {
      logger.debug(`[${accountId}] 订单状态消息，跳过自动回复检查`);
    } else {
      // 先检查是否有等待中的工作流程需要继续执行
      if (ctx.client && chatMsg.chatId) {
        const workflowHandled = await handleUserReply(
          accountId,
          chatMsg.chatId,
          chatMsg.senderId,
          chatMsg.content,
          ctx.client,
        );
        if (workflowHandled) {
          logger.info(`[${accountId}] 用户回复已触发工作流程继续执行`);
        }
      }

      // 检查自动回复规则
      const autoReplyResult = await checkAutoReply(accountId, chatMsg);
      if (
        autoReplyResult.matched &&
        autoReplyResult.replyContent &&
        chatMsg.chatId &&
        onAutoReply
      ) {
        await onAutoReply(
          chatMsg.chatId,
          chatMsg.senderId,
          autoReplyResult.replyContent,
        );
      }
    }

    if (onMessage) {
      await onMessage(accountId, chatMsg);
    }
  }

  return messages;
}

/**
 * 处理 WebSocket 消息
 */
export async function processWebSocketMessage(
  msgData: any,
  ctx: MessageReceiverContext,
  sendAck: (headers: any) => void,
): Promise<void> {
  const { accountId } = ctx;

  try {
    const lwp = msgData.lwp || "";

    // 忽略响应消息
    if (msgData.code === 200) return;

    // 注册响应
    if (lwp === "/r") {
      const code = msgData.headers?.code;
      if (code === "200" || code === 200) {
        logger.info(`[${accountId}] WebSocket注册成功`);
      } else {
        logger.error(
          `[${accountId}] WebSocket注册失败: ${JSON.stringify(msgData)}`,
        );
      }
      return;
    }

    // 同步消息 - 添加到开发调试缓冲区
    if (lwp === "/s/sync" || lwp.toLowerCase().includes("/sync")) {
      logger.debug(`[${accountId}] 收到同步消息: ${lwp}`);
      addRawMessage(accountId, msgData);
      sendAck(msgData.headers);
      await handleSyncMessage(msgData, ctx);
      return;
    }

    // 推送消息 - 添加到开发调试缓冲区
    if (lwp === "/p") {
      logger.debug(`[${accountId}] 收到推送消息`);
      addRawMessage(accountId, msgData);
      sendAck(msgData.headers);
      if (msgData?.body?.syncPushPackage?.data?.length > 0 || msgData?.body) {
        await handleSyncMessage(msgData, ctx);
      }
      return;
    }

    // 其他消息类型
    if (lwp) {
      logger.debug(`[${accountId}] 收到其他消息类型: ${lwp}`);
    }
  } catch (e) {
    logger.error(`[${accountId}] 处理消息异常: ${e}`);
  }
}
