/**
 * 账号相关类型定义
 */

import type { Timestamped } from "./common.types";

// 账号信息
export interface Account extends Timestamped {
  id: string;
  cookies: string;
  userId?: string;
  nickname?: string;
  avatar?: string;
  enabled: boolean;
  remark?: string;
}

// 账号状态
export interface AccountStatus {
  accountId: string;
  connected: boolean;
  lastHeartbeat?: string;
  lastTokenRefresh?: string;
  errorMessage?: string;
}

// 账号用户信息
export interface AccountUserInfo {
  userId: string;
  displayName: string;
  avatar: string;
  soldCount?: number;
  followers?: string;
  following?: string;
}

// 创建/更新账号参数
export interface UpsertAccountParams {
  id: string;
  cookies: string;
  userId?: string;
  nickname?: string;
  avatar?: string;
  enabled?: boolean;
  remark?: string;
}

// 更新账号状态参数
export interface UpdateAccountStatusParams {
  accountId: string;
  connected?: boolean;
  lastHeartbeat?: string;
  lastTokenRefresh?: string;
  errorMessage?: string;
}
