/**
 * Goofish 闲鱼模块类型定义
 */

// 账号相关类型
export interface Account {
  id: string
  cookies: string
  userId?: string
  nickname?: string
  avatar?: string
  enabled: boolean
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface ClientStatus {
  accountId: string
  connected: boolean
  userId: string
}

export interface StatusResponse {
  clients: ClientStatus[]
  activeCount: number
  messageCount: number
}

// 消息相关类型
export interface Message {
  id: number
  accountId: string
  chatId?: string
  senderId?: string
  senderName?: string
  content?: string
  raw?: string
  createdAt?: string
}

// 对话相关类型
export interface Conversation {
  accountId: string
  chatId: string
  userId: string
  userName: string
  userAvatar?: string
  lastMessage?: string
  lastTime: number
  unread: number
  createdAt?: string
  updatedAt?: string
}

// 订单相关类型
export interface Order {
  id: number
  orderId: string
  accountId: string
  itemId?: string
  itemTitle?: string
  itemPicUrl?: string
  price?: string
  buyerUserId?: string
  buyerNickname?: string
  chatId?: string
  status: number
  statusText?: string
  orderTime?: string
  payTime?: string
  shipTime?: string
  completeTime?: string
  createdAt?: string
  updatedAt?: string
}

// 自动回复相关类型
export interface AutoReplyRule {
  id: number
  name: string
  enabled: boolean
  priority: number
  matchType: 'contains' | 'equals' | 'regex' | 'startsWith' | 'endsWith'
  matchPattern: string
  replyContent: string
  accountId?: string
  excludeMatch: boolean
  createdAt?: string
  updatedAt?: string
}

// 自动发货相关类型
export interface AutoSellRule {
  id: number
  name: string
  enabled: boolean
  itemId?: string
  accountId?: string
  deliveryType: 'static' | 'api'
  deliveryContent: string
  apiConfig?: string
  triggerOn: 'paid' | 'ordered'
  workflowId?: number
  createdAt?: string
  updatedAt?: string
}

// 工作流相关类型
export interface Workflow {
  id: number
  name: string
  description?: string
  definition: WorkflowDefinition
  isDefault: boolean
  enabled: boolean
  createdAt?: string
  updatedAt?: string
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export type WorkflowNodeType = 
  | 'trigger'
  | 'autoreply'
  | 'delivery'
  | 'ship'
  | 'delay'
  | 'condition'
  | 'notify'

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  position: { x: number; y: number }
  data: Record<string, any>
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  condition?: string
}

// 日志相关类型
export interface LogEntry {
  id: number
  level: 'info' | 'warn' | 'error' | 'debug' | 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
  timestamp?: string
  context?: string
}
