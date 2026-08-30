/**
 * WebSocket 推送路由
 * 替代 SSE，使用 WebSocket 实现实时数据推送
 */

import { Hono } from "hono";
import type { WSContext } from "hono/ws";

import { createLogger } from "../../core/logger";
import { appEvents, Events } from "../../core/event-emitter";
import { getOrders, getOrderCount } from "../../db/order.repository";
import { getAllAccounts } from "../../db/account.repository";
import { getAllConversations } from "../../services/conversation.service";
import type { ClientManager } from "../../websocket/client.manager";

const logger = createLogger("Api:WS");

// 存储所有 WebSocket 连接
const wsClients = new Set<{
  ws: WSContext;
  subscriptions: Set<string>;
  params: Record<string, string | number | undefined>;
}>();

// 发送数据到订阅了特定事件的客户端
function broadcast(
  event: string,
  getData: (params: Record<string, string | number | undefined>) => unknown,
) {
  // @ts-ignore
  for (const client of wsClients) {
    if (client.subscriptions.has(event)) {
      try {
        const data = getData(client.params);
        client.ws.send(JSON.stringify({ event, data }));
      } catch (e) {
        logger.debug(`WebSocket 推送失败: ${e}`);
      }
    }
  }
}

// 初始化事件监听（只需要一次）
let eventsInitialized = false;

export function initWSEvents(getClientManager: () => ClientManager | null) {
  if (eventsInitialized) return;
  eventsInitialized = true;

  // 订单更新
  appEvents.on(Events.ORDERS_UPDATED, () => {
    broadcast("orders", (params) => {
      const orders = getOrders({
        accountId: params.accountId as string | undefined,
        status: params.status as number | undefined,
        limit: 50,
        offset: 0,
      });
      const total = getOrderCount({
        accountId: params.accountId as string | undefined,
        status: params.status as number | undefined,
      });
      return { orders, total };
    });
  });

  // 账号更新
  appEvents.on(Events.ACCOUNTS_UPDATED, () => {
    broadcast("accounts", () => {
      const accounts = getAllAccounts();
      const clientManager = getClientManager();
      const clients = clientManager?.getStatus() || [];
      return { accounts, clients };
    });
  });

  // 对话更新
  appEvents.on(Events.CONVERSATIONS_UPDATED, () => {
    broadcast("conversations", (params) => {
      const limit = (params.limit as number) || 20;
      const { conversations, total } = getAllConversations(limit, 0);
      return { conversations, total };
    });
  });

  logger.info("WebSocket 事件监听已初始化");
}

export function createWSPushHandler(
  getClientManager: () => ClientManager | null,
) {
  // 确保事件监听已初始化
  initWSEvents(getClientManager);

  return {
    onOpen(_event: Event, ws: WSContext) {
      const client = {
        ws,
        subscriptions: new Set<string>(),
        params: {} as Record<string, string | number | undefined>,
      };
      wsClients.add(client);
      logger.debug(`WebSocket 连接建立，当前连接数: ${wsClients.size}`);
    },

    onMessage(event: MessageEvent, ws: WSContext) {
      try {
        const msg = JSON.parse(event.data as string);
        // @ts-ignore
        const client = [...wsClients].find((c) => c.ws === ws);
        if (!client) return;

        // 订阅消息格式: { action: 'subscribe', events: ['orders', 'accounts'], params: { accountId: '...' } }
        if (msg.action === "subscribe" && Array.isArray(msg.events)) {
          for (const evt of msg.events) {
            client.subscriptions.add(evt);
          }
          if (msg.params) {
            Object.assign(client.params, msg.params);
          }

          // 立即发送当前数据
          for (const evt of msg.events) {
            sendInitialData(ws, evt, client.params, getClientManager);
          }

          logger.debug(`客户端订阅: ${msg.events.join(", ")}`);
        }

        // 取消订阅: { action: 'unsubscribe', events: ['orders'] }
        if (msg.action === "unsubscribe" && Array.isArray(msg.events)) {
          for (const evt of msg.events) {
            client.subscriptions.delete(evt);
          }
        }

        // 更新参数: { action: 'updateParams', params: { accountId: '...' } }
        if (msg.action === "updateParams" && msg.params) {
          Object.assign(client.params, msg.params);
          // 重新发送订阅的数据
          for (const evt of client.subscriptions) {
            sendInitialData(ws, evt, client.params, getClientManager);
          }
        }
      } catch {
        // 忽略解析错误
      }
    },

    onClose() {
      // @ts-ignore
      for (const client of wsClients) {
        if (client.ws.readyState >= 2) {
          // CLOSING or CLOSED
          wsClients.delete(client);
        }
      }
      logger.debug(`WebSocket 连接关闭，当前连接数: ${wsClients.size}`);
    },

    onError() {
      // 清理已关闭的连接
      // @ts-ignore
      for (const client of wsClients) {
        if (client.ws.readyState >= 2) {
          wsClients.delete(client);
        }
      }
    },
  };
}

// 发送初始数据
function sendInitialData(
  ws: WSContext,
  event: string,
  params: Record<string, string | number | undefined>,
  getClientManager: () => ClientManager | null,
) {
  try {
    let data: unknown;

    switch (event) {
      case "orders": {
        const orders = getOrders({
          accountId: params.accountId as string | undefined,
          status: params.status as number | undefined,
          limit: 50,
          offset: 0,
        });
        const total = getOrderCount({
          accountId: params.accountId as string | undefined,
          status: params.status as number | undefined,
        });
        data = { orders, total };
        break;
      }
      case "accounts": {
        const accounts = getAllAccounts();
        const clientManager = getClientManager();
        const clients = clientManager?.getStatus() || [];
        data = { accounts, clients };
        break;
      }
      case "conversations": {
        const limit = (params.limit as number) || 20;
        const { conversations, total } = getAllConversations(limit, 0);
        data = { conversations, total };
        break;
      }
      default:
        return;
    }

    ws.send(JSON.stringify({ event, data }));
  } catch (e) {
    logger.debug(`发送初始数据失败: ${e}`);
  }
}

// 获取当前连接数（用于调试）
export function getWSClientCount() {
  return wsClients.size;
}
