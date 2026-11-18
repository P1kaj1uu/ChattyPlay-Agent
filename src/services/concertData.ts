import { createHash } from 'node:crypto'
import {
  newQuickJSWASMModuleFromVariant,
  shouldInterruptAfterDeadline
} from 'quickjs-emscripten-core'
import variant from '@jitl/quickjs-wasmfile-release-sync'
import type { Catalog, Section } from '../components/concert/types'
import { isConcertCatalog, isConcertSections } from './concertValidation.js'

const MAX_SOURCE_BYTES = 8 * 1024 * 1024
const MAX_MODEL_BYTES = 64 * 1024 * 1024
let engine: ReturnType<typeof newQuickJSWASMModuleFromVariant> | undefined

export class ConcertSourceError extends Error {
  readonly code: string
  readonly stage: string
  readonly upstreamStatus?: number
  readonly cause?: unknown

  constructor(
    message: string,
    options: {
      code?: string
      stage?: string
      upstreamStatus?: number
      cause?: unknown
    } = {}
  ) {
    super(message)
    this.name = 'ConcertSourceError'
    this.code = options.code || 'CONCERT_SOURCE_INVALID'
    this.stage = options.stage || 'parse'
    this.upstreamStatus = options.upstreamStatus
    this.cause = options.cause
  }
}
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

function configuredUrl(
  key: 'VITE_CONCERT_API_URL' | 'VITE_CONCERT_OSS_API_URL'
) {
  const value = process.env[key]?.trim()
  if (!value)
    throw new ConcertSourceError(`未配置环境变量 ${key}`, {
      code: 'CONCERT_CONFIG_MISSING',
      stage: 'configuration'
    })
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol))
      throw new Error('Invalid protocol')
    return url
  } catch {
    throw new ConcertSourceError(
      `环境变量 ${key} 必须是有效的 HTTP 或 HTTPS 地址`,
      { code: 'CONCERT_CONFIG_INVALID', stage: 'configuration' }
    )
  }
}

