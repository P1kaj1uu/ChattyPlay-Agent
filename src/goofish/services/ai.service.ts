/**
 * AI 回复服务
 */

import OpenAI from "openai";

import { createLogger } from "../core/logger";
import { getAISettings } from "../db/index";
import {
  AI_TOOLS,
  queryBuyerOrders,
  getChatHistory,
  type OrderQueryContext,
} from "../ai-tools/index";

const logger = createLogger("Svc:AI");

let openaiClient: OpenAI | null = null;
let lastSettings: string = "";

// 获取或创建 OpenAI 客户端
function getClient(): OpenAI | null {
  const settings = getAISettings();

  if (!settings.apiKey) {
    return null;
  }

  const settingsKey = `${settings.baseUrl}|${settings.apiKey}`;

  if (openaiClient && lastSettings === settingsKey) {
    return openaiClient;
  }

  openaiClient = new OpenAI({
    apiKey: settings.apiKey,
    baseURL: settings.baseUrl || undefined,
  });
  lastSettings = settingsKey;

  return openaiClient;
}

export interface AIContext {
  userName?: string;
  itemTitle?: string;
  accountId?: string;
  buyerUserId?: string;
  chatId?: string;
}

/**
 * 执行工具调用
 */
function executeToolCall(toolName: string, _args: any, ctx: AIContext): string {
  logger.info(
    `执行工具调用: ${toolName}, accountId=${ctx.accountId}, buyerUserId=${ctx.buyerUserId}`,
  );

  switch (toolName) {
    case "query_buyer_orders": {
      if (!ctx.accountId || !ctx.buyerUserId) {
        return JSON.stringify({ success: false, message: "无法获取买家信息" });
      }
      const orderCtx: OrderQueryContext = {
        accountId: ctx.accountId,
        buyerUserId: ctx.buyerUserId,
      };
      const result = queryBuyerOrders(orderCtx);
      logger.info(`订单查询结果: ${JSON.stringify(result)}`);
      return JSON.stringify(result);
    }
    default:
      return JSON.stringify({ success: false, message: "未知工具" });
  }
}

/**
 * 生成 AI 回复
 */
export async function generateAIReply(
  userMessage: string,
  context?: AIContext,
  rulePrompt?: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    logger.warn("AI 服务未配置");
    return null;
  }

  const settings = getAISettings();

  try {
    // 优先使用规则级别的提示词，否则使用全局提示词
    let systemPrompt =
      rulePrompt ||
      settings.systemPrompt ||
      "你是一个闲鱼卖家的智能客服助手，请用简洁友好的语气回复买家的消息。";

    // 如果启用了工具，添加工具使用说明
    if (context?.accountId && context?.buyerUserId) {
      systemPrompt +=
        "\n\n你可以使用 query_buyer_orders 工具查询当前买家在本店的订单信息。当买家询问订单相关问题时，请先调用此工具获取订单数据再回复。";
    }

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    // 添加上下文信息
    if (context?.userName || context?.itemTitle) {
      let contextMsg = "当前对话信息：";
      if (context.userName) contextMsg += `买家昵称: ${context.userName}；`;
      if (context.itemTitle) contextMsg += `商品: ${context.itemTitle}；`;
      messages.push({ role: "system", content: contextMsg });
    }

    // 添加聊天历史作为上下文
    if (context?.accountId && context?.chatId) {
      const history = getChatHistory(
        { accountId: context.accountId, chatId: context.chatId },
        10,
      );
      if (history.length > 0) {
        logger.debug(`加载 ${history.length} 条历史消息作为上下文`);
        for (const msg of history) {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // 添加当前用户消息
    messages.push({ role: "user", content: userMessage });

    // 判断是否启用工具（需要有买家信息）
    const enableTools = !!(context?.accountId && context?.buyerUserId);

    logger.info(`AI 调用: enableTools=${enableTools}, model=${settings.model}`);

    const requestParams: OpenAI.ChatCompletionCreateParams = {
      model: settings.model || "gpt-3.5-turbo",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    };

    if (enableTools) {
      requestParams.tools = AI_TOOLS;
      requestParams.tool_choice = "auto";
      logger.info(
        `已启用工具: ${AI_TOOLS.map((t) => t.function.name).join(", ")}`,
      );
    }

    const response = await client.chat.completions.create(requestParams);

    const choice = response.choices[0];
    logger.info(
      `AI 响应: finish_reason=${choice?.finish_reason}, has_tool_calls=${!!choice?.message?.tool_calls}`,
    );

    // 处理工具调用（有些模型 finish_reason 可能不是 tool_calls 但仍有 tool_calls）
    if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
      const toolCalls = choice.message.tool_calls as Array<{
        id: string;
        function: { name: string; arguments: string };
      }>;
      logger.info(
        `AI 请求调用工具: ${toolCalls.map((t) => t.function.name).join(", ")}`,
      );

      // 添加助手消息
      messages.push(choice.message);

      // 执行工具调用并添加结果
      for (const toolCall of toolCalls) {
        const toolResult = executeToolCall(
          toolCall.function.name,
          JSON.parse(toolCall.function.arguments || "{}"),
          context || {},
        );
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
        logger.debug(
          `工具 ${toolCall.function.name} 返回: ${toolResult.slice(0, 100)}...`,
        );
      }

      // 再次调用获取最终回复
      const finalResponse = await client.chat.completions.create({
        model: settings.model || "gpt-3.5-turbo",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = finalResponse.choices[0]?.message?.content?.trim();
      if (reply) {
        logger.info(
          `AI 回复生成成功(含工具): ${userMessage.slice(0, 30)}... -> ${reply.slice(0, 30)}...`,
        );
        return reply;
      }
    }

    // 直接回复
    const reply = choice?.message?.content?.trim();

    if (reply) {
      logger.info(
        `AI 回复生成成功: ${userMessage.slice(0, 30)}... -> ${reply.slice(0, 30)}...`,
      );
      return reply;
    }

    return null;
  } catch (e) {
    logger.error(`AI 回复生成失败: ${e}`);
    return null;
  }
}

/**
 * 测试 AI 连接
 */
export async function testAIConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  const client = getClient();
  if (!client) {
    return { success: false, error: "AI 服务未配置，请先设置 API Key" };
  }

  const settings = getAISettings();

  try {
    const response = await client.chat.completions.create({
      model: settings.model || "gpt-3.5-turbo",
      messages: [{ role: "user", content: "你好" }],
      max_tokens: 10,
    });

    if (response.choices[0]?.message?.content) {
      return { success: true };
    }
    return { success: false, error: "未收到有效响应" };
  } catch (e: any) {
    return { success: false, error: e.message || "连接失败" };
  }
}
