/**
 * 订单 API 路由
 */

import { Hono } from "hono";

import {
  getOrderList,
  getOrder,
  fetchAndUpdateOrderDetail,
} from "../../services/order.service";
import { updateOrderStatus, deleteOrder } from "../../db/order.repository";
import { OrderStatus, ORDER_STATUS_TEXT } from "../../types/order.types";
import type { ClientManager } from "../../websocket/client.manager";

export function createOrderRoutes(
  getClientManager: () => ClientManager | null,
) {
  const app = new Hono();

  // 获取订单列表
  app.get("/", async (c) => {
    const accountId = c.req.query("accountId");
    const status = c.req.query("status");
    const limit = parseInt(c.req.query("limit") || "50");
    const offset = parseInt(c.req.query("offset") || "0");

    const result = getOrderList({
      accountId: accountId || undefined,
      status: status ? parseInt(status) : undefined,
      limit,
      offset,
    });

    return c.json(result);
  });

  // 获取单个订单
  app.get("/:orderId", async (c) => {
    const orderId = c.req.param("orderId");
    const order = getOrder(orderId);

    if (!order) {
      return c.json({ error: "订单不存在" }, 404);
    }

    return c.json({ order });
  });

  // 刷新订单详情
  app.post("/:orderId/refresh", async (c) => {
    const orderId = c.req.param("orderId");
    const clientManager = getClientManager();

    if (!clientManager) {
      return c.json({ error: "ClientManager 未初始化" }, 500);
    }

    const localOrder = getOrder(orderId);
    if (!localOrder) {
      return c.json({ error: "订单不存在" }, 404);
    }

    const client = clientManager.getClient(localOrder.accountId);
    if (!client) {
      return c.json({ error: "账号未连接" }, 400);
    }

    const detail = await fetchAndUpdateOrderDetail(client, orderId);
    if (!detail) {
      return c.json({ error: "获取订单详情失败" }, 500);
    }

    const updatedOrder = getOrder(orderId);
    return c.json({ success: true, order: updatedOrder });
  });

  // 通过账号获取订单详情
  app.post("/fetch", async (c) => {
    const body = await c.req.json();
    const { accountId, orderId } = body;

    if (!accountId || !orderId) {
      return c.json({ error: "缺少 accountId 或 orderId" }, 400);
    }

    const clientManager = getClientManager();
    if (!clientManager) {
      return c.json({ error: "ClientManager 未初始化" }, 500);
    }

    const client = clientManager.getClient(accountId);
    if (!client) {
      return c.json({ error: "账号未连接" }, 400);
    }

    const detail = await fetchAndUpdateOrderDetail(client, orderId);
    if (!detail) {
      return c.json({ error: "获取订单详情失败" }, 500);
    }

    const order = getOrder(orderId);
    return c.json({ success: true, order });
  });

  // 确认发货
  app.post("/:orderId/ship", async (c) => {
    const orderId = c.req.param("orderId");
    const clientManager = getClientManager();

    if (!clientManager) {
      return c.json({ error: "ClientManager 未初始化" }, 500);
    }

    const localOrder = getOrder(orderId);
    if (!localOrder) {
      return c.json({ error: "订单不存在" }, 404);
    }

    if (localOrder.status !== OrderStatus.PENDING_SHIPMENT) {
      return c.json({ error: "只有待发货状态的订单才能执行发货" }, 400);
    }

    const client = clientManager.getClient(localOrder.accountId);
    if (!client) {
      return c.json({ error: "账号未连接" }, 400);
    }

    const result = await client.confirmShipment(orderId);
    if (result.success) {
      updateOrderStatus(
        orderId,
        OrderStatus.PENDING_RECEIPT,
        ORDER_STATUS_TEXT[OrderStatus.PENDING_RECEIPT],
        "ship_time",
      );
      const updatedOrder = getOrder(orderId);
      return c.json({ success: true, order: updatedOrder });
    }

    return c.json({ success: false, error: result.error }, 500);
  });

  // 免拼发货
  app.post("/:orderId/freeship", async (c) => {
    const orderId = c.req.param("orderId");
    const clientManager = getClientManager();

    if (!clientManager) {
      return c.json({ error: "ClientManager 未初始化" }, 500);
    }

    const localOrder = getOrder(orderId);
    if (!localOrder) {
      return c.json({ error: "订单不存在" }, 404);
    }

    if (localOrder.status !== OrderStatus.PENDING_SHIPMENT) {
      return c.json({ error: "只有待发货状态的订单才能执行发货" }, 400);
    }

    if (!localOrder.itemId || !localOrder.buyerUserId) {
      return c.json({ error: "订单缺少商品ID或买家ID，请先刷新订单详情" }, 400);
    }

    const client = clientManager.getClient(localOrder.accountId);
    if (!client) {
      return c.json({ error: "账号未连接" }, 400);
    }

    const result = await client.freeShipping(
      orderId,
      localOrder.itemId,
      localOrder.buyerUserId,
    );
    if (result.success) {
      updateOrderStatus(
        orderId,
        OrderStatus.PENDING_RECEIPT,
        ORDER_STATUS_TEXT[OrderStatus.PENDING_RECEIPT],
        "ship_time",
      );
      const updatedOrder = getOrder(orderId);
      return c.json({ success: true, order: updatedOrder });
    }

    return c.json({ success: false, error: result.error }, 500);
  });

  // 删除订单记录
  app.delete("/:orderId", async (c) => {
    const orderId = c.req.param("orderId");

    const localOrder = getOrder(orderId);
    if (!localOrder) {
      return c.json({ error: "订单不存在" }, 404);
    }

    const success = deleteOrder(orderId);
    if (success) {
      return c.json({ success: true, message: "订单记录已删除" });
    }

    return c.json({ success: false, error: "删除失败" }, 500);
  });

  return app;
}
