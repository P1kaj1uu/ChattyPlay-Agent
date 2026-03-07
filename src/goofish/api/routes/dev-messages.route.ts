import { Hono } from "hono";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  unlinkSync,
  statSync,
} from "fs";
import { join } from "path";

import { createLogger } from "../../core/logger";
import { decryptMessagePack } from "../../utils/msgpack";

const logger = createLogger("Api:DevMsg");

// raw 日志目录
const RAW_LOG_DIR = join(process.cwd(), "logs", "raw");
const RAW_RETENTION_DAYS = 3;

// 存储原始消息的缓冲区
interface RawMessage {
  accountId: string;
  timestamp: string;
  lwp: string;
  data: any;
  decoded: any[] | null;
}

const messageBuffer: RawMessage[] = [];
const MAX_BUFFER_SIZE = 500;

// 解码消息数据
function decodeMessageData(msgData: any): any[] | null {
  try {
    const body = msgData.body || {};
    let dataList: any[] = [];

    if (body.syncPushPackage?.data) {
      dataList = body.syncPushPackage.data;
    } else if (Array.isArray(body.data)) {
      dataList = body.data;
    } else if (Array.isArray(body)) {
      dataList = body;
    }

    if (dataList.length === 0) return null;

    const decoded: any[] = [];
    for (const item of dataList) {
      const data = typeof item === "object" ? item.data || item : item;
      if (!data) continue;

      try {
        const result = decryptMessagePack(data);
        if (result) {
          decoded.push(result);
        }
      } catch {
        // 尝试 base64 + JSON
        try {
          const str = Buffer.from(data, "base64").toString("utf-8");
          const parsed = JSON.parse(str);
          decoded.push(parsed);
        } catch {
          decoded.push({ raw: data });
        }
      }
    }

    return decoded.length > 0 ? decoded : null;
  } catch {
    return null;
  }
}

// 保存原始消息到文件
function saveRawToFile(accountId: string, data: any, decoded: any[] | null) {
  try {
    // 确保目录存在
    if (!existsSync(RAW_LOG_DIR)) {
      mkdirSync(RAW_LOG_DIR, { recursive: true });
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, ""); // HHMMSS
    const ms = now.getMilliseconds().toString().padStart(3, "0");
    const filename = `${dateStr}_${timeStr}_${ms}_${accountId}.json`;
    const filepath = join(RAW_LOG_DIR, filename);

    // 保存原始数据和解码后的数据
    const content = {
      accountId,
      timestamp: now.toISOString(),
      raw: data,
      decoded,
    };

    writeFileSync(filepath, JSON.stringify(content, null, 2), "utf-8");
  } catch (e) {
    logger.debug(`保存原始消息到文件失败: ${e}`);
  }
}

// 添加原始消息到缓冲区
export function addRawMessage(accountId: string, data: any) {
  const decoded = decodeMessageData(data);

  // 保存到文件（包含解码后的数据）
  saveRawToFile(accountId, data, decoded);

  const msg: RawMessage = {
    accountId,
    timestamp: new Date().toISOString(),
    lwp: data.lwp || "",
    data,
    decoded,
  };
  messageBuffer.unshift(msg);

  if (messageBuffer.length > MAX_BUFFER_SIZE) {
    messageBuffer.pop();
  }
}

// 清空缓冲区
export function clearMessageBuffer() {
  messageBuffer.length = 0;
}

// 清理过期的原始消息文件
export function cleanOldRawMessages() {
  try {
    if (!existsSync(RAW_LOG_DIR)) return;

    const now = Date.now();
    const maxAge = RAW_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const files = readdirSync(RAW_LOG_DIR);
    let cleanedCount = 0;

    for (const file of files) {
      if (!file.endsWith(".json")) continue;

      const filepath = join(RAW_LOG_DIR, file);
      try {
        const stat = statSync(filepath);
        if (now - stat.mtimeMs > maxAge) {
          unlinkSync(filepath);
          cleanedCount++;
        }
      } catch {
        // 忽略单个文件错误
      }
    }

    if (cleanedCount > 0) {
      logger.info(`清理了 ${cleanedCount} 个过期的原始消息文件`);
    }
  } catch (e) {
    logger.debug(`清理原始消息文件失败: ${e}`);
  }
}

// 启动时清理一次，之后每小时清理
cleanOldRawMessages();
setInterval(cleanOldRawMessages, 60 * 60 * 1000);

export function createDevMessageRoutes() {
  const router = new Hono();

  // 获取所有原始消息
  router.get("/", (c) => {
    const accountId = c.req.query("accountId");
    const limit = parseInt(c.req.query("limit") || "100");

    let messages = messageBuffer;

    if (accountId) {
      messages = messages.filter((m) => m.accountId === accountId);
    }

    return c.json({
      total: messages.length,
      messages: messages.slice(0, limit),
    });
  });

  // 获取指定账号的原始消息
  router.get("/:accountId", (c) => {
    const accountId = c.req.param("accountId");
    const limit = parseInt(c.req.query("limit") || "100");

    const messages = messageBuffer.filter((m) => m.accountId === accountId);

    return c.json({
      accountId,
      total: messages.length,
      messages: messages.slice(0, limit),
    });
  });

  // 清空消息缓冲区
  router.delete("/", (c) => {
    clearMessageBuffer();
    logger.info("消息缓冲区已清空");
    return c.json({ success: true });
  });

  // SSE 实时推送消息
  router.get("/stream", async (c) => {
    const accountId = c.req.query("accountId");

    c.header("Content-Type", "text/event-stream");
    c.header("Cache-Control", "no-cache");
    c.header("Connection", "keep-alive");

    let lastIndex = 0;

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "connected", accountId: accountId || "all" })}\n\n`,
          ),
        );

        const interval = setInterval(() => {
          const currentLength = messageBuffer.length;

          if (currentLength > lastIndex) {
            const newMessages = messageBuffer.slice(
              0,
              currentLength - lastIndex,
            );

            for (const msg of newMessages.reverse()) {
              if (!accountId || msg.accountId === accountId) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(msg)}\n\n`),
                );
              }
            }

            lastIndex = currentLength;
          }
        }, 500);

        setTimeout(() => {
          clearInterval(interval);
          controller.close();
        }, 30000);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  });

  return router;
}
