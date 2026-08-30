import WebSocket from "ws";
import { WS_CONFIG, WS_HEADERS, API_ENDPOINTS } from "../core/constants";
import { createLogger } from "../core/logger";
import { CookiesManager } from "../core/cookies.manager";
import { generateDeviceId, generateMid, generateSign } from "../utils/crypto";
import { nowLocalString } from "../utils/date";
import { TokenManager } from "./token";
import { updateAccountStatus } from "../db/index";
import { sendMessage } from "./message.sender";
import { processWebSocketMessage } from "./message.receiver";
import type { MessageCallback } from "../types/index";

const logger = createLogger("Ws:Client");

export class GoofishClient {
  private _accountId: string;
  private myId: string;
  private deviceId: string;
  private ws: WebSocket | null = null;
  private tokenManager: TokenManager;
  private running = false;
  private connectionFailures = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private tokenRefreshTimer: NodeJS.Timeout | null = null;
  private onMessage?: MessageCallback;

  constructor(accountId: string, onMessage?: MessageCallback) {
    this._accountId = accountId;
    this.onMessage = onMessage;

    // 从数据库获取 cookies 验证
    const userId = CookiesManager.getUserId(accountId);
    if (!userId) throw new Error("Cookie中缺少必需的'unb'字段或账号不存在");

    this.myId = userId;
    this.deviceId = generateDeviceId(this.myId);
    this.tokenManager = new TokenManager(accountId, this.deviceId);

    logger.info(`[${this._accountId}] 客户端初始化完成，用户ID: ${this.myId}`);
  }

  get accountId(): string {
    return this._accountId;
  }

