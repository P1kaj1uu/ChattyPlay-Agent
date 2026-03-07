import {
  createLogger,
  cleanOldLogs,
  setLogLevel,
  LogLevel,
} from "./core/logger";
import { ClientManager } from "./websocket";
import { initDatabase, closeDatabase } from "./db";
import {
  startServer,
  setClientManager,
  messageStore,
  conversationStore,
} from "./api";
import {
  fetchUserHead,
  handleOrderMessage,
  fetchAndUpdateOrderDetail,
} from "./services";
import { SERVER_CONFIG, LOG_CONFIG } from "./core/constants";

const logger = createLogger("Goofish:App");

// 保存 clientManager 引用供异步函数使用
let clientManager: ClientManager;

export async function startGoofishServer(port: number = 3001) {
  // 设置日志级别
  setLogLevel(LOG_CONFIG.LEVEL as LogLevel);

  // 清理过期日志
  cleanOldLogs(LOG_CONFIG.RETENTION_DAYS);

  logger.info("启动闲鱼多账号WebSocket客户端...");

  // 初始化数据库
  initDatabase();

  // 创建客户端管理器
  clientManager = new ClientManager(async (accountId, msg) => {
    logger.info(`收到新消息: ${msg.senderName}: ${msg.content}`);
    messageStore.add(msg);
    conversationStore.addIncoming(accountId, msg);

    // 处理订单状态消息
    if (msg.isOrderMessage && msg.orderId) {
      logger.info(`订单消息: orderId=${msg.orderId}`);
      handleOrderMessage(accountId, msg.orderId, msg.chatId);
      // 异步获取订单详情
      fetchOrderDetailAsync(accountId, msg.orderId);
    }

    // 异步获取用户头像（不阻塞消息处理）
    fetchUserAvatarAsync(accountId, msg.chatId, msg.senderId);
  });

  // 设置 API 客户端管理器引用
  setClientManager(clientManager);

  // 启动 API 服务器
  startServer(port);

  // 从数据库加载并启动所有启用的账号
  await clientManager.startAll();

  // 优雅退出
  process.on("SIGINT", () => {
    logger.info("收到退出信号，正在断开连接...");
    clientManager.stopAll();
    closeDatabase();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    logger.info("收到终止信号，正在断开连接...");
    clientManager.stopAll();
    closeDatabase();
    process.exit(0);
  });

  logger.info("Goofish 系统已启动，等待消息...");
}

// 异步获取用户头像
async function fetchUserAvatarAsync(
  accountId: string,
  chatId: string,
  userId: string,
) {
  try {
    const { userHead } = await fetchUserHead(accountId, userId);

    if (userHead?.avatar) {
      conversationStore.updateUserAvatar(accountId, chatId, userHead.avatar);
    }
  } catch (e) {
    logger.debug(`获取用户头像失败: ${e}`);
  }
}

// 异步获取订单详情
async function fetchOrderDetailAsync(accountId: string, orderId: string) {
  try {
    const client = clientManager.getClient(accountId);
    if (!client) {
      logger.warn(`获取订单详情失败: 账号 ${accountId} 客户端不存在`);
      return;
    }
    await fetchAndUpdateOrderDetail(client, orderId);
  } catch (e) {
    logger.debug(`获取订单详情失败: ${e}`);
  }
}
