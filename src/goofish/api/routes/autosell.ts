/**
 * 自动发货 API 路由
 */

import { Hono } from "hono";

import {
  getAutoSellRules,
  getAutoSellRule,
  createAutoSellRule,
  updateAutoSellRule,
  deleteAutoSellRule,
  toggleAutoSellRule,
  getStockItems,
  getStockStats,
  addStockItems,
  clearStock,
  getDeliveryLogs,
} from "../../db/index";

export function createAutoSellRoutes() {
  const router = new Hono();

  // ========== 规则管理 ==========

  // 获取所有规则
  router.get("/", (c) => {
    const rules = getAutoSellRules();
    // 附加库存统计
    const rulesWithStats = rules.map((r) => {
      if (r.deliveryType === "stock") {
        const stats = getStockStats(r.id);
        return { ...r, stockCount: stats.total, usedCount: stats.used };
      }
      return r;
    });
    return c.json({ rules: rulesWithStats });
  });

  // 获取单个规则
  router.get("/:id", (c) => {
    const id = parseInt(c.req.param("id"));
    const rule = getAutoSellRule(id);
    if (!rule) {
      return c.json({ error: "规则不存在" }, 404);
    }
    if (rule.deliveryType === "stock") {
      const stats = getStockStats(id);
      return c.json({
        ...rule,
        stockCount: stats.total,
        usedCount: stats.used,
      });
    }
    return c.json(rule);
  });

  // 创建规则
  router.post("/", async (c) => {
    const body = await c.req.json();
    const id = createAutoSellRule(body);
    return c.json({ success: true, id });
  });

  // 更新规则
  router.put("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const success = updateAutoSellRule(id, body);
    return c.json({ success });
  });

  // 删除规则
  router.delete("/:id", (c) => {
    const id = parseInt(c.req.param("id"));
    const success = deleteAutoSellRule(id);
    return c.json({ success });
  });

  // 切换规则状态
  router.post("/:id/toggle", (c) => {
    const id = parseInt(c.req.param("id"));
    const success = toggleAutoSellRule(id);
    return c.json({ success });
  });

  // ========== 库存管理 ==========

  // 获取规则库存
  router.get("/:id/stock", (c) => {
    const id = parseInt(c.req.param("id"));
    const includeUsed = c.req.query("includeUsed") === "true";
    const items = getStockItems(id, includeUsed);
    const stats = getStockStats(id);
    return c.json({ items, stats });
  });

  // 添加库存
  router.post("/:id/stock", async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();
    const contents = body.contents as string[];
    if (!Array.isArray(contents) || contents.length === 0) {
      return c.json({ error: "请提供库存内容" }, 400);
    }
    const count = addStockItems(id, contents);
    return c.json({ success: true, count });
  });

  // 清空库存
  router.delete("/:id/stock", (c) => {
    const id = parseInt(c.req.param("id"));
    const onlyUsed = c.req.query("onlyUsed") === "true";
    const count = clearStock(id, onlyUsed);
    return c.json({ success: true, count });
  });

  // ========== 发货记录 ==========

  // 获取发货记录
  router.get("/logs", (c) => {
    const ruleId = c.req.query("ruleId");
    const orderId = c.req.query("orderId");
    const accountId = c.req.query("accountId");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const result = getDeliveryLogs({
      ruleId: ruleId ? parseInt(ruleId) : undefined,
      orderId: orderId || undefined,
      accountId: accountId || undefined,
      limit,
      offset,
    });
    return c.json(result);
  });

  return router;
}
