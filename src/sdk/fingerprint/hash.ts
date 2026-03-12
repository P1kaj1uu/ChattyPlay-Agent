/**
 * 指纹哈希生成器
 * 负责将采集的数据转换为唯一的哈希值
 */

import type { FingerprintData, FingerprintOptions } from './types';

export class FingerprintHasher {
  /**
   * 生成指纹哈希
   */
  static async generateHash(
    data: FingerprintData,
    options: FingerprintOptions = {}
  ): Promise<string> {
    const algorithm = options.hashAlgorithm || 'sha256';

    // 将数据转换为字符串
    const dataString = this.normalizeData(data);

    switch (algorithm) {
      case 'sha256':
        return this.sha256(dataString);
      case 'sha384':
        return this.sha384(dataString);
      case 'sha512':
        return this.sha512(dataString);
      case 'md5':
        return this.md5(dataString);
      case 'simple':
        return this.simpleHash(dataString);
      default:
        return this.sha256(dataString);
    }
  }

  /**
   * 标准化数据为字符串
   */
  private static normalizeData(data: any): string {
    // 过滤掉时间戳等会变化的字段
    const stableData = { ...data };
    delete stableData.timestamp;

    // 按键排序并序列化
    const sortedKeys = Object.keys(stableData).sort();
    const normalized = sortedKeys.map(key => {
      const value = stableData[key];
      if (typeof value === 'object') {
        return JSON.stringify(value, Object.keys(value).sort());
      }
      return String(value);
    }).join('|');

    return normalized;
  }

  /**
   * SHA-256 哈希
   */
  private static async sha256(data: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * SHA-384 哈希
   */
  private static async sha384(data: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-384', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * SHA-512 哈希
   */
  private static async sha512(data: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * MD5 哈希 (简化版)
   */
  private static md5(data: string): string {
    // 这是一个简化的MD5实现，生产环境建议使用crypto-js等库
    const rotateLeft = (value: number, shift: number) => {
      return (value << shift) | (value >>> (32 - shift));
    };

    const addUnsigned = (a: number, b: number) => {
      const lsw = (a & 0xFFFF) + (b & 0xFFFF);
      const msw = (a >> 16) + (b >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xFFFF);
    };

    const f = (x: number, y: number, z: number) => (x & y) | (~x & z);
    const g = (x: number, y: number, z: number) => (x & z) | (y & ~z);
    const h = (x: number, y: number, z: number) => x ^ y ^ z;
    const i = (x: number, y: number, z: number) => y ^ (x | ~z);

    const ff = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const gg = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const hh = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const ii = (a: number, b: number, c: number, d: number, x: number, s: number, ac: number) => {
      a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };

    const convertToWordArray = (str: string) => {
      let lWordCount: number;
      const lMessageLength = str.length;
      const lNumberOfWordsTemp1 = lMessageLength + 8;
      const lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
      const lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
      const lWordArray: number[] = Array(lNumberOfWords - 1).fill(0);
      let lBytePosition = 0;
      let lByteCount = 0;

      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
        lByteCount++;
      }

      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;

      return lWordArray;
    };

    const wordToHex = (value: number) => {
      let hex = '';
      for (let i = 0; i <= 3; i++) {
        const byte = (value >>> (i * 8)) & 255;
        hex += byte.toString(16).padStart(2, '0');
      }
      return hex;
    };

    const x = convertToWordArray(data);
    let a = 0x67452301;
    let b = 0xEFCDAB89;
    let c = 0x98BADCFE;
    let d = 0x10325476;

    const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
    const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
    const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
    const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

    for (let k = 0; k < x.length; k += 16) {
      const AA = a;
      const BB = b;
      const CC = c;
      const DD = d;

      a = ff(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = ff(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = ff(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = ff(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = ff(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = ff(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = ff(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = ff(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = ff(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = ff(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = ff(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = ff(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = ff(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = ff(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = ff(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = ff(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = gg(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = gg(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = gg(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = gg(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = gg(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = gg(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = gg(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = gg(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = gg(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = gg(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = gg(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = gg(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = gg(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = gg(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = gg(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = gg(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = hh(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = hh(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = hh(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = hh(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = hh(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = hh(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = hh(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = hh(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = hh(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = hh(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = hh(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = hh(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = hh(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = hh(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = hh(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = hh(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = ii(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = ii(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = ii(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = ii(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = ii(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = ii(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = ii(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = ii(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = ii(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = ii(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = ii(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = ii(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = ii(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = ii(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = ii(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = ii(b, c, d, a, x[k + 9], S44, 0xEB86D391);

      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }

    return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
  }

  /**
   * 简单哈希 (用于快速生成)
   */
  private static simpleHash(data: string): string {
    let hash = 0;
    if (data.length === 0) return hash.toString(16);

    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    return Math.abs(hash).toString(16);
  }

  /**
   * 生成访问者ID
   */
  static generateVisitorId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 计算置信度 (基于收集的数据完整性)
   */
  static calculateConfidence(data: FingerprintData): number {
    let score = 0;
    let maxScore = 0;

    // 浏览器信息 (必需)
    if (data.browser?.userAgent) score += 20;
    maxScore += 20;

    // 屏幕信息
    if (data.screen?.width && data.screen?.height) score += 15;
    maxScore += 15;

    // Canvas指纹
    if (data.canvas?.canvasFingerprint) score += 20;
    maxScore += 20;

    // WebGL指纹
    if (data.canvas?.webglFingerprint) score += 15;
    maxScore += 15;

    // 音频指纹
    if (data.audio?.audioFingerprint) score += 10;
    maxScore += 10;

    // 时区信息
    if (data.timezone?.timezone) score += 10;
    maxScore += 10;

    // 特性支持
    if (data.features) score += 10;
    maxScore += 10;

    return Math.round((score / maxScore) * 100);
  }
}
