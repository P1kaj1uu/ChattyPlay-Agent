/**
 * 用户相关类型定义
 */

// 用户头像信息
export interface UserHeadInfo {
  userId: string;
  displayName: string;
  avatar: string;
  ipLocation?: string;
  introduction?: string;
}

// 数据库用户头像缓存
export interface DbUserAvatar {
  user_id: string;
  display_name: string | null;
  avatar: string;
  ip_location: string | null;
  introduction: string | null;
  created_at: string;
  updated_at: string;
}

// 保存用户头像参数
export interface SaveUserAvatarParams {
  userId: string;
  displayName?: string;
  avatar: string;
  ipLocation?: string;
  introduction?: string;
}
