import { Hono } from 'hono'

const appQuery = new URLSearchParams({
  appkey: 'cc8617fd6961e070', mobi_app: 'android_comic', version: '4.13.0',
  build: '36413002', channel: 'bilicomic', platform: 'android', device: 'android',
})
const webQuery = new URLSearchParams({ device: 'pc', platform: 'web', nov: '27', a: '810' })
let visitor: { cookie: string; expires: number } | undefined
let pendingVisitor: Promise<string> | undefined

async function getVisitorCookie() {
  if (visitor && visitor.expires > Date.now()) return visitor.cookie
  if (pendingVisitor) return pendingVisitor
  pendingVisitor = (async () => {
    const response = await fetch('https://api.bilibili.com/x/frontend/finger/spi', {
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok) throw new Error('无法获取漫画访客标识')
    const result = await response.json()
    if (result.code !== 0 || !result.data?.b_3 || !result.data?.b_4) {
      throw new Error('漫画访客标识返回异常')
    }
    const cookie = `buvid3=${result.data.b_3}; buvid4=${result.data.b_4}`
    visitor = { cookie, expires: Date.now() + 6 * 60 * 60 * 1000 }
    return cookie
  })()
  try { return await pendingVisitor } finally { pendingVisitor = undefined }
}

// 搜索使用 Web 参数，详情和阅读使用 APP 参数；排行保持原请求方式。
export function createCartoonRoutes() {
  const app = new Hono()
  for (const method of ['ListRank', 'GetRankInfo', 'ComicDetail', 'GetImageIndex', 'ImageToken', 'Search']) {
    app.get(`/${method}`, async (c) => {
      const isApp = ['ComicDetail', 'GetImageIndex', 'ImageToken'].includes(method)
      const isSearch = method === 'Search'
      const needsVisitor = isApp || isSearch
      const body = isSearch
        ? {
            key_word: (c.req.query('keyWord') || '').trim(),
            page_num: Number(c.req.query('pageNum') ?? 1),
            page_size: Number(c.req.query('pageSize') ?? 20),
          }
        : method === 'ComicDetail'
        ? { comicId: Number(c.req.query('comicId')) }
        : method === 'GetImageIndex'
        ? { epId: Number(c.req.query('epId')) }
        : method === 'ImageToken'
        ? { urls: c.req.query('urls') || '' }
        : method === 'GetRankInfo'
        ? {
            id: Number(c.req.query('id') ?? 1),
            offset: Number(c.req.query('offset') ?? 0),
            sub_id: Number(c.req.query('subId') ?? 0),
          }
        : {}
      if (isSearch) {
        if (!body.key_word || body.key_word.length > 200 ||
            !Number.isSafeInteger(body.page_num) || Number(body.page_num) < 1 ||
            !Number.isSafeInteger(body.page_size) || Number(body.page_size) < 1 || Number(body.page_size) > 50) {
          return c.json({ code: -1, msg: '请提供有效的搜索关键词和分页参数', data: null }, 400)
        }
      } else if (method === 'ImageToken') {
        try {
          const urls: unknown = JSON.parse(String(body.urls))
          if (!Array.isArray(urls) || !urls.length || urls.length > 10 || urls.some(url => typeof url !== 'string')) throw new Error()
        } catch {
          return c.json({ code: -1, msg: '图片参数无效', data: null }, 400)
        }
      } else if (Object.values(body).some(value => typeof value !== 'number' || !Number.isSafeInteger(value) || value < (isApp ? 1 : 0))) {
        return c.json({ code: -1, msg: '漫画请求参数无效', data: null }, 400)
      }
      try {
        const request = async () => {
          const query = isApp ? new URLSearchParams(appQuery) : isSearch ? new URLSearchParams(webQuery) : new URLSearchParams()
          if (needsVisitor) query.set('ts', String(Math.floor(Date.now() / 1000)))
          return fetch(`https://manga.bilibili.com/twirp/comic.v1.Comic/${method}?${query}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Referer': 'https://manga.bilibili.com/',
              'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36',
              ...(needsVisitor ? { Cookie: await getVisitorCookie() } : {}),
              ...(isSearch ? { Origin: 'https://manga.bilibili.com' } : {}),
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
          })
        }
        let response = await request()
        if (!response.ok) {
          return c.json({ code: -1, msg: `漫画服务返回 HTTP ${response.status}`, data: null }, 502)
        }
        let data = await response.json()
        if (needsVisitor && data.code === 99) {
          visitor = undefined
          response = await request()
          if (!response.ok) return c.json({ code: -1, msg: `漫画服务返回 HTTP ${response.status}`, data: null }, 502)
          data = await response.json()
        }
        if (isSearch && data.code === 503) {
          return c.json({ code: 503, msg: '搜索频率受限，请稍后重试', data: null }, 429)
        }
        c.header('Cache-Control', 'no-store')
        return c.json(data)
      } catch (error) {
        const timeout = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
        return c.json({ code: -1, msg: timeout ? '漫画服务请求超时，请重试' : '漫画服务暂时无法连接', data: null }, timeout ? 504 : 502)
      }
    })
  }
  return app
}
