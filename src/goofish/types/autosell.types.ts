/**
 * 自动发货相关类型定义
 */

// 发货类型
export type DeliveryType = "fixed" | "stock" | "api";

// 触发时机
export type TriggerOn = "paid" | "confirmed";

// API 配置
export interface ApiConfig {
  url: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  body?: string;
  responseField?: string; // 响应中取货字段路径
}

// 自动发货规则
export interface AutoSellRule {
  id: number;
  name: string;
  enabled: boolean;
  itemId: string | null;
  accountId: string | null;
  deliveryType: DeliveryType;
  deliveryContent: string | null;
  apiConfig: ApiConfig | null;
  triggerOn: TriggerOn;
  workflowId: number | null;
  stockCount?: number; // 库存数量（仅stock类型）
  usedCount?: number; // 已用数量
  createdAt?: string;
  updatedAt?: string;
}

// 数据库自动发货规则
export interface DbAutoSellRule {
  id: number;
  name: string;
  enabled: number;
  item_id: string | null;
  account_id: string | null;
  delivery_type: DeliveryType;
  delivery_content: string | null;
  api_config: string | null;
  trigger_on: TriggerOn;
  created_at: string;
  updated_at: string;
}

// 库存项
export interface StockItem {
  id: number;
  ruleId: number;
  content: string;
  used: boolean;
  usedOrderId: string | null;
  createdAt: string;
  usedAt: string | null;
}

// 数据库库存项
export interface DbStockItem {
  id: number;
  rule_id: number;
  content: string;
  used: number;
  used_order_id: string | null;
  created_at: string;
  used_at: string | null;
}

// 发货记录
export interface DeliveryLog {
  id: number;
  ruleId: number | null;
  orderId: string;
  accountId: string;
  deliveryType: DeliveryType;
  content: string;
  status: "success" | "failed";
  errorMessage: string | null;
  createdAt: string;
}

// 数据库发货记录
export interface DbDeliveryLog {
  id: number;
  rule_id: number | null;
  order_id: string;
  account_id: string;
  delivery_type: DeliveryType;
  content: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

// 创建规则参数
export interface CreateAutoSellRuleParams {
  name: string;
  enabled?: boolean;
  itemId?: string | null;
  accountId?: string | null;
  deliveryType: DeliveryType;
  deliveryContent?: string | null;
  apiConfig?: ApiConfig | null;
  triggerOn?: TriggerOn;
  workflowId?: number | null;
}

// 更新规则参数
export interface UpdateAutoSellRuleParams {
  name?: string;
  enabled?: boolean;
  itemId?: string | null;
  accountId?: string | null;
  deliveryType?: DeliveryType;
  deliveryContent?: string | null;
  apiConfig?: ApiConfig | null;
  triggerOn?: TriggerOn;
  workflowId?: number | null;
}

// 发货结果
export interface DeliveryResult {
  success: boolean;
  content?: string;
  error?: string;
}
