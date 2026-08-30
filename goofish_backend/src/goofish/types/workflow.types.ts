/**
 * 发货流程相关类型定义
 */

// 流程节点类型
export type WorkflowNodeType =
  | "trigger" // 触发节点（开始）
  | "autoreply" // 自动回复节点（等待用户确认）
  | "delivery" // 发货节点
  | "ship" // 标记发货节点
  | "delay" // 延迟节点
  | "condition" // 条件节点
  | "notify"; // 通知节点

// 流程节点
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  name: string;
  // 节点配置
  config: {
    // delivery: 发货方式 (virtual=虚拟发货, freeshipping=免拼发货)
    deliveryMode?: "virtual" | "freeshipping";
    // autoreply: 提示消息
    promptMessage?: string;
    // autoreply: 期望的用户回复关键词
    keywords?: string[];
    // autoreply: 匹配模式
    matchMode?: "exact" | "contains";
    // delay: 延迟毫秒数
    delayMs?: number;
    // delay: 延迟模式 (fixed=固定, random=浮动)
    delayMode?: "fixed" | "random";
    // delay: 浮动模式最小毫秒
    delayMinMs?: number;
    // delay: 浮动模式最大毫秒
    delayMaxMs?: number;
    // condition: 条件表达式
    expression?: string;
    // notify: 通知消息
    message?: string;
    // 兼容旧字段
    autoReplyRuleId?: number;
    expectedKeywords?: string[];
    delaySeconds?: number;
    condition?: string;
  };
  // 位置信息（用于编辑器）
  posX: number;
  posY: number;
}

// 流程连接
export interface WorkflowConnection {
  fromNode: string;
  fromOutput: string;
  toNode: string;
  toInput: string;
}

// 流程定义
export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
}

// 流程记录
export interface Workflow {
  id: number;
  name: string;
  description: string | null;
  definition: WorkflowDefinition;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// 流程执行状态
export type WorkflowExecutionStatus =
  | "pending"
  | "running"
  | "waiting"
  | "completed"
  | "failed";

// 流程执行记录
export interface WorkflowExecution {
  id: number;
  workflowId: number;
  orderId: string;
  accountId: string;
  ruleId: number;
  status: WorkflowExecutionStatus;
  currentNodeId: string | null;
  // 等待用户回复的相关信息
  waitingForReply: boolean;
  expectedKeywords: string[] | null;
  // 执行上下文数据
  context: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 默认流程：触发 -> 发货 -> 标记发货
export const DEFAULT_WORKFLOW: WorkflowDefinition = {
  nodes: [
    {
      id: "trigger",
      type: "trigger",
      name: "触发",
      config: {},
      posX: 100,
      posY: 200,
    },
    {
      id: "delivery",
      type: "delivery",
      name: "发货",
      config: {},
      posX: 350,
      posY: 200,
    },
    {
      id: "ship",
      type: "ship",
      name: "标记发货",
      config: {},
      posX: 600,
      posY: 200,
    },
  ],
  connections: [
    {
      fromNode: "trigger",
      fromOutput: "output_1",
      toNode: "delivery",
      toInput: "input_1",
    },
    {
      fromNode: "delivery",
      fromOutput: "output_1",
      toNode: "ship",
      toInput: "input_1",
    },
  ],
};
