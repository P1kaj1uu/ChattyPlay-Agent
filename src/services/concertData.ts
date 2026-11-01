import {
  newQuickJSWASMModuleFromVariant,
  shouldInterruptAfterDeadline
} from 'quickjs-emscripten-core'
import variant from '@jitl/quickjs-wasmfile-release-sync'
import type { Catalog, Section } from '../components/concert/types'
import { isConcertCatalog, isConcertSections } from './concertValidation'

const SITE = 'https://shijiao.xingpaste.com/'
const ASSET_ORIGIN = 'https://shijiao-static-cn.oss-cn-beijing.aliyuncs.com'
const MAX_SOURCE_BYTES = 8 * 1024 * 1024
let engine: ReturnType<typeof newQuickJSWASMModuleFromVariant> | undefined

export class ConcertSourceError extends Error {}
export class ConcertVersionChanged extends Error {}
export interface ConcertDataInfo {
  version: string
  checkedAt: string
}
export interface ConcertCatalogResponse extends ConcertDataInfo {
  catalog: Catalog
}
export interface ConcertLayoutResponse extends ConcertDataInfo {
  sections: Section[]
}

function assetUrl(path: string, base: string): string {
  const url = new URL(path, base)
  if (
    url.origin !== ASSET_ORIGIN ||
    !/^\/releases\/[\w-]+\/assets\/[\w.-]+\.js$/.test(url.pathname)
  ) {
    throw new ConcertSourceError('参考站资源地址发生变化')
  }
  return url.href
}

async function readText(fetcher: typeof fetch, url: string): Promise<string> {
  const response = await fetcher(url, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(12000),
    headers: {
      'Cache-Control': 'no-cache',
      Accept: 'text/html,application/javascript'
    }
  })
  if (!response.ok || !response.body)
    throw new ConcertSourceError(`参考站请求失败 (${response.status})`)
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let result = '',
    bytes = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > MAX_SOURCE_BYTES) {
        await reader.cancel()
        throw new ConcertSourceError('参考站资源超过大小限制')
      }
      result += decoder.decode(value, { stream: true })
    }
    return result + decoder.decode()
  } finally {
    reader.releaseLock()
  }
}

// The upstream exposes data through its release module rather than a catalog JSON API.
// Evaluate only that data module in an isolated WASM VM with no host functions,
// filesystem, browser globals, module loader or network access. Never use eval/vm
// in the Node process, and never execute the upstream app/analytics bundle.
export async function extractConcertData(
  source: string,
  request: { venue: string; date: string; layout?: string } | null
): Promise<unknown> {
  const dependency = source.match(
    /^import\{[\w$]+ as ([\w$]+)\}from["']\.\/index-[\w-]+\.js["'];/
  )
  const exports = source.match(/export\{([^}]+)\};?\s*$/)
  if (!dependency || !exports)
    throw new ConcertSourceError('参考站数据格式发生变化')
  const pairs = exports[1].split(',').map((entry) => {
    const match = entry.trim().match(/^([\w$]+)(?: as ([\w$]+))?$/)
    if (!match) throw new ConcertSourceError('参考站数据导出格式发生变化')
    return `${JSON.stringify(match[2] || match[1])}:${match[1]}`
  })
  const body = source.slice(dependency[0].length, exports.index)
  const code = `(function(){
    globalThis.__concert_phase='initialization';
    const data = (function(){
      const ${dependency[1]} = value => value;
      ${body}
      return {${pairs.join(',')}};
    })();
    if(typeof data.f!=='function'||typeof data.c!=='function') throw Error('Unsupported data module');
    const arrays = Object.values(data).filter(Array.isArray);
    const venueRows = arrays.find(items => items.length && items.every(v => v && typeof v.id==='string' && v.geometry && typeof v.name==='string'));
    if(!venueRows) throw Error('Missing venues');
    const venues = [...new Map(venueRows.map(v=>[v.id,v])).values()];
    const request = ${JSON.stringify(request)};
    if(request){
      if(!venues.some(v=>v.id===request.venue)) throw Error('Unknown venue');
      return JSON.stringify(data.f(request.venue,request.date||undefined,request.layout||undefined));
    }
    const ids = new Set(venues.map(v=>v.id));
    globalThis.__concert_phase='events';
    const events = [...new Map(arrays.flat().filter(e=>e && typeof e.id==='string' && ids.has(e.venue) && typeof e.title==='string' && typeof e.artist==='string' && typeof e.date==='string').map(e=>[e.id,e])).values()];
    return JSON.stringify({
      lazySections:true,
      venues:venues.map(v=>{
        globalThis.__concert_phase=v.id;
        // Upstream defaults compute a complete layout. Doing this for every
        // venue makes the directory quadratic and can exhaust the VM deadline.
        // Select the first available section once its layout is requested.
        const defaults={venue:v.id,section:'',depth:40,lateral:50,standing:false,date:'',layout:v.defaultLayout||'end'};
        return {...v,short:v.short||v.name,english:v.english||'',aliases:v.aliases||'',region:v.region||'',kind:v.kind||'arena',defaultLayout:v.defaultLayout||defaults.layout||'end',sections:[],defaults};
      }),
      events,
      layouts:[...new Set(events.filter(e=>/^\\d{4}-\\d{2}-\\d{2}$/.test(e.date)).map(e=>e.venue+':'+e.date))]
    });
  })()`
  engine ??= newQuickJSWASMModuleFromVariant(variant).catch((error) => {
    engine = undefined
    throw error
  })
  const vm = await engine
  const context = vm.newContext()
  context.runtime.setMemoryLimit(128 * 1024 * 1024)
  context.runtime.setInterruptHandler(
    shouldInterruptAfterDeadline(Date.now() + 5000)
  )
  try {
    const result = context.evalCode(code)
    if (result.error) {
      context.runtime.setInterruptHandler(() => false)
      const error = context.dump(result.error)
      result.error.dispose()
      const phase = context.getProp(context.global, '__concert_phase')
      const location = context.getString(phase)
      phase.dispose()
      throw new Error(`${error.message} (${location})`)
    }
    const serialized = context.dump(result.value)
    result.value.dispose()
    if (typeof serialized !== 'string' || serialized.length > 16 * 1024 * 1024)
      throw new Error('Invalid data')
    return JSON.parse(serialized)
  } catch (error) {
    const reason =
      error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : String(error)
    throw new ConcertSourceError(
      `参考站数据暂时无法解析：${reason.slice(0, 200)}`
    )
  } finally {
    context.dispose()
  }
}

