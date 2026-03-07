/**
 * 自动回复相关类型定义
 */

// 匹配类型
export type MatchType = "exact" | "contains" | "regex" | "ai";

// 自动回复规则
export interface AutoReplyRule {
  id: number;
  name: string;
  enabled: boolean;
  priority: number;
  matchType: MatchType;
  matchPattern: string;
  replyContent: string;
  accountId: string | null;
  excludeMatch: boolean; // 排除匹配：匹配其他规则未匹配的内容
  createdAt?: string;
  updatedAt?: string;
}

// 数据库自动回复规则
export interface DbAutoReplyRule {
  id: number;
  name: string;
  enabled: number;
  priority: number;
  match_type: MatchType;
  match_pattern: string;
  reply_content: string;
  account_id: string | null;
  exclude_match: number; // 0 或 1
  created_at: string;
  updated_at: string;
}

// 创建规则参数
export interface CreateAutoReplyRuleParams {
  name: string;
  enabled?: boolean;
  priority?: number;
  matchType: MatchType;
  matchPattern: string;
  replyContent: string;
  accountId?: string | null;
  excludeMatch?: boolean;
}

// 更新规则参数
export interface UpdateAutoReplyRuleParams {
  name?: string;
  enabled?: boolean;
  priority?: number;
  matchType?: MatchType;
  matchPattern?: string;
  replyContent?: string;
  accountId?: string | null;
  excludeMatch?: boolean;
}

// 自动回复结果
export interface AutoReplyResult {
  matched: boolean;
  ruleName?: string;
  replyContent?: string;
  isAI?: boolean;
}
