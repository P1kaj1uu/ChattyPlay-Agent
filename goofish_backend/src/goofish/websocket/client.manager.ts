import { GoofishClient } from "./client";
import { createLogger } from "../core/logger";
import { getEnabledAccounts, updateAccountStatus } from "../db/index";
import type { MessageCallback } from "../types/index";

const logger = createLogger("Ws:Manager");

export class ClientManager {
  private clients: Map<string, GoofishClient> = new Map();
  private onMessage?: MessageCallback;

  constructor(onMessage?: MessageCallback) {
    this.onMessage = onMessage;
  }

  // 从数据库加载并启动所有启用的账号
  async startAll(): Promise<void> {
    const accounts = getEnabledAccounts();
    logger.info(`从数据库加载了 ${accounts.length} 个启用的账号`);

    for (const account of accounts) {
      await this.startClient(account.id);
    }
  }

  // 启动单个客户端
  async startClient(accountId: string): Promise<boolean> {
    if (this.clients.has(accountId)) {
      logger.warn(`账号 ${accountId} 已在运行中`);
      return false;
    }

    try {
      const client = new GoofishClient(accountId, this.onMessage);
      const success = await client.run();

      if (success) {
        this.clients.set(accountId, client);
        logger.info(`账号 ${accountId} 启动成功`);
        return true;
      } else {
        logger.error(`账号 ${accountId} 启动失败`);
        updateAccountStatus({
          accountId,
          connected: false,
          errorMessage: "启动失败",
        });
        return false;
      }
    } catch (e: any) {
      logger.error(`账号 ${accountId} 启动异常: ${e.message}`);
      updateAccountStatus({
        accountId,
        connected: false,
        errorMessage: e.message,
      });
      return false;
    }
  }

  // 停止单个客户端
  stopClient(accountId: string): boolean {
    const client = this.clients.get(accountId);
    if (!client) {
      logger.warn(`账号 ${accountId} 未在运行`);
      return false;
    }

    client.disconnect();
    this.clients.delete(accountId);
    logger.info(`账号 ${accountId} 已停止`);
    return true;
  }

  // 重启单个客户端
  async restartClient(accountId: string): Promise<boolean> {
    this.stopClient(accountId);
    await new Promise((r) => setTimeout(r, 1000));
    return this.startClient(accountId);
  }

  // 停止所有客户端
  stopAll(): void {
    logger.info("正在停止所有客户端...");
    // @ts-ignore
    for (const [accountId] of this.clients) {
      this.stopClient(accountId);
    }
    logger.info("所有客户端已停止");
  }

  // 获取客户端
  getClient(accountId: string): GoofishClient | undefined {
    return this.clients.get(accountId);
  }

  // 获取所有客户端状态
  getStatus(): Array<{
    accountId: string;
    connected: boolean;
    userId: string;
  }> {
    const status: Array<{
      accountId: string;
      connected: boolean;
      userId: string;
    }> = [];
    // @ts-ignore
    for (const [accountId, client] of this.clients) {
      status.push({
        accountId,
        connected: client.isConnected(),
        userId: client.getUserId(),
      });
    }
    return status;
  }

  // 获取运行中的客户端数量
  getActiveCount(): number {
    let count = 0;
    // @ts-ignore
    for (const client of this.clients.values()) {
      if (client.isConnected()) count++;
    }
    return count;
  }
}
