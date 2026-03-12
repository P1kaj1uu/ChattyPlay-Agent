/**
 * 指纹SDK类型定义
 */

export interface BrowserInfo {
  userAgent: string;
  language: string;
  languages: string[];
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory: number | undefined;
  maxTouchPoints: number;
}

export interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  orientation: string | null;
  devicePixelRatio: number;
}

export interface CanvasInfo {
  canvasFingerprint: string;
  webglFingerprint: string;
  webglVendor: string;
  webglRenderer: string;
}

export interface AudioInfo {
  audioFingerprint: string;
}

export interface TimeZoneInfo {
  timezone: string;
  timezoneOffset: number;
  timezoneName: string;
}

export interface FeatureInfo {
  supportsWebGL: boolean;
  supportsWebGL2: boolean;
  supportsCanvas: boolean;
  supportsAudio: boolean;
  supportsLocalStorage: boolean;
  supportsSessionStorage: boolean;
  supportsIndexedDB: boolean;
}

export interface FingerprintData {
  browser: BrowserInfo;
  screen: ScreenInfo;
  canvas: CanvasInfo;
  audio: AudioInfo;
  timezone: TimeZoneInfo;
  features: FeatureInfo;
  timestamp: number;
}

export interface FingerprintOptions {
  includeCanvas?: boolean;
  includeWebGL?: boolean;
  includeAudio?: boolean;
  includeScreen?: boolean;
  includeTimezone?: boolean;
  includeFeatures?: boolean;
  storageKey?: string;
  hashAlgorithm?: 'sha256' | 'sha384' | 'sha512' | 'md5' | 'simple';
}

export interface FingerprintResult {
  hash: string;
  confidence: number;
  data: FingerprintData;
  visitorId: string;
}

export interface StorageData {
  hash: string;
  visitorId: string;
  firstSeen: number;
  lastSeen: number;
  visitCount: number;
}