async function readText(
  fetcher: typeof fetch,
  url: string,
  stage: string,
  maxBytes = MAX_SOURCE_BYTES
): Promise<string> {
  try {
    const response = await fetcher(url, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(12000),
      headers: {
        'Cache-Control': 'no-cache',
        Accept: 'application/json,text/html,application/javascript'
      }
    })
    if (!response.ok || !response.body)
      throw new ConcertSourceError(`参考站请求失败 (HTTP ${response.status})`, {
        code: 'CONCERT_UPSTREAM_HTTP_ERROR',
        stage,
        upstreamStatus: response.status
      })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = '',
      bytes = 0
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        bytes += value.byteLength
        if (bytes > maxBytes) {
          await reader.cancel()
          throw new ConcertSourceError('参考站资源超过大小限制', {
            code: 'CONCERT_SOURCE_TOO_LARGE',
            stage
          })
        }
        result += decoder.decode(value, { stream: true })
      }
      return result + decoder.decode()
    } finally {
      reader.releaseLock()
    }
  } catch (error) {
    if (error instanceof ConcertSourceError) throw error
    const timeout =
      error instanceof Error &&
      ['TimeoutError', 'AbortError'].includes(error.name)
    throw new ConcertSourceError(
      timeout
        ? '参考站请求超时，请稍后重试'
        : '无法连接参考站，请检查服务端网络',
      {
        code: timeout
          ? 'CONCERT_UPSTREAM_TIMEOUT'
          : 'CONCERT_UPSTREAM_UNREACHABLE',
        stage,
        cause: error
      }
    )
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
    throw new ConcertSourceError('数据解析引擎加载失败，请检查部署文件', {
      code: 'CONCERT_ENGINE_UNAVAILABLE',
      stage: 'engine',
      cause: error
    })
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

// The current upstream publishes a versioned manifest and JSON model documents.
// Read those documents directly; release bundles are application code, not a data API.
export function createConcertDataService(fetcher: typeof fetch = fetch) {
  const documents = new Map<string, Promise<any>>()
  async function json(url: string, stage: string) {
    try {
      return JSON.parse(await readText(fetcher, url, stage))
    } catch (error) {
      if (error instanceof ConcertSourceError) throw error
      throw new ConcertSourceError('参考站 JSON 数据格式发生变化', { stage })
    }
  }
  async function document(reference: { url: string; sha256: string }) {
    const url = new URL(reference.url)
    if (url.origin !== configuredUrl('VITE_CONCERT_OSS_API_URL').origin ||
        !/^\/(?:releases\/[\w-]+\/catalog|catalog\/[\w-]+)\/[\w./-]+\.json$/.test(url.pathname) ||
        !/^[a-f0-9]{64}$/.test(reference.sha256))
      throw new ConcertSourceError('参考站模型资源地址无效', { stage: 'assets' })
    const key = url.href + reference.sha256
    let pending = documents.get(key)
    if (!pending) {
      pending = (async () => {
        const text = await readText(fetcher, url.href, 'data', MAX_MODEL_BYTES)
        if (createHash('sha256').update(text).digest('hex') !== reference.sha256)
          throw new ConcertSourceError('参考站模型校验失败', { stage: 'data' })
        return JSON.parse(text)
      })()
      documents.set(key, pending)
      if (documents.size > 48) documents.delete(documents.keys().next().value!)
      pending.catch(() => { if (documents.get(key) === pending) documents.delete(key) })
    }
    return pending
  }
  async function currentRelease() {
    const url = new URL('/api/venues', configuredUrl('VITE_CONCERT_API_URL'))
    url.search = new URLSearchParams({ schemaVersion: '1', format: 'manifest' }).toString()
    const manifest = await json(url.href, 'manifest')
    const index = await document(manifest.index)
    if (index.version !== manifest.version || !Array.isArray(index.venues) || !Array.isArray(index.performances))
      throw new ConcertSourceError('参考站目录版本不匹配')
    const catalog: Catalog = {
      lazySections: true,
      venues: index.venues.filter((v: { id: string }) => index.availableVenues?.includes(v.id) ?? true).map((v: any) => ({
        ...v, short: v.short || v.name, english: v.english || '', aliases: v.aliases || '',
        region: v.region || '', kind: v.kind || 'arena', defaultLayout: index.defaultViews[v.id]?.layout || v.defaultLayout || 'end',
        sections: [], defaults: index.defaultViews[v.id] || { venue: v.id, section: '', depth: 40, lateral: 50, standing: false, date: '', layout: v.defaultLayout || 'end' }
      })),
      events: index.performances.filter((e: { venue: string }) => index.availableVenues?.includes(e.venue) ?? true)
    }
    if (!isConcertCatalog(catalog)) throw new ConcertSourceError('参考站场馆或演出数据不完整')
    return { version: manifest.version as string, catalog }
  }
  return {
    async catalog(): Promise<ConcertCatalogResponse> {
      const release = await currentRelease()
      return { catalog: release.catalog, version: release.version, checkedAt: new Date().toISOString() }
    },
    async layout(venue: string, date: string, layout?: string, version?: string): Promise<ConcertLayoutResponse> {
      const release = await currentRelease()
      if (version && version !== release.version) throw new ConcertVersionChanged('参考站已有新版本，请重新同步目录')
      if (!release.catalog.venues.some(v => v.id === venue)) throw new ConcertSourceError('场馆不存在')
      const event = release.catalog.events.find(e => e.venue === venue && e.date === date)
      const url = new URL(`/api/venues/${encodeURIComponent(venue)}/model`, configuredUrl('VITE_CONCERT_API_URL'))
      url.searchParams.set('schemaVersion', '1')
      if (event) url.searchParams.set('performanceId', event.id)
      // Performances select their own stage layout; a venue preview layout can conflict.
      if (layout && !event) url.searchParams.set('layout', layout)
      let reference
      try {
        reference = await json(url.href, 'model')
      } catch (error) {
        // Legacy preview links and generic layout controls can request a layout
        // absent from this model. Let the upstream select its supported default.
        if (event || !url.searchParams.has('layout') ||
            !(error instanceof ConcertSourceError) || error.upstreamStatus !== 409) throw error
        url.searchParams.delete('layout')
        reference = await json(url.href, 'model')
      }
      if (reference.venue?.id !== venue || reference.schemaVersion !== 1) throw new ConcertSourceError('参考站模型版本不匹配')
      const model = await document(reference.model)
      const selection = model.selections?.[reference.model.selectionKey]
      // Rendering arrays can contain duplicate stand IDs. Use the canonical
      // selectable sections when the render array fails the existing validation.
      const sections = isConcertSections(selection?.renderSections)
        ? selection.renderSections
        : selection?.sections
      if (model.venue?.id !== venue || !isConcertSections(sections)) throw new ConcertSourceError('参考站分区数据不完整')
      return { sections, version: release.version, checkedAt: new Date().toISOString() }
    }
  }
}
