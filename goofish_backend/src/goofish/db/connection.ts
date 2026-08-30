/**
 * 数据库连接管理
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

import { DB_CONFIG } from "../core/constants";
import { createLogger } from "../core/logger";

const logger = createLogger("Db");

// 确保数据目录存在
const dbPath = path.isAbsolute(DB_CONFIG.PATH)
  ? DB_CONFIG.PATH
  : path.join(process.cwd(), DB_CONFIG.PATH);
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

// Space 的 /data 可能是网络挂载；DELETE 模式比 WAL 更适合单实例网络卷。
const journalMode = process.env.GOOFISH_SQLITE_JOURNAL_MODE
  || (process.env.SPACE_ID ? "DELETE" : "WAL");
db.pragma(`journal_mode = ${journalMode}`);
db.pragma("busy_timeout = 5000");
db.pragma("foreign_keys = ON");

export function closeDatabase() {
  db.close();
  logger.info("数据库连接已关闭");
}

export function getDbPath(): string {
  return dbPath;
}
