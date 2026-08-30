import type { Context, Next } from "hono";
import { verifyToken } from "../../utils/jwt.util";

const adminUsers = new Set(
  (process.env.GOOFISH_ADMIN_USERS || "")
    .split(",")
    .map((username) => username.trim())
    .filter(Boolean),
);

function extractToken(c: Context): string | null {
  const authorization = c.req.header("Authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  const protocolHeader = c.req.header("Sec-WebSocket-Protocol") || "";
  const authProtocol = protocolHeader
    .split(",")
    .map((protocol) => protocol.trim())
    .find((protocol) => protocol.startsWith("chattyplay.jwt."));
  return authProtocol?.slice("chattyplay.jwt.".length) || null;
}

export function isAuthorizedGoofishRequest(c: Context): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const token = extractToken(c);
  if (!token) return false;

  const payload = verifyToken(token);
  if (!payload) return false;
  return adminUsers.size === 0 || adminUsers.has(payload.username);
}

export async function goofishAuthMiddleware(c: Context, next: Next) {
  if (c.req.method === "OPTIONS") return next();
  if (!isAuthorizedGoofishRequest(c)) {
    return c.json({
      error: "Unauthorized",
      message: "请使用站点账号登录；管理员可通过 GOOFISH_ADMIN_USERS 限制访问。",
    }, 401);
  }
  return next();
}
