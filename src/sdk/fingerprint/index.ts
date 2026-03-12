/**
 * 指纹技术SDK
 * 用于浏览器指纹识别和设备唯一标识
 *
 * @example
 * ```typescript
 * import { FingerprintSDK } from '@/sdk/fingerprint';
 *
 * // 初始化SDK
 * const sdk = new FingerprintSDK();
 *
 * // 获取指纹
 * const result = await sdk.getFingerprint();
 * console.log('Visitor ID:', result.visitorId);
 * console.log('Fingerprint Hash:', result.hash);
 * ```
 */

import { FingerprintCollector } from './collector';
import { FingerprintHasher } from './hash';
import { FingerprintStorage } from './storage';
import type { FingerprintData, FingerprintOptions, FingerprintResult, StorageData } from './types';

export class FingerprintSDK {
  private storage: FingerprintStorage;
  private options: Required<FingerprintOptions>;
  private currentFingerprint: FingerprintResult | null = null;

  constructor(options: FingerprintOptions = {}) {
    this.options = {
      includeCanvas: options.includeCanvas ?? true,
      includeWebGL: options.includeWebGL ?? true,
      includeAudio: options.includeAudio ?? true,
      includeScreen: options.includeScreen ?? true,
      includeTimezone: options.includeTimezone ?? true,
      includeFeatures: options.includeFeatures ?? true,
      storageKey: options.storageKey ?? 'fingerprint_data',
      hashAlgorithm: options.hashAlgorithm ?? 'sha256',
    };

    this.storage = new FingerprintStorage(this.options.storageKey);
  }

  /**
   * 获取指纹 (主要方法)
   * 如果本地已有指纹则复用，否则生成新的
   */
  async getFingerprint(): Promise<FingerprintResult> {
    // 检查本地是否已有指纹
    if (this.storage.exists()) {
      const storedData = this.storage.load()!;

      // 验证指纹是否仍然有效
      const isValid = await this.validateFingerprint(storedData.hash);

      if (isValid) {
        // 更新访问统计
        this.storage.updateVisit();

        // 重新采集数据以获取最新信息
        const currentData = FingerprintCollector.collectAll(this.options);

        this.currentFingerprint = {
          hash: storedData.hash,
          visitorId: storedData.visitorId,
          confidence: FingerprintHasher.calculateConfidence(currentData),
          data: currentData,
        };

        return this.currentFingerprint;
      }
    }

    // 生成新指纹
    return await this.generateFingerprint();
  }

  /**
   * 生成新的指纹
   */
  async generateFingerprint(): Promise<FingerprintResult> {
    // 采集指纹数据
    const data = FingerprintCollector.collectAll(this.options) as FingerprintData;

    // 生成哈希
    const hash = await FingerprintHasher.generateHash(data, this.options);

    // 生成访问者ID
    const visitorId = FingerprintHasher.generateVisitorId();

    // 计算置信度
    const confidence = FingerprintHasher.calculateConfidence(data);

    // 保存到本地存储
    const storageData: StorageData = {
      hash,
      visitorId,
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      visitCount: 1,
    };
    this.storage.save(storageData);

    this.currentFingerprint = {
      hash,
      visitorId,
      confidence,
      data,
    };

    return this.currentFingerprint;
  }

  /**
   * 验证指纹是否匹配
   */
  async validateFingerprint(expectedHash: string): Promise<boolean> {
    try {
      // 重新采集数据
      const currentData = FingerprintCollector.collectAll(this.options);

      // 生成新的哈希
      const currentHash = await FingerprintHasher.generateHash(currentData, this.options);

      // 比较哈希
      return currentHash === expectedHash;
    } catch (e) {
      console.warn('Fingerprint validation failed:', e);
      return false;
    }
  }

  /**
   * 获取访问者ID
   */
  getVisitorId(): string | null {
    return this.storage.getVisitorId();
  }

  /**
   * 获取指纹哈希
   */
  getHash(): string | null {
    return this.storage.getHash();
  }

  /**
   * 获取访问统计
   */
  getVisitStats(): { firstSeen: number; lastSeen: number; visitCount: number } | null {
    return this.storage.getVisitStats();
  }

  /**
   * 清除指纹数据
   */
  clearFingerprint(): boolean {
    this.currentFingerprint = null;
    return this.storage.clear();
  }

  /**
   * 导出指纹数据
   */
  exportFingerprint(): string {
    return this.storage.export();
  }

  /**
   * 导入指纹数据
   */
  importFingerprint(exportedData: string): boolean {
    return this.storage.import(exportedData);
  }

  /**
   * 获取当前指纹数据
   */
  getCurrentFingerprint(): FingerprintResult | null {
    return this.currentFingerprint;
  }

  /**
   * 重新生成指纹
   */
  async regenerateFingerprint(): Promise<FingerprintResult> {
    this.clearFingerprint();
    return await this.getFingerprint();
  }

  /**
   * 检查是否首次访问
   */
  isFirstVisit(): boolean {
    const stats = this.storage.getVisitStats();
    return stats === null || stats.visitCount <= 1;
  }

  /**
   * 获取指纹的详细信息 (用于调试)
   */
  getFingerprintDetails(): Partial<FingerprintData> | null {
    if (!this.currentFingerprint) {
      return null;
    }

    return {
      browser: this.currentFingerprint.data.browser,
      screen: this.currentFingerprint.data.screen,
      canvas: this.currentFingerprint.data.canvas,
      audio: this.currentFingerprint.data.audio,
      timezone: this.currentFingerprint.data.timezone,
      features: this.currentFingerprint.data.features,
    };
  }

  /**
   * 比较两个指纹的相似度
   */
  compareFingerprints(otherHash: string): number {
    if (!this.currentFingerprint) {
      return 0;
    }

    // 简单的字符串相似度比较
    const hash1 = this.currentFingerprint.hash;
    const hash2 = otherHash;

    if (hash1 === hash2) return 100;

    // 计算汉明距离 (对于相同长度的哈希)
    let distance = 0;
    const minLength = Math.min(hash1.length, hash2.length);

    for (let i = 0; i < minLength; i++) {
      if (hash1[i] !== hash2[i]) {
        distance++;
      }
    }

    // 转换为相似度百分比
    const maxDistance = Math.max(hash1.length, hash2.length);
    const similarity = ((maxDistance - distance) / maxDistance) * 100;

    return Math.max(0, Math.round(similarity));
  }
}

// 导出所有类型和工具类
export * from './types';
export { FingerprintCollector } from './collector';
export { FingerprintHasher } from './hash';
export { FingerprintStorage } from './storage';

// 创建默认实例
export const fingerprintSDK = new FingerprintSDK();

// 便捷方法
export async function getFingerprint(): Promise<FingerprintResult> {
  return fingerprintSDK.getFingerprint();
}

export function getVisitorId(): string | null {
  return fingerprintSDK.getVisitorId();
}

export function getHash(): string | null {
  return fingerprintSDK.getHash();
}

export function clearFingerprint(): boolean {
  return fingerprintSDK.clearFingerprint();
}
