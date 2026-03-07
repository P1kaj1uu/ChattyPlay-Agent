/**
 * 通用类型定义
 */

// 分页参数
export interface PaginationParams {
  limit: number;
  offset: number;
}

// 分页结果
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// API 响应基础结构
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 时间戳相关
export interface Timestamped {
  createdAt?: string;
  updatedAt?: string;
}
