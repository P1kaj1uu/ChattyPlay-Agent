# Hugging Face Docker Space + Vercel 部署

该方案保留现有 TypeScript/Node/Hono 闲鱼后端：Vercel 负责前端和普通无状态 API，Hugging Face Docker Space 负责账号常驻连接、闲鱼 WebSocket、自动回复、自动发货和 SQLite 数据。

## 1. 创建 Docker Space

1. 在 Hugging Face 创建 Space，SDK 选择 **Docker**。
2. 将本仓库推送到 Space 仓库。根目录 `README.md` 已声明 `sdk: docker` 和 `app_port: 7860`，根目录 `Dockerfile` 会启动 Node/Hono 后端。
3. Space 应使用 Public 或 Protected 可见性。Private Space 需要 Hugging Face 身份认证，浏览器无法直接建立当前业务 WebSocket。
4. 在 Space Settings 创建或选择 Storage Bucket，以读写方式挂载到 `/data`。未挂载时 SQLite、账号 Cookie、规则和日志会在 Space 重启后丢失。

## 2. 配置 Space Variables / Secrets

在 Space Settings 添加：

```env
NODE_ENV=production
PORT=7860
GOOFISH_DATA_DIR=/data
GOOFISH_LOG_DIR=/data/logs
GOOFISH_SQLITE_JOURNAL_MODE=DELETE
GOOFISH_ALLOWED_ORIGINS=https://你的项目.vercel.app
GOOFISH_ADMIN_USERS=你的站点用户名
JWT_SECRET=一个足够长的随机字符串
```

`JWT_SECRET` 必须保存为 Secret，并且与 Vercel 中的 `JWT_SECRET` 完全一致。`GOOFISH_ADMIN_USERS` 可用英文逗号分隔多个管理员；如果留空，任意持有本站有效 JWT 的用户都能访问闲鱼后台。

部署完成后，后端地址类似：

```text
https://username-space-name.hf.space
```

健康检查为 `/health`，业务 API 为 `/api/*`，浏览器推送 WebSocket 为 `/ws`。

## 3. 配置 Vercel Environment Variables

在 Vercel Project Settings → Environment Variables 添加：

```env
VITE_GOOFISH_API_URL=https://username-space-name.hf.space/api
VITE_GOOFISH_WS_URL=wss://username-space-name.hf.space/ws
GOOFISH_BACKEND_URL=https://username-space-name.hf.space
JWT_SECRET=与 Space 完全相同的随机字符串
CRON_SECRET=另一个随机字符串
```

修改 `VITE_*` 后必须重新部署。Vercel 每天会调用一次 `/api/goofish-health`，用于避免 CPU Basic Space 因长时间无页面访问而休眠；平台维护或主动重启仍可能造成短暂重连。

## 4. 登录与安全

远程闲鱼后台只接受本站用户名/密码登录后签发的 JWT。Google/GitHub 当前产生的是本地临时登录状态，不能访问 Space 后端。前端 API 请求会自动添加 `Authorization`，WebSocket 通过 `Sec-WebSocket-Protocol` 子协议携带短期 JWT，避免令牌出现在 URL 日志中；后端还会校验 Vercel Origin 和 `GOOFISH_ADMIN_USERS`。

不要把闲鱼 Cookie、`JWT_SECRET` 或其他密钥写入仓库。Cookie 只通过管理页面保存到挂载的 `/data/goofishcbot.db`。

## 5. 本地验证

```bash
npm run dev
```

打开 `http://localhost:3000/goofish`。开发环境保留同源代理并自动启动端口 `3001` 的后端。
