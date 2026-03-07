/**
 * 安全中间件
 * 使用 Hono 内置 CSRF 中间件限制 API 只能从同源请求
 */

import { csrf } from "hono/csrf";
import type { Context, Next } from "hono";

import { createLogger } from "../../core/logger";

const logger = createLogger("Api:Security");

// 白名单路径（不需要验证来源）- 仅开发环境使用
const WHITELIST_PATHS: string[] = [];

/**
 * 创建安全中间件
 * 使用 Hono CSRF 中间件验证 Origin 和 Sec-Fetch-Site 头
 */
export function createSecurityMiddleware() {
  // Hono CSRF 中间件 - 验证同源请求
  const csrfMiddleware = csrf({
    // 动态验证 Origin（同源或本地开发）
    origin: (origin, c) => {
      const host = c.req.header("host");
      if (!origin || !host) return false;

      // 提取 origin 的 host 部分
      try {
        const originUrl = new URL(origin);
        // 同源检查
        if (originUrl.host === host) return true;
        // 本地开发允许
        if (
          originUrl.hostname === "localhost" ||
          originUrl.hostname === "127.0.0.1"
        ) {
          return true;
        }
      } catch {
        return false;
      }
      return false;
    },
    // 允许同源和直接访问（浏览器地址栏）
    secFetchSite: ["same-origin", "none"],
  });

  return async (c: Context, next: Next) => {
    const path = c.req.path;

    // 白名单路径直接放行
    if (WHITELIST_PATHS.some((p) => path.startsWith(p))) {
      return next();
    }

    // GET/HEAD/OPTIONS 请求放行（CSRF 只保护修改操作）
    const method = c.req.method;
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      return next();
    }

    // 使用 CSRF 中间件验证
    try {
      return await csrfMiddleware(c, next);
    } catch {
      logger.warn(`拒绝非法请求: ${method} ${path}`);
      return c.json({ error: "Forbidden" }, 403);
    }
  };
}

// 兼容旧的导出方式
export const securityMiddleware = createSecurityMiddleware();
