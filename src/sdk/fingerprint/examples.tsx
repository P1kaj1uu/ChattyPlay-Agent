/**
 * 指纹SDK使用示例组件
 * 展示如何在React组件中使用指纹SDK
 */

import { useState } from 'react';
import {
  useFingerprint,
  useVisitorId,
  useFingerprintCompare,
  useVisitStats,
  FingerprintSDK
} from '../index';
import type { FingerprintResult } from './types';

/**
 * 示例1: 基础使用 - 显示访问者信息
 */
export function BasicFingerprintExample() {
  const { fingerprint, visitorId, hash, isLoading, isError, error } = useFingerprint();

  if (isLoading) {
    return <div className="p-4 bg-blue-50 rounded">正在加载指纹信息...</div>;
  }

  if (isError) {
    return <div className="p-4 bg-red-50 rounded text-red-600">
      加载失败: {error?.message}
    </div>;
  }

  return (
    <div className="p-4 bg-green-50 rounded">
      <h3 className="text-lg font-bold mb-2">访客信息</h3>
      <p><strong>访问者ID:</strong> {visitorId}</p>
      <p><strong>指纹哈希:</strong> {hash?.substring(0, 16)}...</p>
      <p><strong>置信度:</strong> {fingerprint?.confidence}%</p>
    </div>
  );
}

/**
 * 示例2: 访问统计
 */
export function VisitStatsExample() {
  const stats = useVisitStats();

  if (!stats) {
    return <div className="p-4 bg-gray-50 rounded">加载统计信息中...</div>;
  }

  return (
    <div className="p-4 bg-purple-50 rounded">
      <h3 className="text-lg font-bold mb-2">访问统计</h3>
      <p><strong>首次访问:</strong> {new Date(stats.firstSeen).toLocaleString()}</p>
      <p><strong>最后访问:</strong> {new Date(stats.lastSeen).toLocaleString()}</p>
      <p><strong>访问次数:</strong> {stats.visitCount}</p>
    </div>
  );
}

/**
 * 示例3: 完整的指纹信息展示
 */
