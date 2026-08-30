/**
 * 自动发货数据仓库
 */

import { db } from "./connection";
import type {
  DbAutoSellRule,
  DbStockItem,
  DbDeliveryLog,
  CreateAutoSellRuleParams,
  UpdateAutoSellRuleParams,
  AutoSellRule,
  StockItem,
  DeliveryLog,
} from "../types/index";

// ========== 规则管理 ==========

// 转换数据库规则到业务对象
function toRule(row: any): AutoSellRule {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled === 1,
    itemId: row.item_id,
    accountId: row.account_id,
    deliveryType: row.delivery_type,
    deliveryContent: row.delivery_content,
    apiConfig: row.api_config ? JSON.parse(row.api_config) : null,
    triggerOn: row.trigger_on,
    workflowId: row.workflow_id || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 获取所有规则
export function getAutoSellRules(): AutoSellRule[] {
  const stmt = db.prepare("SELECT * FROM autosell_rules ORDER BY id DESC");
  const rows = stmt.all() as DbAutoSellRule[];
  return rows.map(toRule);
}

// 获取启用的规则
export function getEnabledAutoSellRules(
  accountId?: string,
  itemId?: string,
): AutoSellRule[] {
  let sql = "SELECT * FROM autosell_rules WHERE enabled = 1";
  const params: any[] = [];

  if (accountId) {
    sql += " AND (account_id IS NULL OR account_id = ?)";
    params.push(accountId);
  }
  if (itemId) {
    sql += " AND (item_id IS NULL OR item_id = ?)";
    params.push(itemId);
  }

  sql += " ORDER BY id ASC";
  const stmt = db.prepare(sql);
  const rows = stmt.all(...params) as DbAutoSellRule[];
  return rows.map(toRule);
}

// 获取单个规则
export function getAutoSellRule(id: number): AutoSellRule | undefined {
  const stmt = db.prepare("SELECT * FROM autosell_rules WHERE id = ?");
  const row = stmt.get(id) as DbAutoSellRule | undefined;
  return row ? toRule(row) : undefined;
}

// 创建规则
export function createAutoSellRule(rule: CreateAutoSellRuleParams): number {
  const stmt = db.prepare(`
        INSERT INTO autosell_rules (name, enabled, item_id, account_id, delivery_type, delivery_content, api_config, trigger_on, workflow_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
  const result = stmt.run(
    rule.name,
    rule.enabled !== false ? 1 : 0,
    rule.itemId || null,
    rule.accountId || null,
    rule.deliveryType,
    rule.deliveryContent || null,
    rule.apiConfig ? JSON.stringify(rule.apiConfig) : null,
    rule.triggerOn || "paid",
    rule.workflowId || null,
  );
  return result.lastInsertRowid as number;
}

// 更新规则
export function updateAutoSellRule(
  id: number,
  rule: UpdateAutoSellRuleParams,
): boolean {
  const existing = getAutoSellRule(id);
  if (!existing) return false;

  const stmt = db.prepare(`
        UPDATE autosell_rules SET
            name = ?, enabled = ?, item_id = ?, account_id = ?,
            delivery_type = ?, delivery_content = ?, api_config = ?, trigger_on = ?, workflow_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
  stmt.run(
    rule.name ?? existing.name,
    rule.enabled !== undefined
      ? rule.enabled
        ? 1
        : 0
      : existing.enabled
        ? 1
        : 0,
    rule.itemId !== undefined ? rule.itemId : existing.itemId,
    rule.accountId !== undefined ? rule.accountId : existing.accountId,
    rule.deliveryType ?? existing.deliveryType,
    rule.deliveryContent !== undefined
      ? rule.deliveryContent
      : existing.deliveryContent,
    rule.apiConfig !== undefined
      ? rule.apiConfig
        ? JSON.stringify(rule.apiConfig)
        : null
      : existing.apiConfig
        ? JSON.stringify(existing.apiConfig)
        : null,
    rule.triggerOn ?? existing.triggerOn,
    rule.workflowId !== undefined ? rule.workflowId : existing.workflowId,
    id,
  );
  return true;
}

// 删除规则
export function deleteAutoSellRule(id: number): boolean {
  const stmt = db.prepare("DELETE FROM autosell_rules WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}

// 切换规则启用状态
export function toggleAutoSellRule(id: number): boolean {
  const stmt = db.prepare(
    "UPDATE autosell_rules SET enabled = 1 - enabled, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
  );
  const result = stmt.run(id);
  return result.changes > 0;
}

// ========== 库存管理 ==========

// 转换库存项
function toStockItem(row: DbStockItem): StockItem {
  return {
    id: row.id,
    ruleId: row.rule_id,
    content: row.content,
    used: row.used === 1,
    usedOrderId: row.used_order_id,
    createdAt: row.created_at,
    usedAt: row.used_at,
  };
}

// 获取规则的库存
export function getStockItems(
  ruleId: number,
  includeUsed = false,
): StockItem[] {
  const sql = includeUsed
    ? "SELECT * FROM autosell_stock WHERE rule_id = ? ORDER BY id ASC"
    : "SELECT * FROM autosell_stock WHERE rule_id = ? AND used = 0 ORDER BY id ASC";
  const stmt = db.prepare(sql);
  const rows = stmt.all(ruleId) as DbStockItem[];
  return rows.map(toStockItem);
}

// 获取库存统计
export function getStockStats(ruleId: number): {
  total: number;
  used: number;
  available: number;
} {
  const stmt = db.prepare(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN used = 1 THEN 1 ELSE 0 END) as used
        FROM autosell_stock WHERE rule_id = ?
    `);
  const row = stmt.get(ruleId) as { total: number; used: number };
  return {
    total: row.total,
    used: row.used || 0,
    available: row.total - (row.used || 0),
  };
}

// 添加库存
export function addStockItems(ruleId: number, contents: string[]): number {
  const stmt = db.prepare(
    "INSERT INTO autosell_stock (rule_id, content) VALUES (?, ?)",
  );
  const insertMany = db.transaction((items: string[]) => {
    for (const content of items) {
      stmt.run(ruleId, content);
    }
    return items.length;
  });
  return insertMany(contents);
}

// 取出一个库存（标记为已使用）
export function consumeStock(
  ruleId: number,
  orderId: string,
): StockItem | null {
  const selectStmt = db.prepare(
    "SELECT * FROM autosell_stock WHERE rule_id = ? AND used = 0 ORDER BY id ASC LIMIT 1",
  );
  const row = selectStmt.get(ruleId) as DbStockItem | undefined;
  if (!row) return null;

  const updateStmt = db.prepare(
    "UPDATE autosell_stock SET used = 1, used_order_id = ?, used_at = CURRENT_TIMESTAMP WHERE id = ?",
  );
  updateStmt.run(orderId, row.id);

  return toStockItem({ ...row, used: 1, used_order_id: orderId });
}

// 清空规则库存
export function clearStock(ruleId: number, onlyUsed = false): number {
  const sql = onlyUsed
    ? "DELETE FROM autosell_stock WHERE rule_id = ? AND used = 1"
    : "DELETE FROM autosell_stock WHERE rule_id = ?";
  const stmt = db.prepare(sql);
  const result = stmt.run(ruleId);
  return result.changes;
}

// ========== 发货记录 ==========

// 转换发货记录
function toDeliveryLog(row: DbDeliveryLog): DeliveryLog {
  return {
    id: row.id,
    ruleId: row.rule_id,
    orderId: row.order_id,
    accountId: row.account_id,
    deliveryType: row.delivery_type,
    content: row.content,
    status: row.status as "success" | "failed",
    errorMessage: row.error_message,
    createdAt: row.created_at,
  };
}

// 添加发货记录
export function addDeliveryLog(log: {
  ruleId?: number | null;
  orderId: string;
  accountId: string;
  deliveryType: string;
  content: string;
  status: "success" | "failed";
  errorMessage?: string | null;
}): number {
  const stmt = db.prepare(`
        INSERT INTO autosell_logs (rule_id, order_id, account_id, delivery_type, content, status, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
  const result = stmt.run(
    log.ruleId || null,
    log.orderId,
    log.accountId,
    log.deliveryType,
    log.content,
    log.status,
    log.errorMessage || null,
  );
  return result.lastInsertRowid as number;
}

// 获取发货记录
export function getDeliveryLogs(params: {
  ruleId?: number;
  orderId?: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}): { logs: DeliveryLog[]; total: number } {
  let whereClauses: string[] = [];
  const queryParams: any[] = [];

  if (params.ruleId) {
    whereClauses.push("rule_id = ?");
    queryParams.push(params.ruleId);
  }
  if (params.orderId) {
    whereClauses.push("order_id = ?");
    queryParams.push(params.orderId);
  }
  if (params.accountId) {
    whereClauses.push("account_id = ?");
    queryParams.push(params.accountId);
  }

  const whereClause =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  const countStmt = db.prepare(
    `SELECT COUNT(*) as total FROM autosell_logs ${whereClause}`,
  );
  const { total } = countStmt.get(...queryParams) as { total: number };

  const limit = params.limit || 50;
  const offset = params.offset || 0;
  const dataStmt = db.prepare(
    `SELECT * FROM autosell_logs ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
  );
  const rows = dataStmt.all(...queryParams, limit, offset) as DbDeliveryLog[];

  return { logs: rows.map(toDeliveryLog), total };
}

// 检查订单是否已发货
export function hasDelivered(orderId: string): boolean {
  const stmt = db.prepare(
    "SELECT id FROM autosell_logs WHERE order_id = ? AND status = ? LIMIT 1",
  );
  const row = stmt.get(orderId, "success");
  return !!row;
}
