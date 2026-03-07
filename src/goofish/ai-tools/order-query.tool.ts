/**
 * AI 订单查询工具
 * 允许 AI 查询当前对话买家的订单信息
 */

import { db } from "../db/connection"
import { ORDER_STATUS_TEXT } from "../types/order.types"

export interface OrderQueryContext {
  accountId: string; // 卖家账号ID
  buyerUserId: string; // 买家用户ID
}

export interface OrderQueryResult {
  success: boolean;
  orders?: {
    orderId: string;
    itemTitle: string;
    price: string;
    status: string;
    orderTime: string;
    payTime: string | null;
    shipTime: string | null;
  }[];
  message?: string;
}

/**
 * 查询买家订单
 * 只返回当前对话买家在当前卖家账号下的订单
 */
export function queryBuyerOrders(ctx: OrderQueryContext): OrderQueryResult {
  const { accountId, buyerUserId } = ctx

  if (!accountId || !buyerUserId) {
    return { success: false, message: "缺少必要参数" }
  }

  try {
    const rows = db
      .prepare(
        `
            SELECT order_id, item_title, price, status, status_text,
                   order_time, pay_time, ship_time
            FROM orders
            WHERE account_id = ? AND buyer_user_id = ?
            ORDER BY order_time DESC
            LIMIT 10
        `,
      )
      .all(accountId, buyerUserId) as any[]

    if (rows.length === 0) {
      return { success: true, orders: [], message: "该买家暂无订单记录" }
    }

    const orders = rows.map((row) => ({
      orderId: row.order_id,
      itemTitle: row.item_title || "未知商品",
      price: row.price || "0",
      status: row.status_text || ORDER_STATUS_TEXT[row.status] || "未知状态",
      orderTime: row.order_time,
      payTime: row.pay_time,
      shipTime: row.ship_time,
    }))

    return { success: true, orders }
  } catch (e) {
    return { success: false, message: "查询订单失败" }
  }
}

/**
 * OpenAI Function Calling 工具定义
 */
export const orderQueryToolDefinition = {
  type: "function" as const,
  function: {
    name: "query_buyer_orders",
    description: "查询当前对话买家的订单信息，包括订单号、商品、价格、状态等",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
}
