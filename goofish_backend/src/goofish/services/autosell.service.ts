/**
 * 自动发货服务
 */

import { createLogger } from "../core/logger";
import {
  getEnabledAutoSellRules,
  getStockStats,
  consumeStock,
  addDeliveryLog,
  hasDelivered,
} from "../db/index";
import type { AutoSellRule, DeliveryResult, ApiConfig } from "../types/index";

const logger = createLogger("Svc:AutoSell");

/**
 * 通过 API 获取发货内容
 */
async function fetchFromApi(
  config: ApiConfig,
  context: Record<string, string>,
): Promise<string> {
  let url = config.url;
  let body = config.body;

  // 替换变量
  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{{${key}}}`;
    url = url.replace(new RegExp(placeholder, "g"), value);
    if (body) {
      body = body.replace(new RegExp(placeholder, "g"), value);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...config.headers,
  };

  const response = await fetch(url, {
    method: config.method,
    headers,
    body: config.method === "POST" ? body : undefined,
  });

  if (!response.ok) {
    throw new Error(`API 请求失败: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // 从响应中提取内容
  if (config.responseField) {
    const fields = config.responseField.split(".");
    let result = data;
    for (const field of fields) {
      result = result?.[field];
    }
    if (result === undefined) {
      throw new Error(`响应中未找到字段: ${config.responseField}`);
    }
    return String(result);
  }

  return typeof data === "string" ? data : JSON.stringify(data);
}

/**
 * 执行发货
 */
async function executeDelivery(
  rule: AutoSellRule,
  orderId: string,
  context: Record<string, string>,
): Promise<DeliveryResult> {
  switch (rule.deliveryType) {
    case "fixed":
      if (!rule.deliveryContent) {
        return { success: false, error: "未配置发货内容" };
      }
      return { success: true, content: rule.deliveryContent };

    case "stock": {
      const stock = consumeStock(rule.id, orderId);
      if (!stock) {
        return { success: false, error: "库存不足" };
      }
      return { success: true, content: stock.content };
    }

    case "api": {
      if (!rule.apiConfig) {
        return { success: false, error: "未配置 API" };
      }
      try {
        const content = await fetchFromApi(rule.apiConfig, context);
        return { success: true, content };
      } catch (e: any) {
        return { success: false, error: e.message };
      }
    }

    default:
      return { success: false, error: "未知发货类型" };
  }
}

/**
 * 处理订单自动发货
 */
export async function processAutoSell(
  accountId: string,
  orderId: string,
  itemId?: string,
  triggerOn: "paid" | "confirmed" = "paid",
): Promise<DeliveryResult & { ruleName?: string }> {
  // 检查是否已发货
  if (hasDelivered(orderId)) {
    logger.info(`订单 ${orderId} 已发货，跳过`);
    return { success: false, error: "订单已发货" };
  }

  // 获取匹配的规则
  const rules = getEnabledAutoSellRules(accountId, itemId);
  const matchedRule = rules.find((r) => r.triggerOn === triggerOn);

  if (!matchedRule) {
    logger.debug(`订单 ${orderId} 无匹配的自动发货规则`);
    return { success: false, error: "无匹配规则" };
  }

  // 检查库存类型的库存是否充足
  if (matchedRule.deliveryType === "stock") {
    const stats = getStockStats(matchedRule.id);
    if (stats.available <= 0) {
      logger.warn(`规则 "${matchedRule.name}" 库存不足`);
      return { success: false, error: "库存不足", ruleName: matchedRule.name };
    }
  }

  // 执行发货
  const context = { orderId, accountId, itemId: itemId || "" };
  const result = await executeDelivery(matchedRule, orderId, context);

  // 记录发货日志
  addDeliveryLog({
    ruleId: matchedRule.id,
    orderId,
    accountId,
    deliveryType: matchedRule.deliveryType,
    content: result.content || "",
    status: result.success ? "success" : "failed",
    errorMessage: result.error,
  });

  if (result.success) {
    logger.info(`订单 ${orderId} 自动发货成功: ${matchedRule.name}`);
  } else {
    logger.error(`订单 ${orderId} 自动发货失败: ${result.error}`);
  }

  return { ...result, ruleName: matchedRule.name };
}

/**
 * 获取规则的库存状态
 */
export function getRuleStockStatus(ruleId: number) {
  return getStockStats(ruleId);
}
