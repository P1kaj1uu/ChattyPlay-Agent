/**
 * 订单服务
 * 简化版：订单ID唯一，通过API获取订单详情
 */

import { createLogger } from "../core/logger";
import {
  getOrders,
  getOrderCount,
  getOrderById,
  upsertOrder,
  updateOrderStatus,
  getEnabledAutoSellRules,
} from "../db/index";
import { OrderStatus, ORDER_STATUS_TEXT } from "../types/order.types";
import { startWorkflowExecution } from "./workflow.service";
import type {
  OrderRecord,
  OrderListParams,
  OrderDetailData,
} from "../types/order.types";
import type { GoofishClient } from "../websocket/client";

const logger = createLogger("Svc:Order");

// 获取订单列表
export function getOrderList(params: OrderListParams) {
  const orders = getOrders(params);
  const total = getOrderCount(params);
  return {
    orders,
    total,
    limit: params.limit || 50,
    offset: params.offset || 0,
  };
}

// 获取单个订单
export function getOrder(orderId: string): OrderRecord | null {
  return getOrderById(orderId);
}

// 处理订单消息：仅记录订单ID，详情通过API获取
export function handleOrderMessage(
  accountId: string,
  orderId: string,
  chatId?: string,
): void {
  logger.info(`收到订单消息: ${orderId}`);

  // 检查订单是否已存在
  const existing = getOrderById(orderId);
  if (!existing) {
    // 创建订单占位记录
    upsertOrder({
      orderId,
      accountId,
      status: 0,
      statusText: "获取中...",
      chatId,
    });
    logger.info(`新订单记录已创建: ${orderId}`);
  } else if (chatId && !existing.chatId) {
    // 更新 chatId
    upsertOrder({
      ...existing,
      chatId,
    });
  }
}

// 通过 API 获取订单详情并更新数据库
export async function fetchAndUpdateOrderDetail(
  client: GoofishClient,
  orderId: string,
): Promise<OrderDetailData | null> {
  try {
    const detail = await client.fetchOrderDetail(orderId);
    if (!detail?.data) {
      logger.warn(`订单详情响应为空: ${orderId}`);
      return null;
    }

    const data = detail.data;

    // 解析订单信息
    const orderInfoVO = data.components?.find(
      (c: any) => c.render === "orderInfoVO",
    )?.data;
    const itemInfo = orderInfoVO?.itemInfo;
    const orderInfoList = orderInfoVO?.orderInfoList || [];

    // 提取字段
    const buyerNickname = orderInfoList.find(
      (i: any) => i.title === "买家昵称",
    )?.value;
    const orderTime = orderInfoList.find(
      (i: any) => i.title === "下单时间",
    )?.value;
    const payTime = orderInfoList.find(
      (i: any) => i.title === "付款时间",
    )?.value;
    const shipTime = orderInfoList.find(
      (i: any) => i.title === "发货时间",
    )?.value;
    const completeTime = orderInfoList.find(
      (i: any) => i.title === "成交时间",
    )?.value;

    const itemIdStr = data.itemId ? String(data.itemId) : undefined;
    const buyerUserIdStr = data.peerUserId
      ? String(data.peerUserId)
      : undefined;
    const status = data.status;
    const statusText =
      data.utArgs?.orderMainTitle || ORDER_STATUS_TEXT[status] || "未知状态";

    const itemTitle = itemInfo?.title;
    const itemPicUrl = itemInfo?.itemMainPictCdnUrl;
    const price = itemInfo?.price || orderInfoVO?.priceInfo?.amount?.value;

    logger.info(`订单详情: ${orderId}, 状态=${statusText}, 商品=${itemTitle}`);

    // 获取旧订单状态
    const oldOrder = getOrderById(orderId);
    const oldStatus = oldOrder?.status;

    upsertOrder({
      orderId,
      accountId: client.accountId,
      itemId: itemIdStr,
      itemTitle,
      itemPicUrl,
      price,
      buyerUserId: buyerUserIdStr,
      buyerNickname,
      status,
      statusText,
      orderTime,
      payTime,
      shipTime,
      completeTime,
    });

    // 检查是否需要触发自动发货
    if (
      status === OrderStatus.PENDING_SHIPMENT &&
      oldStatus !== OrderStatus.PENDING_SHIPMENT
    ) {
      // 订单变为待发货状态，触发自动发货
      await triggerAutoSell(client, orderId, itemIdStr, buyerUserIdStr, "paid");
    } else if (
      status === OrderStatus.PENDING_RECEIPT &&
      oldStatus !== OrderStatus.PENDING_RECEIPT
    ) {
      // 订单变为待收货状态，触发确认收货后的自动发货
      await triggerAutoSell(
        client,
        orderId,
        itemIdStr,
        buyerUserIdStr,
        "confirmed",
      );
    }

    return data;
  } catch (e) {
    logger.error(`获取订单详情失败: ${orderId} - ${e}`);
    return null;
  }
}

/**
 * 触发自动发货（通过流程引擎）
 */
async function triggerAutoSell(
  client: GoofishClient,
  orderId: string,
  itemId: string | undefined,
  buyerUserId: string | undefined,
  triggerOn: "paid" | "confirmed",
): Promise<void> {
  try {
    // 获取匹配的规则
    const rules = getEnabledAutoSellRules(client.accountId, itemId);
    const matchedRule = rules.find((r) => r.triggerOn === triggerOn);

    if (!matchedRule) {
      logger.debug(`订单 ${orderId} 无匹配的自动发货规则`);
      return;
    }

    // 从订单记录获取 chatId
    const order = getOrderById(orderId);
    const chatId = order?.chatId || undefined;

    // 启动流程执行
    const result = await startWorkflowExecution(matchedRule.workflowId, {
      orderId,
      accountId: client.accountId,
      itemId,
      ruleId: matchedRule.id,
      client,
      buyerUserId,
      chatId,
    });

    if (!result.success) {
      if (result.error !== "流程已在执行中") {
        logger.warn(`自动发货流程启动失败: ${orderId} - ${result.error}`);
      }
    } else {
      logger.info(`自动发货流程已启动: ${orderId}, 规则: ${matchedRule.name}`);
    }
  } catch (e) {
    logger.error(`触发自动发货异常: ${orderId} - ${e}`);
  }
}
