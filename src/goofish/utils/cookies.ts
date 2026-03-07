// 解析 cookies 字符串为对象
export function parseCookies(cookiesStr: string): Record<string, string> {
  if (!cookiesStr) return {};
  const cookies: Record<string, string> = {};
  for (const cookie of cookiesStr.replace(/; /g, ";").split(";")) {
    const trimmed = cookie.trim();
    const idx = trimmed.indexOf("=");
    if (idx > 0) {
      cookies[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  }
  return cookies;
}

// 将 cookies 对象转换为字符串
export function stringifyCookies(cookies: Record<string, string>): string {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join("; ");
}

// 合并 cookies，新的覆盖旧的
export function mergeCookies(
  oldCookiesStr: string,
  newCookies: Record<string, string>,
): string {
  const merged = parseCookies(oldCookiesStr);
  for (const [key, value] of Object.entries(newCookies)) {
    if (value) {
      merged[key] = value;
    }
  }
  return stringifyCookies(merged);
}

// 从 Set-Cookie 响应头解析 cookies
export function parseSetCookieHeaders(
  setCookieHeaders: string[],
): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    // Set-Cookie 格式: name=value; Path=/; Domain=.goofish.com; ...
    const parts = header.split(";");
    if (parts.length > 0) {
      const cookiePart = parts[0].trim();
      const idx = cookiePart.indexOf("=");
      if (idx > 0) {
        const name = cookiePart.slice(0, idx).trim();
        const value = cookiePart.slice(idx + 1).trim();
        cookies[name] = value;
      }
    }
  }
  return cookies;
}
