/**
 * 数据库模块统一导出
 */

import { db, closeDatabase, getDbPath } from "./connection";
import { runMigrations } from "./migrations";
import { createLogger } from "../core/logger";

const logger = createLogger("Db");

// 初始化数据库
export function initDatabase() {
  logger.info(`初始化数据库: ${getDbPath()}`);
  runMigrations();
  logger.info("数据库初始化完成");
}

// 导出连接
export { db, closeDatabase };

// 导出仓库函数
export {
  getEnabledAccounts,
  getAllAccounts,
  getAccount,
  upsertAccount,
  updateAccountUserInfo,
  updateAccountCookies,
  updateAccountEnabled,
  deleteAccount,
  updateAccountStatus,
  getAccountStatus,
} from "./account.repository";

export {
  getConversations,
  getConversationCount,
  getConversation,
  upsertConversation,
  updateConversationAvatar,
  markConversationRead,
  getConversationMessages,
  getConversationMessageCount,
  addConversationMessage,
} from "./conversation.repository";

export {
  getAutoReplyRules,
  getEnabledAutoReplyRules,
  getAutoReplyRule,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  toggleAutoReplyRule,
} from "./autoreply.repository";

export {
  getUserAvatar,
  saveUserAvatar,
  hasUserAvatar,
} from "./user-avatar.repository";

export {
  getOrders,
  getOrderCount,
  getOrderById,
  upsertOrder,
  updateOrderStatus,
  deleteOrder,
} from "./order.repository";

export {
  getSetting,
  setSetting,
  deleteSetting,
  getSettings,
  getAISettings,
  saveAISettings,
  AI_SETTINGS_KEYS,
} from "./settings.repository";

export {
  getAutoSellRules,
  getEnabledAutoSellRules,
  getAutoSellRule,
  createAutoSellRule,
  updateAutoSellRule,
  deleteAutoSellRule,
  toggleAutoSellRule,
  getStockItems,
  getStockStats,
  addStockItems,
  consumeStock,
  clearStock,
  addDeliveryLog,
  getDeliveryLogs,
  hasDelivered,
} from "./autosell.repository";

export {
  getWorkflows,
  getWorkflowById,
  getDefaultWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  createWorkflowExecution,
  getWorkflowExecution,
  getWorkflowExecutionByOrderId,
  getWaitingExecutions,
  updateWorkflowExecution,
} from "./workflow.repository";
