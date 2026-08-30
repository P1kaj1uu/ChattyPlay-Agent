/**
 * 全局事件发射器
 * 用于数据变化时通知 SSE 推送
 * 使用防抖机制避免频繁触发
 */

import { EventEmitter } from "events";

export const appEvents = new EventEmitter();

// 增加最大监听器数量（SSE 连接可能较多）
appEvents.setMaxListeners(50);

// 事件类型
export const Events = {
  ORDERS_UPDATED: "orders:updated",
  ACCOUNTS_UPDATED: "accounts:updated",
  CONVERSATIONS_UPDATED: "conversations:updated",
} as const;

// 防抖定时器
const debounceTimers: Record<string, NodeJS.Timeout | null> = {
  orders: null,
  accounts: null,
  conversations: null,
};

// 防抖延迟（毫秒）
const DEBOUNCE_DELAY = 100;

// 触发订单更新事件（防抖）
export function emitOrdersUpdated() {
  if (debounceTimers.orders) {
    clearTimeout(debounceTimers.orders);
  }
  debounceTimers.orders = setTimeout(() => {
    appEvents.emit(Events.ORDERS_UPDATED);
    debounceTimers.orders = null;
  }, DEBOUNCE_DELAY);
}

// 触发账号更新事件（防抖）
export function emitAccountsUpdated() {
  if (debounceTimers.accounts) {
    clearTimeout(debounceTimers.accounts);
  }
  debounceTimers.accounts = setTimeout(() => {
    appEvents.emit(Events.ACCOUNTS_UPDATED);
    debounceTimers.accounts = null;
  }, DEBOUNCE_DELAY);
}

// 触发对话更新事件（防抖）
export function emitConversationsUpdated() {
  if (debounceTimers.conversations) {
    clearTimeout(debounceTimers.conversations);
  }
  debounceTimers.conversations = setTimeout(() => {
    appEvents.emit(Events.CONVERSATIONS_UPDATED);
    debounceTimers.conversations = null;
  }, DEBOUNCE_DELAY);
}
