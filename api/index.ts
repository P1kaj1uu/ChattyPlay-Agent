import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS
app.use('/*', cors())

// 简单的健康检查
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// 视频下载代理端点
app.post('/api/resolve', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/resolve'
  const body = await c.req.json()

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://xiazaishipin.com/',
      'Origin': 'https://xiazaishipin.com',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(body),
  })

  const responseData = await response.json()

  // 将thumbnail URL替换为代理URL
  if (responseData.thumbnail) {
    responseData.thumbnail = `/api/image-proxy?url=${encodeURIComponent(responseData.thumbnail)}`
  }

  return c.json(responseData, response.status as any)
})

// 图片代理 - 绕过防盗链
app.get('/api/image-proxy', async (c) => {
  const imageUrl = c.req.query('url')

  if (!imageUrl) {
    return c.json({ error: 'Missing url parameter' }, 400)
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'Referer': 'https://www.bilibili.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }

    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('Content-Type') || 'image/jpeg'

    return new Response(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return c.json({
      error: 'Failed to proxy image',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// B站视频下载代理
app.post('/api/bilibili-download', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/bilibili-download'
  const body = await c.req.json()

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://xiazaishipin.com/',
      'Origin': 'https://xiazaishipin.com',
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const jsonData = await response.json()
    return c.json(jsonData)
  } else {
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }
            controller.enqueue(value)
          }
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="video.mp4"`,
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'no-cache',
      },
    })
  }
})

// 抖音/其他视频下载代理
app.post('/api/proxy-download', async (c) => {
  const targetUrl = 'https://xiazaishipin.com/api/proxy-download'
  const body = await c.req.json()

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Referer': 'https://xiazaishipin.com/',
      'Origin': 'https://xiazaishipin.com',
      'Accept': '*/*',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    body: JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const jsonData = await response.json()
    return c.json(jsonData)
  } else {
    const reader = response.body?.getReader()

    if (!reader) {
      throw new Error('无法获取响应流')
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              controller.close()
              break
            }
            controller.enqueue(value)
          }
        } catch (error) {
          controller.error(error)
        } finally {
          reader.releaseLock()
        }
      }
    })

    return new Response(stream, {
      status: response.status,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': response.headers.get('Content-Disposition') || `attachment; filename="video.mp4"`,
        'Content-Length': response.headers.get('Content-Length') || '',
        'Cache-Control': 'no-cache',
      },
    })
  }
})

export default app