  getAccountId(): string {
    return this._accountId;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getUserId(): string {
    return this.myId;
  }

  async sendMessage(
    chatId: string,
    toUserId: string,
    text: string,
  ): Promise<boolean> {
    if (!this.ws) return false;
    return sendMessage({
      accountId: this._accountId,
      myId: this.myId,
      ws: this.ws,
      chatId,
      toUserId,
      text,
    });
  }

  // 获取订单详情
  async fetchOrderDetail(orderId: string): Promise<any> {
    try {
      const cookiesStr = CookiesManager.getCookies(this._accountId);
      if (!cookiesStr) {
        logger.error(`[${this._accountId}] 无法获取 cookies`);
        return null;
      }

      const h5Token = CookiesManager.getH5Token(this._accountId);
      if (!h5Token) {
        logger.warn(`[${this._accountId}] h5Token 为空，尝试刷新 token`);
      }

      const timestamp = Date.now().toString();
      const dataVal = JSON.stringify({ tid: orderId });
      const sign = generateSign(timestamp, h5Token, dataVal);

      logger.debug(
        `[${this._accountId}] 订单API请求 - orderId: ${orderId}, h5Token: ${h5Token ? h5Token.substring(0, 8) + "..." : "空"}`,
      );

      const params = new URLSearchParams({
        jsv: "2.7.2",
        appKey: WS_CONFIG.SIGN_APP_KEY,
        t: timestamp,
        sign,
        v: "1.0",
        type: "originaljson",
        accountSite: "xianyu",
        dataType: "json",
        timeout: "20000",
        api: "mtop.idle.web.trade.order.detail",
        sessionOption: "AutoLoginOnly",
      });

      const res = await fetch(`${API_ENDPOINTS.ORDER_DETAIL}?${params}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://www.goofish.com",
          referer: "https://www.goofish.com/",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          cookie: cookiesStr,
        },
        body: `data=${encodeURIComponent(dataVal)}`,
      });

      CookiesManager.handleResponseCookies(this._accountId, res);
      const resJson = await res.json();

      if (resJson?.ret?.some((r: string) => r.includes("SUCCESS"))) {
        logger.info(`[${this._accountId}] 获取订单详情成功: ${orderId}`);
        return resJson;
      }

      const retMsg = resJson?.ret?.join(", ") || "未知错误";
      logger.warn(`[${this._accountId}] 获取订单详情失败: ${retMsg}`);

      if (
        retMsg.includes("TOKEN") ||
        retMsg.includes("FAIL_SYS_SESSION_EXPIRED")
      ) {
        logger.warn(`[${this._accountId}] Token 可能已过期，请尝试刷新账号`);
      }

      return null;
    } catch (e) {
      logger.error(`[${this._accountId}] 获取订单详情异常: ${e}`);
      return null;
    }
  }

  // 确认发货（虚拟发货/无需物流）
  async confirmShipment(
    orderId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cookiesStr = CookiesManager.getCookies(this._accountId);
      if (!cookiesStr) {
        return { success: false, error: "无法获取 cookies" };
      }

      const h5Token = CookiesManager.getH5Token(this._accountId);
      if (!h5Token) {
        return { success: false, error: "h5Token 为空" };
      }

      const timestamp = Date.now().toString();
      const dataVal = JSON.stringify({
        orderId,
        tradeText: "",
        picList: [],
        newUnconsign: true,
      });
      const sign = generateSign(timestamp, h5Token, dataVal);

      const params = new URLSearchParams({
        jsv: "2.7.2",
        appKey: WS_CONFIG.SIGN_APP_KEY,
        t: timestamp,
        sign,
        v: "1.0",
        type: "originaljson",
        accountSite: "xianyu",
        dataType: "json",
        timeout: "20000",
        api: "mtop.taobao.idle.logistic.consign.dummy",
        sessionOption: "AutoLoginOnly",
      });

      logger.info(`[${this._accountId}] 确认发货请求 - orderId: ${orderId}`);

      const res = await fetch(`${API_ENDPOINTS.CONFIRM_SHIPMENT}?${params}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://www.goofish.com",
          referer: "https://www.goofish.com/",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          cookie: cookiesStr,
        },
        body: `data=${encodeURIComponent(dataVal)}`,
      });

      CookiesManager.handleResponseCookies(this._accountId, res);
      const resJson = await res.json();

      if (resJson?.ret?.some((r: string) => r.includes("SUCCESS"))) {
        logger.info(`[${this._accountId}] 确认发货成功: ${orderId}`);
        return { success: true };
      }

      const retMsg = resJson?.ret?.join(", ") || "未知错误";
      logger.warn(`[${this._accountId}] 确认发货失败: ${retMsg}`);
      return { success: false, error: retMsg };
    } catch (e) {
      logger.error(`[${this._accountId}] 确认发货异常: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  // 免拼发货
  async freeShipping(
    orderId: string,
    itemId: string,
    buyerId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const cookiesStr = CookiesManager.getCookies(this._accountId);
      if (!cookiesStr) {
        return { success: false, error: "无法获取 cookies" };
      }

      const h5Token = CookiesManager.getH5Token(this._accountId);
      if (!h5Token) {
        return { success: false, error: "h5Token 为空" };
      }

      const timestamp = Date.now().toString();
      const dataVal = JSON.stringify({
        bizOrderId: orderId,
        itemId,
        buyerId,
      });
      const sign = generateSign(timestamp, h5Token, dataVal);

      const params = new URLSearchParams({
        jsv: "2.7.2",
        appKey: WS_CONFIG.SIGN_APP_KEY,
        t: timestamp,
        sign,
        v: "1.0",
        type: "originaljson",
        accountSite: "xianyu",
        dataType: "json",
        timeout: "20000",
        api: "mtop.idle.groupon.activity.seller.freeshipping",
        sessionOption: "AutoLoginOnly",
      });

      logger.info(
        `[${this._accountId}] 免拼发货请求 - orderId: ${orderId}, itemId: ${itemId}, buyerId: ${buyerId}`,
      );

      const res = await fetch(`${API_ENDPOINTS.FREE_SHIPPING}?${params}`, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
          origin: "https://www.goofish.com",
          referer: "https://www.goofish.com/",
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          cookie: cookiesStr,
        },
        body: `data=${encodeURIComponent(dataVal)}`,
      });

      CookiesManager.handleResponseCookies(this._accountId, res);
      const resJson = await res.json();

      if (resJson?.ret?.some((r: string) => r.includes("SUCCESS"))) {
        logger.info(`[${this._accountId}] 免拼发货成功: ${orderId}`);
        return { success: true };
      }

      const retMsg = resJson?.ret?.join(", ") || "未知错误";
      logger.warn(`[${this._accountId}] 免拼发货失败: ${retMsg}`);
      return { success: false, error: retMsg };
    } catch (e) {
      logger.error(`[${this._accountId}] 免拼发货异常: ${e}`);
      return { success: false, error: String(e) };
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const msg = { lwp: "/!", headers: { mid: generateMid() } };
        this.ws.send(JSON.stringify(msg));
        logger.debug(`[${this._accountId}] 心跳已发送`);
        updateAccountStatus({
          accountId: this._accountId,
          lastHeartbeat: nowLocalString(),
        });
      }
    }, WS_CONFIG.HEARTBEAT_INTERVAL * 1000);
  }

  private startTokenRefresh() {
    this.tokenRefreshTimer = setInterval(async () => {
      if (this.running) {
        logger.info(`[${this._accountId}] 开始定时刷新Token...`);
        const token = await this.tokenManager.refresh();
        if (token) {
          logger.info(`[${this._accountId}] Token刷新成功`);
          updateAccountStatus({
            accountId: this._accountId,
            lastTokenRefresh: nowLocalString(),
          });
        } else {
          logger.warn(`[${this._accountId}] Token刷新失败`);
        }
      }
    }, WS_CONFIG.TOKEN_REFRESH_INTERVAL * 1000);
    logger.info(
      `[${this._accountId}] Token刷新定时器已启动，间隔: ${WS_CONFIG.TOKEN_REFRESH_INTERVAL}秒`,
    );
  }

  private async initConnection() {
    if (!this.ws) return;

    let token = this.tokenManager.getToken();
    if (!token) {
      logger.info(`[${this._accountId}] 首次连接，正在获取Token...`);
      token = await this.tokenManager.refresh();
      if (!token) {
        logger.error(`[${this._accountId}] 获取Token失败，无法完成注册`);
        return;
      }
    }

    const regMsg = {
      lwp: "/reg",
      headers: {
        "cache-header": "app-key token ua wv",
        "app-key": WS_CONFIG.APP_KEY,
        token: token,
        ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        dt: "j",
        wv: "im:3,au:3,sy:6",
        sync: "0,0;0;0;",
        did: this.deviceId,
        mid: generateMid(),
      },
    };
    this.ws.send(JSON.stringify(regMsg));
    logger.info(`[${this._accountId}] 注册消息已发送`);

    await new Promise((r) => setTimeout(r, 1000));

    const currentTime = Date.now();
    const syncMsg = {
      lwp: "/r/SyncStatus/ackDiff",
      headers: { mid: generateMid() },
      body: [
        {
          pipeline: "sync",
          tooLong2Tag: "PNM,1",
          channel: "sync",
          topic: "sync",
          highPts: 0,
          pts: currentTime * 1000,
          seq: 0,
          timestamp: currentTime,
        },
      ],
    };
    this.ws.send(JSON.stringify(syncMsg));
    logger.info(`[${this._accountId}] 连接注册完成`);
  }

  private sendAck(headers: any) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const ack = {
      code: 200,
      headers: { mid: headers?.mid || generateMid(), sid: headers?.sid || "" },
    };
    this.ws.send(JSON.stringify(ack));
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        logger.info(`[${this._accountId}] 正在连接 WebSocket...`);
        this.ws = new WebSocket(WS_CONFIG.URL, { headers: WS_HEADERS });

        this.ws.on("open", async () => {
          logger.info(`[${this._accountId}] WebSocket 连接已建立`);
          this.connectionFailures = 0;
          updateAccountStatus({
            accountId: this._accountId,
            connected: true,
            errorMessage: "",
          });

          try {
            await this.initConnection();
            this.startHeartbeat();
            this.startTokenRefresh();
            resolve(true);
          } catch (e) {
            logger.error(`[${this._accountId}] 初始化连接失败: ${e}`);
            resolve(false);
          }
        });

        this.ws.on("message", async (data) => {
          try {
            const msgData = JSON.parse(data.toString());
            await processWebSocketMessage(
              msgData,
              {
                accountId: this._accountId,
                myId: this.myId,
                client: this,
                onMessage: this.onMessage,
                onAutoReply: (chatId, senderId, content) =>
                  this.sendMessage(chatId, senderId, content),
              },
              (headers) => this.sendAck(headers),
            );
          } catch (e) {
            logger.error(`[${this._accountId}] 解析消息失败: ${e}`);
          }
        });

        this.ws.on("close", (code, reason) => {
          logger.warn(
            `[${this._accountId}] WebSocket 连接关闭: ${code} - ${reason}`,
          );
          this.cleanup();
          updateAccountStatus({ accountId: this._accountId, connected: false });

          if (
            this.running &&
            this.connectionFailures < WS_CONFIG.MAX_RECONNECT_ATTEMPTS
          ) {
            this.connectionFailures++;
            logger.info(
              `[${this._accountId}] ${WS_CONFIG.RECONNECT_DELAY / 1000}秒后尝试重连 (${this.connectionFailures}/${WS_CONFIG.MAX_RECONNECT_ATTEMPTS})`,
            );
            setTimeout(() => this.connect(), WS_CONFIG.RECONNECT_DELAY);
          }
        });

        this.ws.on("error", (err) => {
          logger.error(`[${this._accountId}] WebSocket 错误: ${err.message}`);
          updateAccountStatus({
            accountId: this._accountId,
            errorMessage: err.message,
          });
          resolve(false);
        });
      } catch (e) {
        logger.error(`[${this._accountId}] 连接失败: ${e}`);
        resolve(false);
      }
    });
  }

  private cleanup() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.tokenRefreshTimer) {
      clearInterval(this.tokenRefreshTimer);
      this.tokenRefreshTimer = null;
    }
  }

  disconnect() {
    this.running = false;
    this.cleanup();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    updateAccountStatus({ accountId: this._accountId, connected: false });
    logger.info(`[${this._accountId}] 客户端已断开连接`);
  }

  async run() {
    this.running = true;
    const connected = await this.connect();
    if (!connected) {
      logger.error(`[${this._accountId}] 启动失败`);
      this.running = false;
    }
    return connected;
  }
}
