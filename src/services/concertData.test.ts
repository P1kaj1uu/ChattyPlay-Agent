import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createConcertDataService,
  ConcertVersionChanged,
  extractConcertData
} from './concertData'
import { createConcertRoutes } from './concertApi'

const ORIGIN = 'https://shijiao-static-cn.oss-cn-beijing.aliyuncs.com'
function dataModule(version: string) {
  return `import{w as e}from"./index-${version}.js";
    if(typeof process!=='undefined'||typeof fetch!=='undefined'||typeof require!=='undefined'||typeof window!=='undefined') throw Error('Host access');
    var venues=[{id:'test-arena',name:'测试场馆',short:'测试场馆',city:'上海',region:'中国内地',kind:'arena',geometry:{a:27,b:27,levels:2},defaultLayout:'center'}];
    var events=[{id:'event-${version}',venue:'test-arena',title:'演出 ${version}',artist:'歌手',date:'2026-10-29'}];
    function sections(venue,date,layout){return [{id:date?'event-section':'base-section',label:'${version} '+(layout||'center'),level:'lower',angle:0,span:.2}]}
    function defaults(venue){return {venue,section:'base-section',depth:40,lateral:50,standing:false,date:'',layout:'center'}}
    export{venues as a,events as ct,sections as f,defaults as c};`
}
function upstream() {
  let version = 'a',
    offline = false
  const calls: { url: string; cache?: RequestCache }[] = []
  const fetcher: typeof fetch = async (input, init) => {
    const url = String(input)
    calls.push({ url, cache: init?.cache })
    if (offline) throw new Error('Network offline')
    if (url.startsWith('https://shijiao.xingpaste.com/'))
      return new Response(
        `<script type="module" src="${ORIGIN}/releases/test-${version}/assets/index-${version}.js"></script>`
      )
    if (url.endsWith(`index-${version}.js`))
      return new Response(`const assets=["assets/data-${version}.js"]`)
    if (url.endsWith(`data-${version}.js`))
      return new Response(dataModule(version))
    return new Response('missing', { status: 404 })
  }
  return {
    calls,
    fetcher,
    setVersion: (value: string) => {
      version = value
    },
    goOffline: () => {
      offline = true
    }
  }
}

test('catalog does not expand every venue layout through the upstream defaults helper', async () => {
  const source = dataModule('lazy').replace(
    "function defaults(venue){return {venue,section:'base-section',depth:40,lateral:50,standing:false,date:'',layout:'center'}}",
    "function defaults(){throw Error('Eager layout expansion')}"
  )
  const catalog = (await extractConcertData(source, null)) as {
    lazySections: boolean
    venues: { sections: unknown[] }[]
  }
  assert.equal(catalog.lazySections, true)
  assert.equal(catalog.venues.length, 1)
  assert.deepEqual(catalog.venues[0].sections, [])
  const sections = await extractConcertData(source, {
    venue: 'test-arena',
    date: '',
    layout: 'center'
  })
  assert(Array.isArray(sections) && sections[0].id === 'base-section')
})

test('every catalog request checks the current release and observes a newly published version', async () => {
  const remote = upstream(),
    service = createConcertDataService(remote.fetcher)
  const first = await service.catalog()
  assert.equal(first.catalog.events[0].id, 'event-a')
  const again = await service.catalog()
  assert.equal(again.version, first.version)
  assert.equal(
    remote.calls.filter((call) => call.url.includes('_concert_sync=')).length,
    2
  )
  assert.equal(
    remote.calls.filter((call) => call.url.endsWith('data-a.js')).length,
    1
  )
  remote.setVersion('b')
  const next = await service.catalog()
  assert.equal(next.catalog.events[0].id, 'event-b')
  assert.notEqual(next.version, first.version)
  assert(remote.calls.every((call) => call.cache === 'no-store'))
})

test('layouts are read from the current release and reject an older catalog version', async () => {
  const remote = upstream(),
    service = createConcertDataService(remote.fetcher)
  const catalog = await service.catalog()
  const layout = await service.layout(
    'test-arena',
    '2026-10-29',
    'end',
    catalog.version
  )
  assert.equal(layout.sections[0].label, 'a end')
  remote.setVersion('b')
  await assert.rejects(
    service.layout('test-arena', '2026-10-29', 'end', catalog.version),
    ConcertVersionChanged
  )
  const current = await service.layout('test-arena', '2026-10-29', 'center')
  assert.equal(current.sections[0].label, 'b center')
})

test('an upstream failure cannot silently return a cached release as latest', async () => {
  const remote = upstream(),
    routes = createConcertRoutes(createConcertDataService(remote.fetcher))
  const first = await routes.request('/catalog')
  assert.equal(first.status, 200)
  assert.match(first.headers.get('Cache-Control') || '', /no-store/)
  remote.goOffline()
  const failed = await routes.request('/catalog')
  assert.equal(failed.status, 502)
  assert.equal((await failed.json()).catalog, undefined)
})

test('API validates parameters and uses 409 when release versions no longer match', async () => {
  const remote = upstream(),
    service = createConcertDataService(remote.fetcher),
    routes = createConcertRoutes(service)
  const catalog = await service.catalog()
  assert.equal(
    (await routes.request('/layout?venue=..%2Fother&date=bad')).status,
    400
  )
  remote.setVersion('b')
  const params = new URLSearchParams({
    venue: 'test-arena',
    date: '2026-10-29',
    version: catalog.version
  })
  const result = await routes.request(`/layout?${params}`)
  assert.equal(result.status, 409)
  assert.equal((await result.json()).code, 'CONCERT_VERSION_CHANGED')
})

test('untrusted asset hosts are rejected before a second network request', async () => {
  const calls: string[] = []
  const service = createConcertDataService(async (input) => {
    calls.push(String(input))
    return new Response(
      '<script type="module" src="https://other.example/data.js"></script>'
    )
  })
  await assert.rejects(service.catalog(), /资源地址/)
  assert.equal(calls.length, 1)
})
