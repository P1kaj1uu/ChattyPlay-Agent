import { Hono } from "hono";

import { getAllAccounts, getAccount } from "../../db/index";
import { fetchGoodsList } from "../../services/index";
import type { ClientManager } from "../../websocket/client.manager";

export function createGoodsRoutes(
  getClientManager: () => ClientManager | null,
) {
  const router = new Hono();

  // 获取所有账号的商品列表（只获取在线账号）
  router.get("/", async (c) => {
    const accountId = c.req.query("accountId");
    const page = parseInt(c.req.query("page") || "1");

    if (accountId) {
      const account = getAccount(accountId);
      if (!account) {
        return c.json({ error: "Account not found" }, 404);
      }
      const result = await fetchGoodsList(accountId, accountId, page);

      return c.json({
        items: result.items.map((item) => ({ ...item, accountId })),
        nextPage: result.nextPage,
        totalCount: result.totalCount,
      });
    }

    // 获取所有账号，但只处理在线的
    const accounts = getAllAccounts();
    const clientManager = getClientManager();
    const allItems: any[] = [];
    let totalCount = 0;

    for (const account of accounts) {
      // 检查账号是否在线
      const client = clientManager?.getClient(account.id);
      if (!client || !client.isConnected()) {
        continue; // 跳过离线账号
      }

      const result = await fetchGoodsList(account.id, account.id, page);

      const itemsWithAccount = result.items.map((item) => ({
        ...item,
        accountId: account.id,
        accountNickname: account.nickname,
      }));
      allItems.push(...itemsWithAccount);
      totalCount += result.totalCount;
    }

    return c.json({
      items: allItems,
      totalCount,
    });
  });

  // 获取单个账号的商品列表
  router.get("/account/:id", async (c) => {
    const id = c.req.param("id");
    const page = parseInt(c.req.query("page") || "1");

    const account = getAccount(id);
    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    const result = await fetchGoodsList(id, id, page);

    return c.json({
      items: result.items,
      nextPage: result.nextPage,
      totalCount: result.totalCount,
    });
  });

  return router;
}
