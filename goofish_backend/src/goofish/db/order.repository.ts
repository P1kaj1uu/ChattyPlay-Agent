/**
 * 订单数据仓库
 */

import { db } from "./connection";
import { nowLocalString } from "../utils/date";
import { emitOrdersUpdated } from "../core/event-emitter";
import type { OrderRecord, OrderListParams } from "../types/order.types";

// 获取订单列表
export function getOrders(params: OrderListParams = {}): OrderRecord[] {
  const { accountId, status, limit = 50, offset = 0 } = params;

  let sql = "SELECT * FROM orders WHERE 1=1";
  const sqlParams: any[] = [];

  if (accountId) {
    sql += " AND account_id = ?";
    sqlParams.push(accountId);
  }

  if (status !== undefined) {
    sql += " AND status = ?";
    sqlParams.push(status);
  }

  sql += " ORDER BY updated_at DESC LIMIT ? OFFSET ?";
  sqlParams.push(limit, offset);

  const rows = db.prepare(sql).all(...sqlParams) as any[];
  return rows.map(mapRowToOrder);
}

// 获取订单总数
export function getOrderCount(params: OrderListParams = {}): number {
  const { accountId, status } = params;

  let sql = "SELECT COUNT(*) as count FROM orders WHERE 1=1";
  const sqlParams: any[] = [];

  if (accountId) {
    sql += " AND account_id = ?";
    sqlParams.push(accountId);
  }

  if (status !== undefined) {
    sql += " AND status = ?";
    sqlParams.push(status);
  }

  const row = db.prepare(sql).get(...sqlParams) as { count: number };
  return row.count;
}

// 根据订单 ID 获取订单
export function getOrderById(orderId: string): OrderRecord | null {
  const row = db
    .prepare("SELECT * FROM orders WHERE order_id = ?")
    .get(orderId) as any;

  return row ? mapRowToOrder(row) : null;
}

// 创建或更新订单
export function upsertOrder(
  order: Partial<OrderRecord> & { orderId: string; accountId: string },
): void {
  const now = nowLocalString();

  db.prepare(
    `
        INSERT INTO orders (
            order_id, account_id, item_id, item_title, item_pic_url,
            price, buyer_user_id, buyer_nickname, chat_id, status, status_text,
            order_time, pay_time, ship_time, complete_time, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(order_id) DO UPDATE SET
            item_id = COALESCE(excluded.item_id, item_id),
            item_title = COALESCE(excluded.item_title, item_title),
            item_pic_url = COALESCE(excluded.item_pic_url, item_pic_url),
            price = COALESCE(excluded.price, price),
            buyer_user_id = COALESCE(excluded.buyer_user_id, buyer_user_id),
            buyer_nickname = COALESCE(excluded.buyer_nickname, buyer_nickname),
            chat_id = COALESCE(excluded.chat_id, chat_id),
            status = COALESCE(excluded.status, status),
            status_text = COALESCE(excluded.status_text, status_text),
            order_time = COALESCE(excluded.order_time, order_time),
            pay_time = COALESCE(excluded.pay_time, pay_time),
            ship_time = COALESCE(excluded.ship_time, ship_time),
            complete_time = COALESCE(excluded.complete_time, complete_time),
            updated_at = excluded.updated_at
    `,
  ).run(
    order.orderId,
    order.accountId,
    order.itemId || null,
    order.itemTitle || null,
    order.itemPicUrl || null,
    order.price || null,
    order.buyerUserId || null,
    order.buyerNickname || null,
    order.chatId || null,
    order.status || 1,
    order.statusText || null,
    order.orderTime || now,
    order.payTime || null,
    order.shipTime || null,
    order.completeTime || null,
    now,
    now,
  );

  emitOrdersUpdated();
}

// 更新订单状态
export function updateOrderStatus(
  orderId: string,
  status: number,
  statusText: string,
  timeField?: "pay_time" | "ship_time" | "complete_time",
): void {
  const now = nowLocalString();

  let sql = "UPDATE orders SET status = ?, status_text = ?, updated_at = ?";
  const params: any[] = [status, statusText, now];

  if (timeField) {
    sql += `, ${timeField} = ?`;
    params.push(now);
  }

  sql += " WHERE order_id = ?";
  params.push(orderId);

  db.prepare(sql).run(...params);
  emitOrdersUpdated();
}

// 删除订单
export function deleteOrder(orderId: string): boolean {
  const result = db
    .prepare("DELETE FROM orders WHERE order_id = ?")
    .run(orderId);
  if (result.changes > 0) {
    emitOrdersUpdated();
  }
  return result.changes > 0;
}

// 行数据映射
function mapRowToOrder(row: any): OrderRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    accountId: row.account_id,
    itemId: row.item_id,
    itemTitle: row.item_title,
    itemPicUrl: row.item_pic_url,
    price: row.price,
    buyerUserId: row.buyer_user_id,
    buyerNickname: row.buyer_nickname,
    chatId: row.chat_id,
    status: row.status,
    statusText: row.status_text,
    orderTime: row.order_time,
    payTime: row.pay_time,
    shipTime: row.ship_time,
    completeTime: row.complete_time,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
