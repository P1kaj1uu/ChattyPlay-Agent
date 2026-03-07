/**
 * 发货流程数据仓库
 */

import { db } from "./connection";
import type {
  Workflow,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowExecutionStatus,
} from "../types/workflow.types";

// 获取所有流程
export function getWorkflows(): Workflow[] {
  const stmt = db.prepare(`
        SELECT id, name, description, definition, is_default, enabled, created_at, updated_at
        FROM workflows ORDER BY is_default DESC, id ASC
    `);
  const rows = stmt.all() as any[];
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    definition: JSON.parse(row.definition),
    isDefault: Boolean(row.is_default),
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

// 获取单个流程
export function getWorkflowById(id: number): Workflow | null {
  const stmt = db.prepare(`
        SELECT id, name, description, definition, is_default, enabled, created_at, updated_at
        FROM workflows WHERE id = ?
    `);
  const row = stmt.get(id) as any;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    definition: JSON.parse(row.definition),
    isDefault: Boolean(row.is_default),
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 获取默认流程
export function getDefaultWorkflow(): Workflow | null {
  const stmt = db.prepare(`
        SELECT id, name, description, definition, is_default, enabled, created_at, updated_at
        FROM workflows WHERE is_default = 1 LIMIT 1
    `);
  const row = stmt.get() as any;
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    definition: JSON.parse(row.definition),
    isDefault: Boolean(row.is_default),
    enabled: Boolean(row.enabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// 创建流程
export function createWorkflow(data: {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  isDefault?: boolean;
}): number {
  // 如果设为默认，先取消其他默认
  if (data.isDefault) {
    db.prepare("UPDATE workflows SET is_default = 0").run();
  }

  const stmt = db.prepare(`
        INSERT INTO workflows (name, description, definition, is_default, enabled)
        VALUES (?, ?, ?, ?, 1)
    `);
  const result = stmt.run(
    data.name,
    data.description || null,
    JSON.stringify(data.definition),
    data.isDefault ? 1 : 0,
  );
  return result.lastInsertRowid as number;
}

// 更新流程
export function updateWorkflow(
  id: number,
  data: {
    name?: string;
    description?: string;
    definition?: WorkflowDefinition;
    isDefault?: boolean;
    enabled?: boolean;
  },
): boolean {
  const workflow = getWorkflowById(id);
  if (!workflow) return false;

  // 如果设为默认，先取消其他默认
  if (data.isDefault) {
    db.prepare("UPDATE workflows SET is_default = 0 WHERE id != ?").run(id);
  }

  const stmt = db.prepare(`
        UPDATE workflows SET
            name = COALESCE(?, name),
            description = COALESCE(?, description),
            definition = COALESCE(?, definition),
            is_default = COALESCE(?, is_default),
            enabled = COALESCE(?, enabled),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
  stmt.run(
    data.name ?? null,
    data.description ?? null,
    data.definition ? JSON.stringify(data.definition) : null,
    data.isDefault !== undefined ? (data.isDefault ? 1 : 0) : null,
    data.enabled !== undefined ? (data.enabled ? 1 : 0) : null,
    id,
  );
  return true;
}

// 删除流程
export function deleteWorkflow(id: number): boolean {
  const workflow = getWorkflowById(id);
  if (!workflow || workflow.isDefault) return false; // 不能删除默认流程

  const stmt = db.prepare("DELETE FROM workflows WHERE id = ?");
  stmt.run(id);
  return true;
}

// ============ 流程执行相关 ============

// 创建流程执行记录
export function createWorkflowExecution(data: {
  workflowId: number;
  orderId: string;
  accountId: string;
  ruleId: number;
  currentNodeId?: string;
  context?: Record<string, any>;
}): number {
  const stmt = db.prepare(`
        INSERT INTO workflow_executions 
        (workflow_id, order_id, account_id, rule_id, status, current_node_id, context)
        VALUES (?, ?, ?, ?, 'pending', ?, ?)
    `);
  const result = stmt.run(
    data.workflowId,
    data.orderId,
    data.accountId,
    data.ruleId,
    data.currentNodeId || null,
    JSON.stringify(data.context || {}),
  );
  return result.lastInsertRowid as number;
}

// 获取流程执行记录
export function getWorkflowExecution(id: number): WorkflowExecution | null {
  const stmt = db.prepare(`
        SELECT id, workflow_id, order_id, account_id, rule_id, status, 
               current_node_id, waiting_for_reply, expected_keywords, context,
               created_at, updated_at
        FROM workflow_executions WHERE id = ?
    `);
  const row = stmt.get(id) as any;
  if (!row) return null;
  return mapExecutionRow(row);
}

// 根据订单ID获取执行记录
export function getWorkflowExecutionByOrderId(
  orderId: string,
): WorkflowExecution | null {
  const stmt = db.prepare(`
        SELECT id, workflow_id, order_id, account_id, rule_id, status, 
               current_node_id, waiting_for_reply, expected_keywords, context,
               created_at, updated_at
        FROM workflow_executions 
        WHERE order_id = ? AND status NOT IN ('completed', 'failed')
        ORDER BY id DESC LIMIT 1
    `);
  const row = stmt.get(orderId) as any;
  if (!row) return null;
  return mapExecutionRow(row);
}

// 获取等待用户回复的执行记录
export function getWaitingExecutions(accountId: string): WorkflowExecution[] {
  const stmt = db.prepare(`
        SELECT id, workflow_id, order_id, account_id, rule_id, status, 
               current_node_id, waiting_for_reply, expected_keywords, context,
               created_at, updated_at
        FROM workflow_executions 
        WHERE account_id = ? AND waiting_for_reply = 1 AND status = 'waiting'
    `);
  const rows = stmt.all(accountId) as any[];
  return rows.map(mapExecutionRow);
}

// 更新流程执行状态
export function updateWorkflowExecution(
  id: number,
  data: {
    status?: WorkflowExecutionStatus;
    currentNodeId?: string | null;
    waitingForReply?: boolean;
    expectedKeywords?: string[] | null;
    context?: Record<string, any>;
  },
): boolean {
  const stmt = db.prepare(`
        UPDATE workflow_executions SET
            status = COALESCE(?, status),
            current_node_id = COALESCE(?, current_node_id),
            waiting_for_reply = COALESCE(?, waiting_for_reply),
            expected_keywords = COALESCE(?, expected_keywords),
            context = COALESCE(?, context),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
  stmt.run(
    data.status ?? null,
    data.currentNodeId !== undefined ? data.currentNodeId : null,
    data.waitingForReply !== undefined ? (data.waitingForReply ? 1 : 0) : null,
    data.expectedKeywords !== undefined
      ? data.expectedKeywords
        ? JSON.stringify(data.expectedKeywords)
        : null
      : null,
    data.context ? JSON.stringify(data.context) : null,
    id,
  );
  return true;
}

function mapExecutionRow(row: any): WorkflowExecution {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    orderId: row.order_id,
    accountId: row.account_id,
    ruleId: row.rule_id,
    status: row.status,
    currentNodeId: row.current_node_id,
    waitingForReply: Boolean(row.waiting_for_reply),
    expectedKeywords: row.expected_keywords
      ? JSON.parse(row.expected_keywords)
      : null,
    context: row.context ? JSON.parse(row.context) : {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
