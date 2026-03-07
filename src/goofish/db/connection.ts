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
const dbDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(process.cwd(), DB_CONFIG.PATH);
export const db = new Database(dbPath);

// 启用 WAL 模式提高并发性能
db.pragma("journal_mode = WAL");

export function closeDatabase() {
  db.close();
  logger.info("数据库连接已关闭");
}

export function getDbPath(): string {
  return dbPath;
}
