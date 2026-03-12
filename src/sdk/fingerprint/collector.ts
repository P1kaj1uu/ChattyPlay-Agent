/**
 * 指纹数据采集器
 * 负责收集各种浏览器和设备特征
 */

import type { BrowserInfo, ScreenInfo, CanvasInfo, AudioInfo, TimeZoneInfo, FeatureInfo } from './types';

export class FingerprintCollector {
  /**
   * 收集浏览器信息
   */
  static collectBrowserInfo(): BrowserInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: [...navigator.languages],
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints || 0,
    };
  }

  /**
   * 收集屏幕信息
   */
  static collectScreenInfo(): ScreenInfo {
    const screen = window.screen;
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: (screen as any).orientation?.type || null,
      devicePixelRatio: window.devicePixelRatio,
    };
  }

  /**
   * 收集Canvas指纹
   */
  static collectCanvasInfo(): CanvasInfo {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Canvas指纹
    let canvasFingerprint = '';
    if (ctx) {
      canvas.width = 280;
      canvas.height = 60;
      ctx.fillStyle = '#f60';
      ctx.fillRect(100, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.font = '14px Arial';
      ctx.fillText('Hello, World! 🌍', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Hello, World! 🌍', 4, 45);
      canvasFingerprint = canvas.toDataURL();
    }

    // WebGL指纹
    let webglFingerprint = '';
    let webglVendor = '';
    let webglRenderer = '';

    try {
      const glCanvas = document.createElement('canvas');
      const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');

      if (gl) {
        // @ts-ignore
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          // @ts-ignore
          webglVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
          // @ts-ignore
          webglRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        }

        // 生成WebGL指纹
        // @ts-ignore
        const fingerprint = this.getWebGLFingerprint(gl);
        webglFingerprint = fingerprint;
      }
    } catch (e) {
      console.warn('WebGL fingerprint collection failed:', e);
    }

    return {
      canvasFingerprint,
      webglFingerprint,
      webglVendor,
      webglRenderer,
    };
  }

  /**
   * 获取WebGL指纹
   */
  private static getWebGLFingerprint(gl: WebGLRenderingContext): string {
    // 创建一个简单的WebGL场景
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader!, 'attribute vec2 attr; void main() { gl_Position = vec4(attr, 0.0, 1.0); }');
    gl.compileShader(vertexShader!);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader!, 'void main() { gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); }');
    gl.compileShader(fragmentShader!);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader!);
    gl.attachShader(program, fragmentShader!);
    gl.linkProgram(program);
    gl.useProgram(program);

    // 获取一些WebGL参数
    const parameters = [
      gl.VENDOR,
      gl.RENDERER,
      gl.VERSION,
      gl.SHADING_LANGUAGE_VERSION,
    ];

    return parameters.map(param => gl.getParameter(param)).join('|');
  }

  /**
   * 收集音频指纹
   */
  static collectAudioInfo(): AudioInfo {
    let audioFingerprint = '';

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const audioContext = new AudioContext();

        // 创建一个简单的音频处理链
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        const gain = audioContext.createGain();
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        gain.gain.value = 0; // 静音
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        oscillator.connect(analyser);
        analyser.connect(processor);
        processor.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(0);

        // 收集音频上下文信息
        audioFingerprint = JSON.stringify({
          sampleRate: audioContext.sampleRate,
          maxChannelCount: audioContext.destination.maxChannelCount,
          channelCount: audioContext.destination.channelCount,
          numberOfInputs: audioContext.destination.numberOfInputs,
          numberOfOutputs: audioContext.destination.numberOfOutputs,
        });

        oscillator.stop();
        audioContext.close();
      }
    } catch (e) {
      console.warn('Audio fingerprint collection failed:', e);
    }

    return { audioFingerprint };
  }

  /**
   * 收集时区信息
   */
  static collectTimeZoneInfo(): TimeZoneInfo {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timezoneOffset: new Date().getTimezoneOffset(),
      timezoneName: new Date().toString().match(/\((.+)\)/)?.[1] || '',
    };
  }

  /**
   * 收集特性支持信息
   */
  static collectFeatureInfo(): FeatureInfo {
    const testCanvas = document.createElement('canvas');
    const testAudio = document.createElement('audio');

    return {
      supportsWebGL: !!(
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl'))
      ),
      supportsWebGL2: !!(
        window.WebGL2RenderingContext &&
        testCanvas.getContext('webgl2')
      ),
      supportsCanvas: !!(testCanvas.getContext && testCanvas.getContext('2d')),
      supportsAudio: !!(testAudio.canPlayType && testAudio.canPlayType('audio/mpeg')),
      supportsLocalStorage: this.testLocalStorage(),
      supportsSessionStorage: this.testSessionStorage(),
      supportsIndexedDB: this.testIndexedDB(),
    };
  }

  /**
   * 测试LocalStorage是否可用
   */
  private static testLocalStorage(): boolean {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 测试SessionStorage是否可用
   */
  private static testSessionStorage(): boolean {
    try {
      const test = '__sessionStorage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 测试IndexedDB是否可用
   */
  private static testIndexedDB(): boolean {
    try {
      return !!window.indexedDB;
    } catch (e) {
      return false;
    }
  }

  /**
   * 收集所有指纹数据
   */
  static collectAll(options: {
    includeCanvas?: boolean;
    includeWebGL?: boolean;
    includeAudio?: boolean;
    includeScreen?: boolean;
    includeTimezone?: boolean;
    includeFeatures?: boolean;
  } = {}) {
    const data: any = {
      browser: this.collectBrowserInfo(),
      timestamp: Date.now(),
    };

    if (options.includeScreen !== false) {
      data.screen = this.collectScreenInfo();
    }

    if (options.includeCanvas !== false) {
      data.canvas = this.collectCanvasInfo();
    }

    if (options.includeAudio !== false) {
      data.audio = this.collectAudioInfo();
    }

    if (options.includeTimezone !== false) {
      data.timezone = this.collectTimeZoneInfo();
    }

    if (options.includeFeatures !== false) {
      data.features = this.collectFeatureInfo();
    }

    return data;
  }
}
