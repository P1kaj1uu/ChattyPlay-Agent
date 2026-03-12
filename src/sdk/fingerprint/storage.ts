/**
 * 指纹存储管理器
 * 负责指纹数据的本地存储和管理
 */

import type { StorageData } from './types';

export class FingerprintStorage {
  private readonly storageKey: string;

  constructor(storageKey: string = 'fingerprint_data') {
    this.storageKey = storageKey;
  }

  /**
   * 保存指纹数据到本地存储
   */
  save(data: StorageData): boolean {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(this.storageKey, serialized);
      return true;
    } catch (e) {
      console.warn('Failed to save fingerprint data:', e);
      return false;
    }
  }

  /**
   * 从本地存储加载指纹数据
   */
  load(): StorageData | null {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) return null;

      const data = JSON.parse(serialized) as StorageData;
      return data;
    } catch (e) {
      console.warn('Failed to load fingerprint data:', e);
      return null;
    }
  }

  /**
   * 更新访问计数和最后访问时间
   */
  updateVisit(): StorageData | null {
    const data = this.load();
    if (!data) return null;

    data.lastSeen = Date.now();
    data.visitCount += 1;

    this.save(data);
    return data;
  }

  /**
   * 清除指纹数据
   */
  clear(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (e) {
      console.warn('Failed to clear fingerprint data:', e);
      return false;
    }
  }

  /**
   * 检查指纹是否存在
   */
  exists(): boolean {
    return this.load() !== null;
  }

  /**
   * 获取访问者ID
   */
  getVisitorId(): string | null {
    const data = this.load();
    return data?.visitorId || null;
  }

  /**
   * 获取指纹哈希
   */
  getHash(): string | null {
    const data = this.load();
    return data?.hash || null;
  }

  /**
   * 获取访问统计
   */
  getVisitStats(): { firstSeen: number; lastSeen: number; visitCount: number } | null {
    const data = this.load();
    if (!data) return null;

    return {
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
      visitCount: data.visitCount,
    };
  }

  /**
   * 设置SessionStorage (临时存储)
   */
  setSessionData(key: string, value: string): boolean {
    try {
      sessionStorage.setItem(`${this.storageKey}_${key}`, value);
      return true;
    } catch (e) {
      console.warn('Failed to set session data:', e);
      return false;
    }
  }

  /**
   * 获取SessionStorage (临时存储)
   */
  getSessionData(key: string): string | null {
    try {
      return sessionStorage.getItem(`${this.storageKey}_${key}`);
    } catch (e) {
      console.warn('Failed to get session data:', e);
      return null;
    }
  }

  /**
   * 清除SessionStorage (临时存储)
   */
  clearSessionData(key?: string): boolean {
    try {
      if (key) {
        sessionStorage.removeItem(`${this.storageKey}_${key}`);
      } else {
        // 清除所有相关session数据
        Object.keys(sessionStorage)
          .filter(k => k.startsWith(this.storageKey))
          .forEach(k => sessionStorage.removeItem(k));
      }
      return true;
    } catch (e) {
      console.warn('Failed to clear session data:', e);
      return false;
    }
  }

  /**
   * 导出指纹数据 (用于备份)
   */
  export(): string {
    const data = this.load();
    if (!data) return '';

    return btoa(JSON.stringify(data));
  }

  /**
   * 导入指纹数据 (用于恢复)
   */
  import(exportedData: string): boolean {
    try {
      const decoded = atob(exportedData);
      const data = JSON.parse(decoded) as StorageData;

      // 验证数据格式
      if (!data.hash || !data.visitorId) {
        throw new Error('Invalid fingerprint data format');
      }

      return this.save(data);
    } catch (e) {
      console.warn('Failed to import fingerprint data:', e);
      return false;
    }
  }
}
