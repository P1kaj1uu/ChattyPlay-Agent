/**
 * 用户服务
 */

import { API_ENDPOINTS, WS_CONFIG } from "../core/constants";
import { CookiesManager } from "../core/cookies.manager";
import { generateSign } from "../utils/crypto";
import { createLogger } from "../core/logger";
import { getUserAvatar, saveUserAvatar, hasUserAvatar } from "../db/index";
import type { UserHeadInfo, AccountUserInfo } from "../types/index";

const logger = createLogger("Svc:User");

/**
 * 从缓存获取用户头像
 */
export function getCachedUserHead(userId: string): UserHeadInfo | null {
  const cached = getUserAvatar(userId);
  if (cached) {
    return {
      userId: cached.user_id,
      displayName: cached.display_name || "",
      avatar: cached.avatar,
      ipLocation: cached.ip_location || undefined,
      introduction: cached.introduction || undefined,
    };
  }
  return null;
}

/**
 * 检查用户头像是否已缓存
 */
export function isUserHeadCached(userId: string): boolean {
  return hasUserAvatar(userId);
}

/**
 * 获取用户头像信息
 */
export async function fetchUserHead(
  accountId: string,
  userId: string,
  skipCache = false,
): Promise<{ userHead: UserHeadInfo | null; fromCache?: boolean }> {
  if (!skipCache) {
    const cached = getCachedUserHead(userId);
    if (cached) {
      logger.debug(`用户 ${userId} 头像已缓存，跳过 API 请求`);
      return { userHead: cached, fromCache: true };
    }
  }

  try {
    const cookiesStr = CookiesManager.getCookies(accountId);
    if (!cookiesStr) {
      logger.error(`[${accountId}] 无法获取 cookies`);
      return { userHead: null, fromCache: false };
    }

    const timestamp = Date.now().toString();
    const dataVal = JSON.stringify({ self: false, userId });
    const h5Token = CookiesManager.getH5Token(accountId);
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
      api: "mtop.idle.web.user.page.head",
      sessionOption: "AutoLoginOnly",
    });

    const res = await fetch(`${API_ENDPOINTS.USER_HEAD}?${params}`, {
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

    CookiesManager.handleResponseCookies(accountId, res);

    const json = await res.json();
    logger.debug(`用户头像响应: ${JSON.stringify(json?.ret)}`);

    if (
      json?.ret?.some((r: string) => r.includes("SUCCESS")) &&
      json?.data?.module?.base
    ) {
      const base = json.data.module.base;
      const avatar = base.avatar?.avatar || "";
      logger.info(`获取用户 ${userId} 头像成功: ${avatar.substring(0, 50)}...`);

      const userHead: UserHeadInfo = {
        userId,
        displayName: base.displayName || "",
        avatar,
        ipLocation: base.ipLocation,
        introduction: base.introduction,
      };

      saveUserAvatar({
        userId,
        displayName: userHead.displayName,
        avatar: userHead.avatar,
        ipLocation: userHead.ipLocation,
        introduction: userHead.introduction,
      });

      return { userHead, fromCache: false };
    }

    logger.warn(`获取用户 ${userId} 头像失败: ${JSON.stringify(json?.ret)}`);
    return { userHead: null, fromCache: false };
  } catch (e) {
    logger.error(`获取用户头像异常: ${e}`);
    return { userHead: null, fromCache: false };
  }
}

/**
 * 获取登录用户ID
 */
export async function fetchLoginUserId(
  accountId: string,
): Promise<string | null> {
  try {
    const cookiesStr = CookiesManager.getCookies(accountId);
    if (!cookiesStr) {
      logger.error(`[${accountId}] 无法获取 cookies`);
      return null;
    }

    const timestamp = Date.now().toString();
    const dataVal = JSON.stringify({});
    const h5Token = CookiesManager.getH5Token(accountId);
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
      api: "mtop.taobao.idlemessage.pc.loginuser.get",
    });

    const res = await fetch(`${API_ENDPOINTS.LOGIN_USER}?${params}`, {
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

    CookiesManager.handleResponseCookies(accountId, res);

    const resJson = await res.json();

    if (
      resJson?.ret?.some((r: string) => r.includes("SUCCESS")) &&
      resJson?.data?.userId
    ) {
      const userId = String(resJson.data.userId);
      logger.info(`[${accountId}] 获取用户ID成功: ${userId}`);
      return userId;
    }

    logger.warn(
      `[${accountId}] 获取用户ID失败: ${JSON.stringify(resJson?.ret)}`,
    );
    return null;
  } catch (e) {
    logger.error(`[${accountId}] 获取用户ID异常: ${e}`);
    return null;
  }
}

/**
 * 获取用户详细信息
 */
export async function fetchUserProfile(
  accountId: string,
): Promise<Omit<AccountUserInfo, "userId"> | null> {
  try {
    const cookiesStr = CookiesManager.getCookies(accountId);
    if (!cookiesStr) {
      logger.error(`[${accountId}] 无法获取 cookies`);
      return null;
    }

    const timestamp = Date.now().toString();
    const dataVal = JSON.stringify({});
    const h5Token = CookiesManager.getH5Token(accountId);
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
      api: "mtop.idle.web.user.page.nav",
    });

    const res = await fetch(`${API_ENDPOINTS.USER_INFO}?${params}`, {
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

    CookiesManager.handleResponseCookies(accountId, res);

    const resJson = await res.json();

    if (resJson?.ret?.some((r: string) => r.includes("SUCCESS"))) {
      const base = resJson?.data?.module?.base;
      if (base) {
        logger.info(`[${accountId}] 获取用户信息成功: ${base.displayName}`);
        return {
          displayName: base.displayName || "",
          avatar: base.avatar || "",
          soldCount: base.soldCount,
          followers: base.followers,
          following: base.following,
        };
      }
    }

    logger.warn(
      `[${accountId}] 获取用户信息失败: ${JSON.stringify(resJson?.ret)}`,
    );
    return null;
  } catch (e) {
    logger.error(`[${accountId}] 获取用户信息异常: ${e}`);
    return null;
  }
}

/**
 * 获取完整用户信息
 */
export async function fetchUserInfo(
  accountId: string,
): Promise<AccountUserInfo | null> {
  const userId = await fetchLoginUserId(accountId);
  if (!userId) {
    return null;
  }

  const profile = await fetchUserProfile(accountId);
  if (!profile) {
    return { userId, displayName: "", avatar: "" };
  }

  return { userId, ...profile };
}
