/**
 * 服务层统一导出
 */

// 自动回复服务
export { checkAutoReply, getMatchTypeName } from "./autoreply.service";

// 对话服务
export {
  addIncomingMessage,
  addOutgoingMessage,
  updateUserAvatar,
  getAllConversations,
  getConversationDetail,
  markAsRead,
} from "./conversation.service";

// 消息服务
export {
  addMessage,
  getRecentMessages,
  getAllMessages,
  getMessageCount,
  clearMessages,
} from "./message.service";

// 商品服务
export { fetchGoodsList } from "./goods.service";

// 用户服务
export {
  getCachedUserHead,
  isUserHeadCached,
  fetchUserHead,
  fetchLoginUserId,
  fetchUserProfile,
  fetchUserInfo,
} from "./user.service";

// 订单服务
export {
  getOrderList,
  getOrder,
  handleOrderMessage,
  fetchAndUpdateOrderDetail,
} from "./order.service";

// AI 服务
export { generateAIReply, testAIConnection } from "./ai.service";

// 自动发货服务
export { processAutoSell, getRuleStockStatus } from "./autosell.service";

// 流程执行服务
export { startWorkflowExecution, handleUserReply } from "./workflow.service";
