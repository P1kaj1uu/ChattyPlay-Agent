import WebSocket from "ws";
import { createLogger } from "../core/logger";
import { generateMid, generateUuid } from "../utils/crypto";
import { conversationStore } from "../api/stores/conversation.store";

const logger = createLogger("Ws:Sender");

export interface SendMessageOptions {
  accountId: string;
  myId: string;
  ws: WebSocket;
  chatId: string;
  toUserId: string;
  text: string;
}

/**
 * 发送消息到指定用户
 */
export async function sendMessage(
  options: SendMessageOptions,
): Promise<boolean> {
  const { accountId, myId, ws, chatId, toUserId, text } = options;

  if (!ws || ws.readyState !== WebSocket.OPEN) {
    logger.error(`[${accountId}] WebSocket未连接，无法发送消息`);
    return false;
  }

  try {
    const textContent = { contentType: 1, text: { text } };
    const textBase64 = Buffer.from(JSON.stringify(textContent)).toString(
      "base64",
    );

    const msg = {
      lwp: "/r/MessageSend/sendByReceiverScope",
      headers: { mid: generateMid() },
      body: [
        {
          uuid: generateUuid(),
          cid: `${chatId}@goofish`,
          conversationType: 1,
          content: { contentType: 101, custom: { type: 1, data: textBase64 } },
          redPointPolicy: 0,
          extension: { extJson: "{}" },
          ctx: { appVersion: "1.0", platform: "web" },
          mtags: {},
          msgReadStatusSetting: 1,
        },
        { actualReceivers: [`${toUserId}@goofish`, `${myId}@goofish`] },
      ],
    };

    ws.send(JSON.stringify(msg));
    logger.info(`[${accountId}] 消息已发送到 ${toUserId}: ${text}`);

    // 记录发出的消息
    conversationStore.addOutgoing(accountId, chatId, toUserId, text);

    return true;
  } catch (e) {
    logger.error(`[${accountId}] 发送消息失败: ${e}`);
    return false;
  }
}
