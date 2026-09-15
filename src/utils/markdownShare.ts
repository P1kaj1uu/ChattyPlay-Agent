/**
 * Markdown 分享链接工具
 * 把文档压缩后编码进 URL 的 hash 部分，全程在浏览器本地完成，不上传服务器。
 */
import { compressSync, decompressSync, strFromU8, strToU8 } from 'fflate'

/** hash 中的参数名，链接形如 https://example.com/markdown#doc=<token> */
export const SHARE_DOC_HASH_KEY = 'doc'

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  // 分块拼接，避免 String.fromCharCode 参数过多导致栈溢出
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(token: string): Uint8Array {
  const normalized = token.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** 文档内容 -> 可放进 URL 的 token */
export function encodeShareDoc(source: string): string {
  return bytesToBase64Url(compressSync(strToU8(source), { level: 9 }))
}

/** token -> 文档内容；内容损坏或格式不合法时返回 null */
export function decodeShareDoc(token: string): string | null {
  if (!token) return null
  try {
    return strFromU8(decompressSync(base64UrlToBytes(token)))
  } catch {
    return null
  }
}

/** 生成完整分享链接：沿用当前页面地址，内容放在 hash 里，不会发往服务器 */
export function buildShareUrl(source: string, baseUrl?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/markdown'
  const base = baseUrl ?? `${origin}${pathname}`
  return `${base}#${SHARE_DOC_HASH_KEY}=${encodeShareDoc(source)}`
}

/** 从 hash 中读取分享的文档内容，没有或解析失败返回 null */
export function readShareDocFromHash(hash?: string): string | null {
  const raw = hash ?? (typeof window !== 'undefined' ? window.location.hash : '')
  if (!raw) return null
  try {
    const params = new URLSearchParams(raw.replace(/^#/, ''))
    const token = params.get(SHARE_DOC_HASH_KEY)
    return token ? decodeShareDoc(token) : null
  } catch {
    return null
  }
}

/** 清掉地址栏里的分享参数 */
export function clearShareHash(): void {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
}
