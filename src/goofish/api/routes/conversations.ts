import { Hono } from "hono";

import { conversationStore } from "../stores/conversation.store";
import { fetchUserHead } from "../../services/index";
import { getAccount } from "../../db/index";

export function createConversationRoutes() {
  const router = new Hono();

  // 获取对话列表（分页）
  router.get("/", (c) => {
    const limit = parseInt(c.req.query("limit") || "20");
    const offset = parseInt(c.req.query("offset") || "0");
    const { conversations, total } = conversationStore.getAll(limit, offset);
    return c.json({ conversations, total, limit, offset });
  });

  // 获取单个对话详情（只需要 chatId）
  router.get("/:chatId", (c) => {
    const chatId = c.req.param("chatId");
    const limit = parseInt(c.req.query("limit") || "50");
    const beforeId = c.req.query("beforeId")
      ? parseInt(c.req.query("beforeId")!)
      : undefined;

    // 尝试从所有账号中查找对话
    const { conversations } = conversationStore.getAll(1000, 0); // 获取最多1000个对话
    const conv = conversations.find((c) => c.chatId === chatId);

    if (!conv) {
      return c.json({ error: "Conversation not found" }, 404);
    }

    // 使用找到的 accountId 获取完整对话详情
    const fullConv = conversationStore.get(
      conv.accountId,
      chatId,
      limit,
      beforeId,
    );
    if (!fullConv) {
      return c.json({ error: "Conversation details not found" }, 404);
    }

    return c.json(fullConv);
  });

  // 获取单个对话详情（分页消息）
  // 路径格式: /:accountId/:chatId
  router.get("/:accountId/:chatId", (c) => {
    const accountId = c.req.param("accountId");
    const chatId = c.req.param("chatId");
    const limit = parseInt(c.req.query("limit") || "50");
    const beforeId = c.req.query("beforeId")
      ? parseInt(c.req.query("beforeId")!)
      : undefined;
    const conv = conversationStore.get(accountId, chatId, limit, beforeId);
    if (!conv) {
      return c.json({ error: "Conversation not found" }, 404);
    }
    return c.json(conv);
  });

  // 标记对话已读
  router.post("/:accountId/:chatId/read", (c) => {
    const accountId = c.req.param("accountId");
    const chatId = c.req.param("chatId");
    conversationStore.markRead(accountId, chatId);
    return c.json({ success: true });
  });

  // 获取用户头像
  router.get("/user/:userId/avatar", async (c) => {
    const userId = c.req.param("userId");
    const accountId = c.req.query("accountId");

    const accounts = accountId ? [getAccount(accountId)] : [];
    if (accounts.length === 0 || !accounts[0]) {
      return c.json({ error: "No account available" }, 400);
    }

    const account = accounts[0];
    const { userHead } = await fetchUserHead(account.id, userId);

    if (userHead) {
      return c.json(userHead);
    }
    return c.json({ error: "Failed to fetch user info" }, 404);
  });

  return router;
}