export function createConcertDataService(fetcher: typeof fetch = fetch) {
  const releases = new Map<
    string,
    Promise<{ version: string; source: string; catalog: Catalog }>
  >()
  async function currentRelease() {
    // Recheck the entry page for EVERY request. Only content-hashed releases are
    // reused; there is deliberately no TTL cache of the "latest" release pointer.
    const html = await readText(fetcher, `${SITE}?_concert_sync=${Date.now()}`)
    const moduleTag = html.match(/<script\b[^>]*type=["']module["'][^>]*>/)?.[0]
    const entry = moduleTag?.match(/\bsrc=["']([^"']+)["']/)?.[1]
    if (!entry) throw new ConcertSourceError('参考站未提供当前发布版本')
    const entryUrl = assetUrl(entry, SITE)
    let release = releases.get(entryUrl)
    if (!release) {
      release = (async () => {
        const main = await readText(fetcher, entryUrl)
        const dataPath = main.match(/assets\/data-[\w-]+\.js/)?.[0]
        if (!dataPath) throw new ConcertSourceError('参考站未提供数据模块')
        const dataUrl = assetUrl(`../${dataPath}`, entryUrl)
        const source = await readText(fetcher, dataUrl)
        const catalog = await extractConcertData(source, null)
        if (!isConcertCatalog(catalog))
          throw new ConcertSourceError('参考站场馆或演出数据不完整')
        return { version: dataUrl, source, catalog }
      })()
      releases.set(entryUrl, release)
      if (releases.size > 2) releases.delete(releases.keys().next().value!)
      release.catch(() => {
        if (releases.get(entryUrl) === release) releases.delete(entryUrl)
      })
    }
    return release
  }
  return {
    async catalog(): Promise<ConcertCatalogResponse> {
      const release = await currentRelease()
      return {
        catalog: release.catalog,
        version: release.version,
        checkedAt: new Date().toISOString()
      }
    },
    async layout(
      venue: string,
      date: string,
      layout?: string,
      version?: string
    ): Promise<ConcertLayoutResponse> {
      const release = await currentRelease()
      if (version && version !== release.version)
        throw new ConcertVersionChanged('参考站已有新版本，请重新同步目录')
      if (!release.catalog.venues.some((item) => item.id === venue))
        throw new ConcertSourceError('场馆不存在')
      const sections = await extractConcertData(release.source, {
        venue,
        date,
        layout
      })
      if (!isConcertSections(sections))
        throw new ConcertSourceError('参考站分区数据不完整')
      return {
        sections,
        version: release.version,
        checkedAt: new Date().toISOString()
      }
    }
  }
}
