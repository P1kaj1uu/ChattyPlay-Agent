import type { Catalog, Section } from '../components/concert/types'
import { isConcertCatalog, isConcertSections } from './concertValidation'

export interface ConcertDataSource {
  kind: 'live' | 'snapshot'
  version: string
  checkedAt: string | null
}
export interface LoadedConcertCatalog {
  catalog: Catalog
  source: ConcertDataSource
}
export class ConcertCatalogChanged extends Error {}

async function requestJson(
  url: string,
  signal: AbortSignal
): Promise<{ response: Response; body: unknown }> {
  const controller = new AbortController()
  const cancel = () => controller.abort()
  if (signal.aborted) cancel()
  signal.addEventListener('abort', cancel, { once: true })
  const timeout = window.setTimeout(cancel, 30000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
    return { response, body: await response.json() }
  } finally {
    window.clearTimeout(timeout)
    signal.removeEventListener('abort', cancel)
  }
}

export async function loadLiveConcertCatalog(
  signal: AbortSignal
): Promise<LoadedConcertCatalog> {
  const { response, body } = await requestJson('/api/concert/catalog', signal)
  const result = body as {
    catalog?: unknown
    version?: unknown
    checkedAt?: unknown
  }
  if (
    !response.ok ||
    !isConcertCatalog(result.catalog) ||
    typeof result.version !== 'string' ||
    typeof result.checkedAt !== 'string' ||
    !Number.isFinite(Date.parse(result.checkedAt))
  )
    throw new Error('最新场馆目录暂时无法同步')
  return {
    catalog: result.catalog,
    source: {
      kind: 'live',
      version: result.version,
      checkedAt: result.checkedAt
    }
  }
}

export async function loadBackupConcertCatalog(
  signal: AbortSignal
): Promise<LoadedConcertCatalog> {
  const { response, body } = await requestJson('/concert/catalog.json', signal)
  const backup = body as Partial<Catalog>
  const catalog =
    backup && Array.isArray(backup.venues)
      ? {
          ...backup,
          venues: [
            ...new Map(backup.venues.map((venue) => [venue.id, venue])).values()
          ],
          events: Array.isArray(backup.events)
            ? backup.events.filter((event) =>
                backup.venues!.some((venue) => venue.id === event.venue)
              )
            : backup.events
        }
      : backup
  if (!response.ok || !isConcertCatalog(catalog))
    throw new Error('场馆备份暂时无法加载')
  return {
    catalog,
    source: {
      kind: 'snapshot',
      version: 'snapshot-2026-10-25',
      checkedAt: null
    }
  }
}

export async function loadConcertLayout(
  source: ConcertDataSource,
  venue: string,
  date: string,
  layout: string,
  signal: AbortSignal
): Promise<Section[]> {
  if (source.kind === 'snapshot') {
    const { response, body } = await requestJson(
      `/concert/layouts/${encodeURIComponent(venue)}-${encodeURIComponent(date)}.json`,
      signal
    )
    if (!response.ok || !isConcertSections(body))
      throw new Error('备份分区资料暂时无法加载')
    return body
  }
  const params = new URLSearchParams({
    venue,
    date,
    layout,
    version: source.version
  })
  const { response, body } = await requestJson(
    `/api/concert/layout?${params}`,
    signal
  )
  if (response.status === 409)
    throw new ConcertCatalogChanged('场馆目录已有更新')
  const result = body as { sections?: unknown; version?: unknown }
  if (
    !response.ok ||
    result.version !== source.version ||
    !isConcertSections(result.sections)
  )
    throw new Error('最新分区资料暂时无法同步')
  return result.sections
}
