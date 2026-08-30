/**
 * 自动回复服务
 */

import { createLogger } from "../core/logger";
import { getEnabledAutoReplyRules } from "../db/index";
import { generateAIReply, type AIContext } from "./ai.service";
import type {
  ChatMessage,
  DbAutoReplyRule,
  AutoReplyResult,
} from "../types/index";

const logger = createLogger("Svc:AutoReply");

/**
 * 检查消息是否匹配自动回复规则
 */
export async function checkAutoReply(
  accountId: string,
  msg: ChatMessage,
  context?: { userName?: string; itemTitle?: string },
): Promise<AutoReplyResult> {
  const rules = getEnabledAutoReplyRules(accountId);

  // 分离普通规则和排除匹配规则
  const normalRules = rules.filter((r) => !r.exclude_match);
  const excludeRules = rules.filter((r) => r.exclude_match);

  // 构建 AI 上下文，包含买家信息用于工具调用
  const aiContext: AIContext = {
    userName: context?.userName || msg.senderName,
    itemTitle: context?.itemTitle,
    accountId,
    buyerUserId: msg.senderId,
    chatId: msg.chatId,
  };

  // 先检查普通规则
  for (const rule of normalRules) {
    // AI 规则特殊处理
    if (rule.match_type === "ai") {
      if (matchAITrigger(rule, msg.content)) {
        const rulePrompt = rule.reply_content || undefined;
        const aiReply = await generateAIReply(
          msg.content,
          aiContext,
          rulePrompt,
        );
        if (aiReply) {
          logger.info(`[${accountId}] AI 回复: ${msg.content} -> ${aiReply}`);
          return {
            matched: true,
            ruleName: rule.name,
            replyContent: aiReply,
            isAI: true,
          };
        }
      }
      continue;
    }

    // 普通规则匹配
    if (matchRule(rule, msg.content)) {
      logger.info(
        `[${accountId}] 消息匹配规则 "${rule.name}": ${msg.content} -> ${rule.reply_content}`,
      );
      return {
        matched: true,
        ruleName: rule.name,
        replyContent: rule.reply_content,
      };
    }
  }

  // 普通规则都没匹配，检查排除匹配规则
  for (const rule of excludeRules) {
    // AI 类型的排除匹配规则
    if (rule.match_type === "ai") {
      const rulePrompt = rule.reply_content || undefined;
      const aiReply = await generateAIReply(msg.content, aiContext, rulePrompt);
      if (aiReply) {
        logger.info(
          `[${accountId}] AI 排除匹配回复: ${msg.content} -> ${aiReply}`,
        );
        return {
          matched: true,
          ruleName: rule.name,
          replyContent: aiReply,
          isAI: true,
        };
      }
      continue;
    }

    // 普通排除匹配规则
    logger.info(
      `[${accountId}] 排除匹配规则 "${rule.name}": ${msg.content} -> ${rule.reply_content}`,
    );
    return {
      matched: true,
      ruleName: rule.name,
      replyContent: rule.reply_content,
    };
  }

  return { matched: false };
}

/**
 * 检查是否触发 AI 回复
 */
function matchAITrigger(rule: DbAutoReplyRule, content: string): boolean {
  const pattern = rule.match_pattern.trim();

  // 空模式表示匹配所有消息
  if (!pattern || pattern === "*") {
    return true;
  }

  // 支持关键词列表（逗号分隔）
  const keywords = pattern
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  if (keywords.length === 0) {
    return true;
  }

  const text = content.trim().toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}

/**
 * 检查内容是否匹配规则
 */
function matchRule(rule: DbAutoReplyRule, content: string): boolean {
  const pattern = rule.match_pattern;
  const text = content.trim();

  switch (rule.match_type) {
    case "exact":
      return text === pattern;
    case "contains":
      return text.includes(pattern);
    case "regex":
      try {
        const regex = new RegExp(pattern, "i");
        return regex.test(text);
      } catch (e) {
        logger.warn(`规则 "${rule.name}" 的正则表达式无效: ${pattern}`);
        return false;
      }
    default:
      return false;
  }
}

/**
 * 获取匹配类型的显示名称
 */
export function getMatchTypeName(type: string): string {
  switch (type) {
    case "exact":
      return "精确匹配";
    case "contains":
      return "包含关键词";
    case "regex":
      return "正则表达式";
    case "ai":
      return "AI 回复";
    default:
      return type;
  }
}
