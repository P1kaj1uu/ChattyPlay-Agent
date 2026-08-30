const configuredOrigins = (process.env.GOOFISH_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

const allowVercelPreviews = process.env.GOOFISH_ALLOW_VERCEL_PREVIEWS === 'true'

export function isAllowedFrontendOrigin(origin: string): boolean {
  try {
    const url = new URL(origin)
    const normalizedOrigin = url.origin.replace(/\/$/, '')

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true
    if (configuredOrigins.includes(normalizedOrigin)) return true
    return allowVercelPreviews && url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

export function resolveCorsOrigin(origin: string): string | undefined {
  return isAllowedFrontendOrigin(origin) ? origin : undefined
}
