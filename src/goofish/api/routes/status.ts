import { Hono } from "hono";
import { messageStore } from "../stores/message.store";
import { getAllMessagesCount } from "../../db/conversation.repository";
import type { ClientManager } from "../../websocket/client.manager";

export function createStatusRoutes(
  getClientManager: () => ClientManager | null,
) {
  const router = new Hono();

  // 健康检查
  router.get("/health", (c) => {
    return c.json({ status: "ok", timestamp: Date.now() });
  });

  // 获取整体状态
  router.get("/status", (c) => {
    const clientManager = getClientManager();
    if (!clientManager) {
      return c.json({ error: "ClientManager not initialized" }, 500);
    }
    return c.json({
      clients: clientManager.getStatus(),
      activeCount: clientManager.getActiveCount(),
      messageCount: getAllMessagesCount(),
    });
  });

  return router;
}
