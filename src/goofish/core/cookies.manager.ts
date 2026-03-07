import { getAccount, updateAccountCookies } from "../db/index";
import {
  parseCookies,
  mergeCookies,
  parseSetCookieHeaders,
} from "../utils/cookies";
import { createLogger } from "./logger";

const logger = createLogger("Core:Cookies");

/**
 * Cookies 管理器
 * 统一管理 cookies 的读取和写入，确保所有地方使用最新的 cookies
 *
 * 设计原则：
 * 1. 读取：始终从数据库读取，保证获取最新值
 * 2. 写入：增量合并后写入数据库，任何地方都可以更新
 * 3. 不在内存中缓存 cookies，避免状态不一致
 */
export class CookiesManager {
  /**
   * 获取账号的最新 cookies 字符串
   */
  static getCookies(accountId: string): string | null {
    const account = getAccount(accountId);
    return account?.cookies || null;
  }

  /**
   * 获取账号的最新 cookies 对象
   */
  static getCookiesObject(accountId: string): Record<string, string> {
    const cookiesStr = this.getCookies(accountId);
    return cookiesStr ? parseCookies(cookiesStr) : {};
  }

  /**
   * 获取指定的 cookie 值
   */
  static getCookie(accountId: string, name: string): string | undefined {
    const cookies = this.getCookiesObject(accountId);
    return cookies[name];
  }

  /**
   * 更新 cookies（增量合并）
   * @param accountId 账号ID
   * @param newCookies 新的 cookies（可以是字符串或对象）
   * @returns 合并后的完整 cookies 字符串，如果没有实际更新则返回 null
   */
  static updateCookies(
    accountId: string,
    newCookies: string | Record<string, string>,
  ): string | null {
    const currentCookies = this.getCookies(accountId);
    if (!currentCookies) {
      logger.warn(`[${accountId}] 账号不存在，无法更新 cookies`);
      return null;
    }

    const currentCookiesObj = parseCookies(currentCookies);
    const newCookiesObj =
      typeof newCookies === "string" ? parseCookies(newCookies) : newCookies;

    // 检查哪些字段实际发生了变化
    const changedFields: string[] = [];
    for (const [key, value] of Object.entries(newCookiesObj)) {
      if (currentCookiesObj[key] !== value) {
        changedFields.push(key);
      }
    }

    // 如果没有实际变化，不更新不输出日志
    if (changedFields.length === 0) {
      return null;
    }

    const mergedCookies = mergeCookies(currentCookies, newCookiesObj);

    if (updateAccountCookies(accountId, mergedCookies)) {
      logger.info(
        `[${accountId}] Cookies 已更新 | 变更字段: ${changedFields.join(", ")}`,
      );
      return mergedCookies;
    }

    return null;
  }

  /**
   * 处理 HTTP 响应中的 Set-Cookie，自动更新到数据库
   * @param accountId 账号ID
   * @param response HTTP 响应对象
   * @returns 是否有更新
   */
  static handleResponseCookies(accountId: string, response: Response): boolean {
    const setCookieHeaders = response.headers.getSetCookie?.() || [];
    if (setCookieHeaders.length === 0) {
      return false;
    }

    const newCookies = parseSetCookieHeaders(setCookieHeaders);
    if (Object.keys(newCookies).length === 0) {
      return false;
    }

    const result = this.updateCookies(accountId, newCookies);
    return result !== null;
  }

  /**
   * 获取用于 API 签名的 h5 token
   */
  static getH5Token(accountId: string): string {
    const h5tk = this.getCookie(accountId, "_m_h5_tk");
    return h5tk?.split("_")[0] || "";
  }

  /**
   * 获取用户 ID (unb)
   */
  static getUserId(accountId: string): string | undefined {
    return this.getCookie(accountId, "unb");
  }
}
