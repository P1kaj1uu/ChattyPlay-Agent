import { Hono } from "hono";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import {
  getAutoReplyRules,
  getAutoReplyRule,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  toggleAutoReplyRule,
  getAISettings,
  saveAISettings,
} from "../../db/index";
import { testAIConnection } from "../../services/index";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 读取默认提示词
function getDefaultPrompt(): string {
  try {
    const promptPath = join(__dirname, "../../assets/default-prompt.md");
    return readFileSync(promptPath, "utf-8");
  } catch {
    return "你是一个闲鱼卖家的智能客服助手，请用简洁友好的语气回复买家的消息。";
  }
}

export function createAutoReplyRoutes() {
  const router = new Hono();

  // ========== AI 设置 ==========

  // 获取 AI 设置
  router.get("/ai", (c) => {
    const settings = getAISettings();
    return c.json({
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey ? "******" : "",
      hasApiKey: !!settings.apiKey,
      model: settings.model,
      systemPrompt: settings.systemPrompt,
    });
  });

  // 保存 AI 设置
  router.put("/ai", async (c) => {
    const body = await c.req.json();
    const { baseUrl, apiKey, model, systemPrompt } = body;

    const updates: any = {};
    if (baseUrl !== undefined) updates.baseUrl = baseUrl;
    if (apiKey !== undefined && apiKey !== "******") updates.apiKey = apiKey;
    if (model !== undefined) updates.model = model;
    if (systemPrompt !== undefined) updates.systemPrompt = systemPrompt;

    saveAISettings(updates);
    return c.json({ success: true });
  });

  // 测试 AI 连接
  router.post("/ai/test", async (c) => {
    const result = await testAIConnection();
    return c.json(result);
  });

  // 获取默认提示词
  router.get("/ai/default-prompt", (c) => {
    return c.json({ prompt: getDefaultPrompt() });
  });

  // ========== 规则管理 ==========

  // 获取所有规则
  router.get("/", (c) => {
    const rules = getAutoReplyRules();
    return c.json({
      rules: rules.map((r) => ({
        id: r.id,
        name: r.name,
        enabled: r.enabled === 1,
        priority: r.priority,
        matchType: r.match_type,
        matchPattern: r.match_pattern,
        replyContent: r.reply_content,
        accountId: r.account_id,
        excludeMatch: r.exclude_match === 1,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    });
  });

  // 获取单个规则
  router.get("/:id", (c) => {
    const id = parseInt(c.req.param("id"));
    const rule = getAutoReplyRule(id);
    if (!rule) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json({
      id: rule.id,
      name: rule.name,
      enabled: rule.enabled === 1,
      priority: rule.priority,
      matchType: rule.match_type,
      matchPattern: rule.match_pattern,
      replyContent: rule.reply_content,
      accountId: rule.account_id,
      excludeMatch: rule.exclude_match === 1,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
    });
  });

  // 创建规则
  router.post("/", async (c) => {
    const body = await c.req.json();
    const {
      name,
      enabled,
      priority,
      matchType,
      matchPattern,
      replyContent,
      accountId,
      excludeMatch,
    } = body;

    if (!name || !matchType) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    // 排除匹配规则不需要匹配内容，AI 类型也不需要强制填写
    if (
      !excludeMatch &&
      matchType !== "ai" &&
      (!matchPattern || !replyContent)
    ) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    if (!["exact", "contains", "regex", "ai"].includes(matchType)) {
      return c.json({ error: "Invalid matchType" }, 400);
    }

    // AI 规则：如果提示词为空，填入全局提示词
    let finalReplyContent = replyContent || "";
    if (matchType === "ai" && !finalReplyContent) {
      const aiSettings = getAISettings();
      finalReplyContent = aiSettings.systemPrompt || "";
    }

    const id = createAutoReplyRule({
      name,
      enabled: enabled !== false,
      priority: priority || 0,
      matchType,
      matchPattern: matchPattern || "",
      replyContent: finalReplyContent,
      accountId: accountId || null,
      excludeMatch: excludeMatch || false,
    });

    return c.json({ success: true, id });
  });

  // 更新规则
  router.put("/:id", async (c) => {
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json();

    if (
      body.matchType &&
      !["exact", "contains", "regex", "ai"].includes(body.matchType)
    ) {
      return c.json({ error: "Invalid matchType" }, 400);
    }

    // AI 规则：如果提示词为空，填入全局提示词
    if (body.matchType === "ai" && !body.replyContent) {
      const aiSettings = getAISettings();
      body.replyContent = aiSettings.systemPrompt || "";
    }

    const success = updateAutoReplyRule(id, body);
    if (!success) {
      return c.json({ error: "Rule not found" }, 404);
    }

    return c.json({ success: true });
  });

  // 删除规则
  router.delete("/:id", (c) => {
    const id = parseInt(c.req.param("id"));
    const success = deleteAutoReplyRule(id);
    if (!success) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json({ success: true });
  });

  // 切换规则启用状态
  router.post("/:id/toggle", (c) => {
    const id = parseInt(c.req.param("id"));
    const success = toggleAutoReplyRule(id);
    if (!success) {
      return c.json({ error: "Rule not found" }, 404);
    }
    return c.json({ success: true });
  });

  return router;
}