export function FullFingerprintExample() {
  const {
    fingerprint,
    visitorId,
    isLoading,
    refresh,
    clear,
    regenerate
  } = useFingerprint({
    autoLoad: true,
    onSuccess: (result) => {
      console.log('指纹获取成功:', result);
    },
    onError: (error) => {
      console.error('指纹获取失败:', error);
    }
  });

  const [showDetails, setShowDetails] = useState(false);

  if (isLoading) {
    return <div className="p-4">加载中...</div>;
  }

  if (!fingerprint) {
    return <div className="p-4">未找到指纹信息</div>;
  }

  return (
    <div className="p-6 border rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">指纹信息详情</h2>

      {/* 基本信息 */}
      <div className="mb-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold mb-2">基本信息</h3>
        <p><strong>访问者ID:</strong> {visitorId}</p>
        <p><strong>指纹哈希:</strong> {fingerprint.hash}</p>
        <p><strong>置信度:</strong> {fingerprint.confidence}%</p>
      </div>

      {/* 操作按钮 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          刷新
        </button>
        <button
          onClick={() => regenerate()}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          重新生成
        </button>
        <button
          onClick={() => {
            clear();
            setShowDetails(false);
          }}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          清除
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          {showDetails ? '隐藏' : '显示'}详情
        </button>
      </div>

      {/* 详细信息 */}
      {showDetails && (
        <div className="space-y-4">
          {/* 浏览器信息 */}
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-2">浏览器信息</h4>
            <div className="text-sm space-y-1">
              <p><strong>User Agent:</strong> {fingerprint.data.browser.userAgent}</p>
              <p><strong>语言:</strong> {fingerprint.data.browser.language}</p>
              <p><strong>平台:</strong> {fingerprint.data.browser.platform}</p>
              <p><strong>CPU核心数:</strong> {fingerprint.data.browser.hardwareConcurrency}</p>
              <p><strong>设备内存:</strong> {fingerprint.data.browser.deviceMemory}GB</p>
              <p><strong>触摸点:</strong> {fingerprint.data.browser.maxTouchPoints}</p>
            </div>
          </div>

          {/* 屏幕信息 */}
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-2">屏幕信息</h4>
            <div className="text-sm space-y-1">
              <p><strong>分辨率:</strong> {fingerprint.data.screen.width}x{fingerprint.data.screen.height}</p>
              <p><strong>可用分辨率:</strong> {fingerprint.data.screen.availWidth}x{fingerprint.data.screen.availHeight}</p>
              <p><strong>颜色深度:</strong> {fingerprint.data.screen.colorDepth}bit</p>
              <p><strong>设备像素比:</strong> {fingerprint.data.screen.devicePixelRatio}</p>
            </div>
          </div>

          {/* Canvas信息 */}
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-2">Canvas信息</h4>
            <div className="text-sm space-y-1">
              <p><strong>Canvas指纹:</strong> {fingerprint.data.canvas.canvasFingerprint.substring(0, 50)}...</p>
              <p><strong>WebGL指纹:</strong> {fingerprint.data.canvas.webglFingerprint.substring(0, 50)}...</p>
              <p><strong>WebGL厂商:</strong> {fingerprint.data.canvas.webglVendor}</p>
              <p><strong>WebGL渲染器:</strong> {fingerprint.data.canvas.webglRenderer}</p>
            </div>
          </div>

          {/* 时区信息 */}
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-2">时区信息</h4>
            <div className="text-sm space-y-1">
              <p><strong>时区:</strong> {fingerprint.data.timezone.timezone}</p>
              <p><strong>时区偏移:</strong> {fingerprint.data.timezone.timezoneOffset}分钟</p>
              <p><strong>时区名称:</strong> {fingerprint.data.timezone.timezoneName}</p>
            </div>
          </div>

          {/* 特性支持 */}
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-bold mb-2">特性支持</h4>
            <div className="text-sm space-y-1">
              <p><strong>WebGL:</strong> {fingerprint.data.features.supportsWebGL ? '✓' : '✗'}</p>
              <p><strong>WebGL2:</strong> {fingerprint.data.features.supportsWebGL2 ? '✓' : '✗'}</p>
              <p><strong>Canvas:</strong> {fingerprint.data.features.supportsCanvas ? '✓' : '✗'}</p>
              <p><strong>Audio:</strong> {fingerprint.data.features.supportsAudio ? '✓' : '✗'}</p>
              <p><strong>LocalStorage:</strong> {fingerprint.data.features.supportsLocalStorage ? '✓' : '✗'}</p>
              <p><strong>IndexedDB:</strong> {fingerprint.data.features.supportsIndexedDB ? '✓' : '✗'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 示例4: 指纹对比
 */
export function FingerprintCompareExample() {
  const { similarity, compare } = useFingerprintCompare();
  const [otherHash, setOtherHash] = useState('');

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-2">指纹对比</h3>

      <div className="mb-4">
        <input
          type="text"
          value={otherHash}
          onChange={(e) => setOtherHash(e.target.value)}
          placeholder="输入要对比的指纹哈希"
          className="w-full p-2 border rounded"
        />
      </div>

      <button
        onClick={() => compare(otherHash)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        disabled={!otherHash}
      >
        对比
      </button>

      {similarity !== null && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p><strong>相似度:</strong> {similarity}%</p>
          <div className="w-full bg-gray-200 rounded-full h-4 mt-2">
            <div
              className="bg-blue-500 h-4 rounded-full"
              style={{ width: `${similarity}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 示例5: 高级用法 - 自定义SDK配置
 */
export function AdvancedFingerprintExample() {
  const [customSdk] = useState(() => new FingerprintSDK({
    storageKey: 'my_custom_fingerprint',
    hashAlgorithm: 'sha512',
    includeAudio: false, // 禁用音频指纹
  }));

  const [result, setResult] = useState<FingerprintResult | null>(null);

  const handleGetFingerprint = async () => {
    const fp = await customSdk.getFingerprint();
    setResult(fp);
  };

  const handleExport = () => {
    const exported = customSdk.exportFingerprint();
    console.log('Exported fingerprint:', exported);
    alert(`已导出指纹数据: ${exported.substring(0, 50)}...`);
  };

  const handleClear = () => {
    customSdk.clearFingerprint();
    setResult(null);
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-bold mb-2">高级用法</h3>

      <div className="mb-4 flex gap-2">
        <button
          onClick={handleGetFingerprint}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          获取指纹
        </button>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          导出
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          清除
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-50 rounded">
          <p><strong>访问者ID:</strong> {result.visitorId}</p>
          <p><strong>指纹哈希:</strong> {result.hash.substring(0, 32)}...</p>
          <p><strong>置信度:</strong> {result.confidence}%</p>
        </div>
      )}
    </div>
  );
}

/**
 * 示例6: 简单的访问者ID显示
 */
export function SimpleVisitorIdExample() {
  const visitorId = useVisitorId();

  return (
    <div className="p-2 bg-blue-100 rounded inline-block">
      <span className="text-sm">
        访问者ID: <code className="bg-gray-200 px-2 py-1 rounded">{visitorId || '加载中...'}</code>
      </span>
    </div>
  );
}

/**
 * 组合示例 - 完整的指纹仪表板
 */
export function FingerprintDashboard() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold">指纹SDK示例仪表板</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BasicFingerprintExample />
        <VisitStatsExample />
      </div>

      <FullFingerprintExample />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FingerprintCompareExample />
        <AdvancedFingerprintExample />
      </div>

      <div className="text-center">
        <SimpleVisitorIdExample />
      </div>
    </div>
  );
}
