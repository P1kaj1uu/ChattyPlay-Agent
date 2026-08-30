/**
 * 用户头像缓存数据仓库
 */

import { db } from "./connection";
import type { DbUserAvatar, SaveUserAvatarParams } from "../types/index";

// 获取用户头像
export function getUserAvatar(userId: string): DbUserAvatar | undefined {
  const stmt = db.prepare("SELECT * FROM user_avatars WHERE user_id = ?");
  return stmt.get(userId) as DbUserAvatar | undefined;
}

// 保存用户头像
export function saveUserAvatar(data: SaveUserAvatarParams): boolean {
  try {
    const stmt = db.prepare(`
            INSERT INTO user_avatars (user_id, display_name, avatar, ip_location, introduction)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                display_name = COALESCE(excluded.display_name, display_name),
                avatar = excluded.avatar,
                ip_location = COALESCE(excluded.ip_location, ip_location),
                introduction = COALESCE(excluded.introduction, introduction),
                updated_at = CURRENT_TIMESTAMP
        `);
    stmt.run(
      data.userId,
      data.displayName || null,
      data.avatar,
      data.ipLocation || null,
      data.introduction || null,
    );
    return true;
  } catch {
    return false;
  }
}

// 检查用户头像是否存在
export function hasUserAvatar(userId: string): boolean {
  const stmt = db.prepare("SELECT 1 FROM user_avatars WHERE user_id = ?");
  return !!stmt.get(userId);
}
