import { Hono } from "hono";

import { createLogger } from "../../core/logger";
import { CookiesManager } from "../../core/cookies.manager";
import {
  getAllAccounts,
  getAccount,
  upsertAccount,
  deleteAccount,
  updateAccountEnabled,
  getAccountStatus,
  updateAccountUserInfo,
} from "../../db/index";
import { fetchUserInfo } from "../../services/index";
import { parseCookies } from "../../utils/cookies";
import type { ClientManager } from "../../websocket/client.manager";

const logger = createLogger("Api:Account");

export function createAccountRoutes(
  getClientManager: () => ClientManager | null,
) {
  const router = new Hono();

  // 获取所有账号
  router.get("/", (c) => {
    const accounts = getAllAccounts().map((a) => ({
      ...a,
      cookies: a.cookies.substring(0, 50) + "...",
      status: getAccountStatus(a.id),
    }));
    return c.json({ accounts });
  });

  // 获取单个账号
  router.get("/:id", (c) => {
    const id = c.req.param("id");
    const account = getAccount(id);
    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }
    return c.json({
      ...account,
      cookies: account.cookies.substring(0, 50) + "...",
      status: getAccountStatus(id),
    });
  });

  // 添加/更新账号
  router.post("/", async (c) => {
    const body = await c.req.json();
    const { id, cookies, remark, enabled } = body;

    if (cookies) {
      // 新账号：先从 cookies 中提取 userId 作为临时 accountId
      const cookiesObj = parseCookies(cookies);
      const tempAccountId = cookiesObj["unb"];
      if (!tempAccountId) {
        return c.json({ error: "Cookie中缺少必需的unb字段" }, 400);
      }

      // 先保存账号到数据库（这样 CookiesManager 才能工作）
      upsertAccount({
        id: tempAccountId,
        cookies,
        remark,
        enabled,
      });

      // 然后获取用户信息
      const userInfo = await fetchUserInfo(tempAccountId);
      if (!userInfo) {
        // 删除刚创建的账号
        deleteAccount(tempAccountId);
        return c.json({ error: "Cookie无效或已过期，无法获取用户信息" }, 400);
      }

      logger.info(`获取用户信息: ${userInfo.displayName} (${tempAccountId})`);

      // 更新用户信息
      updateAccountUserInfo(
        tempAccountId,
        userInfo.displayName,
        userInfo.avatar,
      );

      return c.json({ success: true, accountId: tempAccountId });
    }

    if (!id) {
      return c.json({ error: "Missing id" }, 400);
    }

    const existing = getAccount(id);
    if (!existing) {
      return c.json({ error: "Account not found" }, 404);
    }
    const success = upsertAccount({
      id,
      cookies: existing.cookies,
      nickname: existing.nickname,
      avatar: existing.avatar,
      remark,
      enabled,
    });
    return c.json({ success });
  });

  // 刷新账号用户信息
  router.post("/:id/refresh-info", async (c) => {
    const id = c.req.param("id");
    const account = getAccount(id);
    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }

    const userInfo = await fetchUserInfo(id);

    if (userInfo) {
      updateAccountUserInfo(id, userInfo.displayName, userInfo.avatar);
      return c.json({ success: true, userInfo });
    }
    return c.json({ success: false, error: "Failed to fetch user info" });
  });

  // 删除账号
  router.delete("/:id", (c) => {
    const id = c.req.param("id");
    getClientManager()?.stopClient(id);
    const success = deleteAccount(id);
    return c.json({ success });
  });

  // 启用/禁用账号
  router.patch("/:id/enabled", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json();
    const { enabled } = body;
    const success = updateAccountEnabled(id, enabled);
    const clientManager = getClientManager();
    if (enabled && clientManager) {
      await clientManager.startClient(id);
    } else if (!enabled && clientManager) {
      clientManager.stopClient(id);
    }
    return c.json({ success });
  });

  // 启动账号
  router.post("/:id/start", async (c) => {
    const id = c.req.param("id");
    const clientManager = getClientManager();
    if (!clientManager) {
      return c.json({ error: "ClientManager not initialized" }, 500);
    }
    const account = getAccount(id);
    if (!account) {
      return c.json({ error: "Account not found" }, 404);
    }
    const success = await clientManager.startClient(id);
    if (success) {
      updateAccountEnabled(id, true);
    }
    return c.json({ success });
  });

  // 停止账号
  router.post("/:id/stop", (c) => {
    const id = c.req.param("id");
    const clientManager = getClientManager();
    if (!clientManager) {
      return c.json({ error: "ClientManager not initialized" }, 500);
    }
    const success = clientManager.stopClient(id);
    if (success) {
      updateAccountEnabled(id, false);
    }
    return c.json({ success });
  });

  // 重启账号
  router.post("/:id/restart", async (c) => {
    const id = c.req.param("id");
    const clientManager = getClientManager();
    if (!clientManager) {
      return c.json({ error: "ClientManager not initialized" }, 500);
    }
    const success = await clientManager.restartClient(id);
    return c.json({ success });
  });

  return router;
}
