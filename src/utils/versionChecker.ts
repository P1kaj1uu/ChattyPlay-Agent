/**
 * 版本检测工具
 * 用于检测应用版本更新并提示用户
 */

export interface VersionInfo {
  current: string
  stored: string | null
}

const VERSION_STORAGE_KEY = 'app_version'
const VERSION_CHECK_FLAG_KEY = 'version_update_checked'

/**
 * 获取当前应用版本
 * 从 package.json 读取版本号
 */
export const getCurrentVersion = (): string => {
  // 从全局变量获取版本（在 vite.config.ts 中定义）
  if (typeof __APP_VERSION__ !== 'undefined') {
    return __APP_VERSION__
  }
  // 备用方案：从环境变量获取
  return import.meta.env.VITE_APP_VERSION || '1.0.0'
}

/**
 * 获取存储的版本号
 */
export const getStoredVersion = (): string | null => {
  return localStorage.getItem(VERSION_STORAGE_KEY)
}

/**
 * 保存当前版本号到 localStorage
 */
export const saveCurrentVersion = (): void => {
  const version = getCurrentVersion()
  localStorage.setItem(VERSION_STORAGE_KEY, version)
}

/**
 * 检查版本是否更新
 * @returns {boolean} 如果版本已更新返回 true，否则返回 false
 */
export const checkVersionUpdate = (): boolean => {
  const currentVersion = getCurrentVersion()
  const storedVersion = getStoredVersion()

  // 如果没有存储过版本，说明是首次安装，不需要提示
  if (!storedVersion) {
    saveCurrentVersion()
    return false
  }

  // 比较版本号
  if (currentVersion !== storedVersion) {
    return true
  }

  return false
}

/**
 * 获取版本信息
 */
export const getVersionInfo = (): VersionInfo => {
  return {
    current: getCurrentVersion(),
    stored: getStoredVersion()
  }
}

/**
 * 处理版本更新后的清理工作
 * 清空 localStorage 并重新加载页面
 */
export const handleVersionUpdate = (): void => {
  // 清空所有 localStorage
  localStorage.clear()

  // 重新加载页面
  window.location.reload()
}

/**
 * 标记版本更新已处理
 */
export const markVersionUpdateHandled = (): void => {
  localStorage.setItem(VERSION_CHECK_FLAG_KEY, 'true')
}

/**
 * 检查是否已处理过版本更新提示
 */
export const isVersionUpdateHandled = (): boolean => {
  return localStorage.getItem(VERSION_CHECK_FLAG_KEY) === 'true'
}

/**
 * 保存新版本号（用户确认更新后）
 */
export const updateStoredVersion = (): void => {
  saveCurrentVersion()
  // 清除处理标记
  localStorage.removeItem(VERSION_CHECK_FLAG_KEY)
}
