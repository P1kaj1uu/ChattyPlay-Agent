import { WS_CONFIG, API_ENDPOINTS, PASSPORT_CONFIG } from "../core/constants";
import { CookiesManager } from "../core/cookies.manager";
import { generateSign } from "../utils/crypto";
import { createLogger } from "../core/logger";

const logger = createLogger("Ws:Token");

// Session 过期错误标识
const SESSION_EXPIRED_ERRORS = ["FAIL_SYS_SESSION_EXPIRED", "SESSION_EXPIRED"];

export class TokenManager {
  private currentToken: string | null = null;
  private lastRefreshTime = 0;
  private deviceId: string;
  private accountId: string;

  constructor(accountId: string, deviceId: string) {
    this.accountId = accountId;
    this.deviceId = deviceId;
  }

  getToken(): string | null {
    return this.currentToken;
  }

  isExpired(): boolean {
    return (
      !this.currentToken ||
      Date.now() - this.lastRefreshTime >=
        WS_CONFIG.TOKEN_REFRESH_INTERVAL * 1000
    );
  }

  // 调用 hasLogin 接口刷新登录状态
  private async hasLogin(retryCount = 0): Promise<boolean> {
    if (retryCount >= 2) {
      logger.error(`[${this.accountId}] hasLogin 检查失败，重试次数过多`);
      return false;
    }

    try {
      // 每次从数据库获取最新 cookies
      const cookiesStr = CookiesManager.getCookies(this.accountId);
      const cookies = CookiesManager.getCookiesObject(this.accountId);

      if (!cookiesStr) {
        logger.error(`[${this.accountId}] 无法获取 cookies`);
        return false;
      }

      const url = `${PASSPORT_CONFIG.BASE_URL}/newlogin/hasLogin.do`;
      const params = new URLSearchParams({
        appName: "xianyu",
        fromSite: "77",
      });

      const formData = new URLSearchParams({
        hid: cookies["unb"] || "",
        ltl: "true",
        appName: "xianyu",
        appEntrance: "web",
        _csrf_token: cookies["XSRF-TOKEN"] || "",
        umidToken: "",
        hsiz: cookies["cookie2"] || "",
        bizParams: "taobaoBizLoginFrom=web",
        mainPage: "false",
        isMobile: "false",
        lang: "zh_CN",
        returnUrl: "",
        fromSite: "77",
        isIframe: "true",
        documentReferer: "https://www.goofish.com/",
        defaultView: "hasLogin",
        umidTag: "SERVER",
        deviceId: cookies["cna"] || "",
      });

      const res = await fetch(`${url}?${params}`, {
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
        body: formData.toString(),
      });

      // 处理 Set-Cookie，自动更新到数据库
      CookiesManager.handleResponseCookies(this.accountId, res);

      const resJson = await res.json();

      if (resJson?.content?.success) {
        logger.info(`[${this.accountId}] hasLogin 验证成功`);
        return true;
      }

      logger.warn(
        `[${this.accountId}] hasLogin 验证失败: ${JSON.stringify(resJson)}`,
      );
      await new Promise((r) => setTimeout(r, 500));
      return this.hasLogin(retryCount + 1);
    } catch (e) {
      logger.error(`[${this.accountId}] hasLogin 请求异常: ${e}`);
      await new Promise((r) => setTimeout(r, 500));
      return this.hasLogin(retryCount + 1);
    }
  }

  // 检查是否为 Session 过期错误
  private isSessionExpiredError(error: string): boolean {
    return SESSION_EXPIRED_ERRORS.some((e) => error.includes(e));
  }

  // 执行单次 token 请求
  private async doTokenRequest(): Promise<{
    success: boolean;
    token?: string;
    cookiesUpdated: boolean;
    error?: string;
  }> {
    // 每次从数据库获取最新 cookies
    const cookiesStr = CookiesManager.getCookies(this.accountId);
    if (!cookiesStr) {
      return {
        success: false,
        cookiesUpdated: false,
        error: "无法获取 cookies",
      };
    }

    const timestamp = Date.now().toString();
    const dataVal = JSON.stringify({
      appKey: WS_CONFIG.APP_KEY,
      deviceId: this.deviceId,
    });
    const h5Token = CookiesManager.getH5Token(this.accountId);
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
      api: "mtop.taobao.idlemessage.pc.login.token",
      sessionOption: "AutoLoginOnly",
    });

    const res = await fetch(`${API_ENDPOINTS.TOKEN}?${params}`, {
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

    // 处理 Set-Cookie，自动更新到数据库
    const cookiesUpdated = CookiesManager.handleResponseCookies(
      this.accountId,
      res,
    );
    const resJson = await res.json();

    if (
      resJson?.ret?.some((r: string) => r.includes("SUCCESS")) &&
      resJson?.data?.accessToken
    ) {
      return { success: true, token: resJson.data.accessToken, cookiesUpdated };
    }

    const errorMsg = resJson?.ret?.join(", ") || "Unknown error";
    return { success: false, cookiesUpdated, error: errorMsg };
  }

  async refresh(): Promise<string | null> {
    try {
      logger.info(`[${this.accountId}] 开始刷新Token...`);

      // 第一次请求
      let result = await this.doTokenRequest();

      // 如果失败但 cookies 更新了（token 过期场景），用新 token 重试
      if (!result.success && result.cookiesUpdated) {
        logger.info(`[${this.accountId}] Token过期，使用新Cookies重试...`);
        result = await this.doTokenRequest();
      }

      // 如果仍然失败且是 Session 过期错误，尝试 hasLogin 刷新
      if (
        !result.success &&
        result.error &&
        this.isSessionExpiredError(result.error)
      ) {
        logger.info(`[${this.accountId}] Session过期，尝试 hasLogin 刷新...`);
        const loginSuccess = await this.hasLogin();
        if (loginSuccess) {
          logger.info(`[${this.accountId}] hasLogin 成功，重新获取Token...`);
          result = await this.doTokenRequest();
          // hasLogin 后可能还需要处理 token 更新
          if (!result.success && result.cookiesUpdated) {
            result = await this.doTokenRequest();
          }
        }
      }

      if (result.success && result.token) {
        this.currentToken = result.token;
        this.lastRefreshTime = Date.now();
        logger.info(`[${this.accountId}] Token刷新成功`);
        return this.currentToken;
      }

      logger.error(`[${this.accountId}] Token刷新失败: ${result.error}`);
      return null;
    } catch (e) {
      logger.error(`[${this.accountId}] Token刷新异常: ${e}`);
      return null;
    }
  }
}
