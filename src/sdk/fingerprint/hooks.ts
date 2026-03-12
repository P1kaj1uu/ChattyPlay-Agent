/**
 * 指纹SDK的React Hooks
 * 提供便捷的React集成方式
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FingerprintSDK } from './index';
import type { FingerprintResult, FingerprintOptions } from './types';

export interface UseFingerprintOptions extends FingerprintOptions {
  /**
   * 是否在组件挂载时自动获取指纹
   * @default true
   */
  autoLoad?: boolean;

  /**
   * 获取指纹成功后的回调
   */
  onSuccess?: (result: FingerprintResult) => void;

  /**
   * 获取指纹失败后的回调
   */
  onError?: (error: Error) => void;
}

export interface UseFingerprintReturn {
  /**
   * 指纹结果
   */
  fingerprint: FingerprintResult | null;

  /**
   * 访问者ID
   */
  visitorId: string | null;

  /**
   * 指纹哈希
   */
  hash: string | null;

  /**
   * 置信度
   */
  confidence: number | null;

  /**
   * 是否正在加载
   */
  isLoading: boolean;

  /**
   * 是否加载出错
   */
  isError: boolean;

  /**
   * 错误信息
   */
  error: Error | null;

  /**
   * 是否首次访问
   */
  isFirstVisit: boolean | null;

  /**
   * 访问统计
   */
  visitStats: {
    firstSeen: number;
    lastSeen: number;
    visitCount: number;
  } | null;

  /**
   * 刷新指纹
   */
  refresh: () => Promise<void>;

  /**
   * 清除指纹
   */
  clear: () => boolean;

  /**
   * 重新生成指纹
   */
  regenerate: () => Promise<FingerprintResult>;
}

/**
 * 指纹SDK的React Hook
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { fingerprint, visitorId, isLoading, refresh } = useFingerprint();
 *
 *   if (isLoading) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>Visitor ID: {visitorId}</p>
 *       <p>Fingerprint: {fingerprint?.hash}</p>
 *       <button onClick={refresh}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFingerprint(options: UseFingerprintOptions = {}): UseFingerprintReturn {
  const {
    autoLoad = true,
    onSuccess,
    onError,
    ...sdkOptions
  } = options;

  const [fingerprint, setFingerprint] = useState<FingerprintResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sdkRef = useRef<FingerprintSDK | null>(null);

  // 初始化SDK
  useEffect(() => {
    sdkRef.current = new FingerprintSDK(sdkOptions);
  }, [JSON.stringify(sdkOptions)]);

  // 获取指纹
  const loadFingerprint = useCallback(async () => {
    if (!sdkRef.current) return;

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await sdkRef.current.getFingerprint();
      setFingerprint(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load fingerprint');
      setIsError(true);
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  // 自动加载
  useEffect(() => {
    if (autoLoad) {
      loadFingerprint();
    }
  }, [autoLoad, loadFingerprint]);

  // 刷新指纹
  const refresh = useCallback(async () => {
    await loadFingerprint();
  }, [loadFingerprint]);

  // 清除指纹
  const clear = useCallback(() => {
    if (!sdkRef.current) return false;

    const success = sdkRef.current.clearFingerprint();
    if (success) {
      setFingerprint(null);
    }
    return success;
  }, []);

  // 重新生成指纹
  const regenerate = useCallback(async () => {
    if (!sdkRef.current) {
      throw new Error('SDK not initialized');
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const result = await sdkRef.current.regenerateFingerprint();
      setFingerprint(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to regenerate fingerprint');
      setIsError(true);
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  // 获取访问者ID
  const visitorId = fingerprint?.visitorId ?? null;

  // 获取指纹哈希
  const hash = fingerprint?.hash ?? null;

  // 获取置信度
  const confidence = fingerprint?.confidence ?? null;

  // 获取是否首次访问
  const isFirstVisit = useCallback(() => {
    if (!sdkRef.current) return null;
    return sdkRef.current.isFirstVisit();
  }, []);

  // 获取访问统计
  const visitStats = useCallback(() => {
    if (!sdkRef.current) return null;
    return sdkRef.current.getVisitStats();
  }, []);

  return {
    fingerprint,
    visitorId,
    hash,
    confidence,
    isLoading,
    isError,
    error,
    isFirstVisit: isFirstVisit(),
    visitStats: visitStats(),
    refresh,
    clear,
    regenerate,
  };
}

/**
 * 简化版的指纹Hook，只返回访问者ID
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const visitorId = useVisitorId();
 *   return <div>Visitor: {visitorId || 'Loading...'}</div>;
 * }
 * ```
 */
export function useVisitorId(): string | null {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    const sdk = new FingerprintSDK();

    async function loadVisitorId() {
      const id = sdk.getVisitorId();
      if (id) {
        setVisitorId(id);
      } else {
        const result = await sdk.getFingerprint();
        setVisitorId(result.visitorId);
      }
    }

    loadVisitorId();
  }, []);

  return visitorId;
}

/**
 * 指纹对比Hook
 * 用于比较两个指纹的相似度
 *
 * @example
 * ```tsx
 * function FingerprintCompare({ otherHash }) {
 *   const { similarity, compare } = useFingerprintCompare();
 *
 *   return (
 *     <div>
 *       <p>Similarity: {similarity}%</p>
 *       <button onClick={() => compare(otherHash)}>Compare</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useFingerprintCompare() {
  const [similarity, setSimilarity] = useState<number | null>(null);
  const sdkRef = useRef<FingerprintSDK | null>(null);

  useEffect(() => {
    sdkRef.current = new FingerprintSDK();
  }, []);

  const compare = useCallback((otherHash: string) => {
    if (!sdkRef.current) return;

    const result = sdkRef.current.compareFingerprints(otherHash);
    setSimilarity(result);
  }, []);

  return { similarity, compare };
}

/**
 * 指纹统计Hook
 * 用于访问统计
 *
 * @example
 * ```tsx
 * function VisitStats() {
 *   const stats = useVisitStats();
 *
 *   if (!stats) return <div>Loading...</div>;
 *
 *   return (
 *     <div>
 *       <p>First visit: {new Date(stats.firstSeen).toLocaleString()}</p>
 *       <p>Last visit: {new Date(stats.lastSeen).toLocaleString()}</p>
 *       <p>Visit count: {stats.visitCount}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useVisitStats() {
  const [stats, setStats] = useState<{
    firstSeen: number;
    lastSeen: number;
    visitCount: number;
  } | null>(null);

  useEffect(() => {
    const sdk = new FingerprintSDK();
    const visitStats = sdk.getVisitStats();
    setStats(visitStats);
  }, []);

  return stats;
}
