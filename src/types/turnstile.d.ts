/**
 * Cloudflare Turnstile 类型声明
 */

interface TurnstileObject {
  render(container: Element | string, options: TurnstileConfig): string
  getResponse(widgetId?: string): string
  reset(widgetId: string): void
  remove(widgetId: string): void
}

interface TurnstileConfig {
  sitekey: string
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  callback?: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  'before-callback'?: () => void
  'timeout-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
}

interface Window {
  turnstile?: TurnstileObject
}
