/**
 * Goofish API 服务
 * 基于 axios 的 HTTP 请求封装
 */

import axios from 'axios'

const API_BASE = '/api'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// ==================== 账号管理 ====================
export const accountApi = {
  // 获取所有账号
  getAccounts: () => apiClient.get('/accounts'),
  
  // 获取单个账号
  getAccount: (id: string) => apiClient.get(`/accounts/${id}`),
  
  // 添加/更新账号
  saveAccount: (data: any) => apiClient.post('/accounts', data),
  
  // 删除账号
  deleteAccount: (id: string) => apiClient.delete(`/accounts/${id}`),
  
  // 启用/禁用账号
  toggleAccount: (id: string, enabled: boolean) => 
    apiClient.patch(`/accounts/${id}/enabled`, { enabled }),
  
  // 启动账号
  startAccount: (id: string) => apiClient.post(`/accounts/${id}/start`),
  
  // 停止账号
  stopAccount: (id: string) => apiClient.post(`/accounts/${id}/stop`),
  
  // 重启账号
  restartAccount: (id: string) => apiClient.post(`/accounts/${id}/restart`)
}

// ==================== 对话管理 ====================
export const conversationApi = {
  // 获取对话列表
  getConversations: (params?: any) => apiClient.get('/conversations', { params }),

  // 获取对话详情
  getConversation: (chatId: string) => apiClient.get(`/conversations/${chatId}`),

  // 标记已读
  markAsRead: (chatId: string, accountId?: string) =>
    accountId
      ? apiClient.post(`/conversations/${accountId}/${chatId}/read`)
      : apiClient.post(`/conversations/${chatId}/read`)
}

// ==================== 消息管理 ====================
export const messageApi = {
  // 获取消息列表
  getMessages: (params?: any) => apiClient.get('/messages', { params }),

  // 发送消息
  sendMessage: (data: { accountId: string; chatId: string; toUserId: string; text: string }) =>
    apiClient.post('/messages/send', data)
}

// ==================== 订单管理 ====================
export const orderApi = {
  // 获取订单列表
  getOrders: (params?: any) => apiClient.get('/orders', { params }),
  
  // 获取订单详情
  getOrder: (id: number) => apiClient.get(`/orders/${id}`),
  
  // 确认发货
  confirmShipment: (id: number, data: any) => 
    apiClient.post(`/orders/${id}/confirm-shipment`, data),
  
  // 免拼发货
  freeShipping: (id: number, data: any) => 
    apiClient.post(`/orders/${id}/free-shipping`, data)
}

// ==================== 自动回复 ====================
export const autoReplyApi = {
  // 获取规则列表
  getRules: () => apiClient.get('/autoreply'),
  
  // 创建规则
  createRule: (data: any) => apiClient.post('/autoreply', data),
  
  // 更新规则
  updateRule: (id: number, data: any) => apiClient.put(`/autoreply/${id}`, data),
  
  // 删除规则
  deleteRule: (id: number) => apiClient.delete(`/autoreply/${id}`)
}

// ==================== 自动发货 ====================
export const autoSellApi = {
  // 获取规则列表
  getRules: () => apiClient.get('/autosell'),
  
  // 创建规则
  createRule: (data: any) => apiClient.post('/autosell', data),
  
  // 更新规则
  updateRule: (id: number, data: any) => apiClient.put(`/autosell/${id}`, data),
  
  // 删除规则
  deleteRule: (id: number) => apiClient.delete(`/autosell/${id}`)
}

// ==================== 工作流 ====================
export const workflowApi = {
  // 获取工作流列表
  getWorkflows: () => apiClient.get('/workflows'),
  
  // 获取工作流详情
  getWorkflow: (id: number) => apiClient.get(`/workflows/${id}`),
  
  // 创建工作流
  createWorkflow: (data: any) => apiClient.post('/workflows', data),
  
  // 更新工作流
  updateWorkflow: (id: number, data: any) => apiClient.put(`/workflows/${id}`, data),
  
  // 删除工作流
  deleteWorkflow: (id: number) => apiClient.delete(`/workflows/${id}`)
}

// ==================== 日志 ====================
export const logApi = {
  // 获取当前运行日志
  getLogs: (params?: any) => apiClient.get('/logs/current', { params }),

  // 获取日志日期列表
  getDates: () => apiClient.get('/logs/dates'),

  // 获取指定日期的日志文件列表
  getFiles: (date: string) => apiClient.get(`/logs/files/${date}`),

  // 获取指定日志文件内容
  getContent: (date: string, file: string, params?: any) =>
    apiClient.get(`/logs/content/${date}/${file}`, { params })
}

// ==================== 系统状态 ====================
export const statusApi = {
  // 获取系统状态
  getStatus: () => apiClient.get('/status')
}

export default {
  account: accountApi,
  conversation: conversationApi,
  message: messageApi,
  order: orderApi,
  autoReply: autoReplyApi,
  autoSell: autoSellApi,
  workflow: workflowApi,
  log: logApi,
  status: statusApi
}
