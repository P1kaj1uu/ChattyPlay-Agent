# 指纹技术SDK (Fingerprint SDK)

一个强大的浏览器指纹识别SDK，用于设备唯一标识和用户追踪。

## 功能特性

- 🔍 **全面的数据采集** - 收集浏览器、屏幕、Canvas、WebGL、音频等多种指纹特征
- 🔐 **多种哈希算法** - 支持SHA-256、SHA-384、SHA-512、MD5等哈希算法
- 💾 **本地存储管理** - 自动管理指纹数据的本地存储
- 📊 **访问统计** - 跟踪首次访问时间、最后访问时间和访问次数
- 🎯 **高置信度** - 基于数据完整性计算指纹置信度
- 🔄 **指纹验证** - 支持指纹一致性验证和相似度比较
- 📦 **TypeScript支持** - 完整的TypeScript类型定义

## 快速开始

### 基本使用

```typescript
import { getFingerprint, getVisitorId } from "@/sdk/fingerprint";

// 获取指纹
const result = await getFingerprint();
console.log("Visitor ID:", result.visitorId);
console.log("Fingerprint Hash:", result.hash);
console.log("Confidence:", result.confidence);

// 获取访问者ID
const visitorId = getVisitorId();
console.log("Visitor ID:", visitorId);
```

### 高级使用

```typescript
import { FingerprintSDK } from "@/sdk/fingerprint";

// 创建自定义配置的SDK实例
const sdk = new FingerprintSDK({
  includeCanvas: true,
  includeWebGL: true,
  includeAudio: true,
  includeScreen: true,
  includeTimezone: true,
  includeFeatures: true,
  storageKey: "my_app_fingerprint",
  hashAlgorithm: "sha256",
});

// 获取指纹
const fingerprint = await sdk.getFingerprint();

// 检查是否首次访问
if (sdk.isFirstVisit()) {
  console.log("Welcome, new visitor!");
} else {
  const stats = sdk.getVisitStats();
  console.log("Welcome back! Visit count:", stats?.visitCount);
}

// 获取指纹详细信息
const details = sdk.getFingerprintDetails();
console.log("Browser:", details?.browser);
console.log("Screen:", details?.screen);
console.log("Canvas:", details?.canvas);
```

### 指纹验证

```typescript
import { FingerprintSDK } from "@/sdk/fingerprint";

const sdk = new FingerprintSDK();

// 验证指纹是否匹配
const isValid = await sdk.validateFingerprint("expected_hash");
console.log("Fingerprint valid:", isValid);

// 比较两个指纹的相似度
const similarity = sdk.compareFingerprints("other_hash");
console.log("Similarity:", similarity + "%");
```

### 指纹导入导出

```typescript
import { FingerprintSDK } from "@/sdk/fingerprint";

const sdk = new FingerprintSDK();

// 导出指纹数据 (用于备份)
const exported = sdk.exportFingerprint();
console.log("Exported:", exported);

// 导入指纹数据 (用于恢复)
const success = sdk.importFingerprint(exported);
console.log("Imported:", success);
```

## API 文档

### FingerprintSDK

#### 构造函数

```typescript
constructor(options?: FingerprintOptions)
```

**参数:**

- `options.includeCanvas` - 是否包含Canvas指纹 (默认: true)
- `options.includeWebGL` - 是否包含WebGL指纹 (默认: true)
- `options.includeAudio` - 是否包含音频指纹 (默认: true)
- `options.includeScreen` - 是否包含屏幕信息 (默认: true)
- `options.includeTimezone` - 是否包含时区信息 (默认: true)
- `options.includeFeatures` - 是否包含特性支持信息 (默认: true)
- `options.storageKey` - 本地存储键名 (默认: 'fingerprint_data')
- `options.hashAlgorithm` - 哈希算法 (默认: 'sha256')

#### 方法

##### `getFingerprint(): Promise<FingerprintResult>`

获取指纹，如果本地已有则复用，否则生成新的。

**返回:** `Promise<FingerprintResult>`

##### `generateFingerprint(): Promise<FingerprintResult>`

生成新的指纹。

**返回:** `Promise<FingerprintResult>`

##### `validateFingerprint(expectedHash: string): Promise<boolean>`

验证指纹是否匹配。

**参数:**

- `expectedHash` - 期望的指纹哈希

**返回:** `Promise<boolean>`

##### `getVisitorId(): string | null`

获取访问者ID。

**返回:** `string | null`

##### `getHash(): string | null`

获取指纹哈希。

**返回:** `string | null`

##### `getVisitStats(): VisitStats | null`

获取访问统计。

**返回:** `{ firstSeen: number; lastSeen: number; visitCount: number } | null`

##### `clearFingerprint(): boolean`

清除指纹数据。

**返回:** `boolean`

##### `exportFingerprint(): string`

导出指纹数据。

**返回:** `string` (Base64编码的指纹数据)

##### `importFingerprint(exportedData: string): boolean`

导入指纹数据。

**参数:**

- `exportedData` - 导出的指纹数据

**返回:** `boolean`

##### `isFirstVisit(): boolean`

检查是否首次访问。

**返回:** `boolean`

##### `getFingerprintDetails(): Partial<FingerprintData> | null`

获取指纹的详细信息。

**返回:** `Partial<FingerprintData> | null`

##### `compareFingerprints(otherHash: string): number`

比较两个指纹的相似度。

**参数:**

- `otherHash` - 另一个指纹哈希

**返回:** `number` (0-100的相似度百分比)

## 类型定义

### FingerprintResult

```typescript
interface FingerprintResult {
  hash: string; // 指纹哈希
  confidence: number; // 置信度 (0-100)
  data: FingerprintData; // 指纹数据
  visitorId: string; // 访问者ID
}
```

### FingerprintData

```typescript
interface FingerprintData {
  browser: BrowserInfo; // 浏览器信息
  screen: ScreenInfo; // 屏幕信息
  canvas: CanvasInfo; // Canvas信息
  audio: AudioInfo; // 音频信息
  timezone: TimeZoneInfo; // 时区信息
  features: FeatureInfo; // 特性支持信息
  timestamp: number; // 时间戳
}
```

## 在React组件中使用

```tsx
import { useEffect, useState } from "react";
import { getFingerprint } from "@/sdk/fingerprint";

function UserProfile() {
  const [fingerprint, setFingerprint] = useState<string | null>(null);
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFingerprint() {
      const result = await getFingerprint();
      setFingerprint(result.hash);
      setVisitorId(result.visitorId);
    }

    loadFingerprint();
  }, []);

  return (
    <div>
      <p>Visitor ID: {visitorId}</p>
      <p>Fingerprint: {fingerprint}</p>
    </div>
  );
}
```

## 注意事项

1. **隐私合规** - 使用指纹识别技术时，请确保遵守相关隐私法规（如GDPR、CCPA等）
2. **指纹变化** - 某些情况下指纹可能会变化（如浏览器更新、硬件变更等）
3. **隐私模式** - 在隐私模式下，某些指纹特征可能无法采集
4. **跨浏览器** - 不同浏览器的指纹可能不同
5. **存储限制** - LocalStorage有存储大小限制，请注意数据量

## 性能优化建议

1. **延迟加载** - 可以在页面加载后再获取指纹，避免阻塞首屏渲染
2. **缓存结果** - 指纹结果会自动缓存，避免重复计算
3. **选择性采集** - 根据需要选择采集哪些特征，减少计算开销
4. **后台计算** - 对于耗时的操作（如音频指纹），可以在后台进行
