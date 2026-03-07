import { Hono } from "hono";
import { messageStore } from "../stores/message.store";
import type { ClientManager } from "../../websocket/client.manager";

export function createMessageRoutes(
  getClientManager: () => ClientManager | null,
) {
  const router = new Hono();

  // 获取消息列表
  router.get("/", (c) => {
    const limit = parseInt(c.req.query("limit") || "20");
    return c.json({
      messages: messageStore.getRecent(limit),
      total: messageStore.count(),
    });
  });

  // 发送消息
  router.post("/send", async (c) => {
    const clientManager = getClientManager();
    if (!clientManager) {
      return c.json({ error: "ClientManager not initialized" }, 500);
    }
    const body = await c.req.json();
    const { accountId, chatId, toUserId, text } = body;
    if (!accountId || !chatId || !toUserId || !text) {
      return c.json(
        { error: "Missing accountId, chatId, toUserId or text" },
        400,
      );
    }
    const client = clientManager.getClient(accountId);
    if (!client) {
      return c.json({ error: "Account not connected" }, 400);
    }
    const success = await client.sendMessage(chatId, toUserId, text);
    return c.json({ success });
  });

  return router;
}
