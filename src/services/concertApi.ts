import { Hono } from 'hono'
import { ConcertVersionChanged, createConcertDataService } from './concertData'

export function createConcertRoutes(service = createConcertDataService()) {
  const routes = new Hono()
  routes.use('*', async (context, next) => {
    context.header('Cache-Control', 'no-store, no-cache, must-revalidate')
    await next()
  })
  routes.get('/catalog', async (context) => {
    try {
      return context.json(await service.catalog())
    } catch (error) {
      console.error('[Concert sync]', error)
      return context.json({ error: '暂时无法同步最新场馆数据' }, 502)
    }
  })
  routes.get('/layout', async (context) => {
    const { venue = '', date = '', layout, version } = context.req.query()
    if (
      !/^[\w-]{1,100}$/.test(venue) ||
      (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) ||
      (layout && !/^[a-z-]{1,40}$/.test(layout)) ||
      (version && version.length > 500)
    ) {
      return context.json({ error: '场馆或场次参数不正确' }, 400)
    }
    try {
      return context.json(await service.layout(venue, date, layout, version))
    } catch (error) {
      if (error instanceof ConcertVersionChanged)
        return context.json(
          { code: 'CONCERT_VERSION_CHANGED', error: error.message },
          409
        )
      console.error('[Concert layout sync]', error)
      return context.json({ error: '暂时无法同步本场分区数据' }, 502)
    }
  })
  return routes
}
