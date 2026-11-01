import { useCallback, useEffect, useRef, useState } from 'react'
import type { Catalog, Section, Venue } from '../components/concert/types'
import {
  ConcertCatalogChanged,
  loadConcertLayout,
  type ConcertDataSource
} from '../services/concertClient'

export function useConcertSections(
  venue: Venue | undefined,
  date: string,
  layout: string,
  source: ConcertDataSource | null,
  catalog: Catalog | null,
  refreshCatalog: () => void
) {
  const cache = useRef(new Map<string, Section[]>())
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{
    key: string
    sections?: Section[]
    error?: string
  }>({ key: '' })
  const kind = source?.kind,
    version = source?.version,
    venueId = venue?.id
  const key = JSON.stringify([version, venueId, date, layout])
  const hasBackup = !!date && !!catalog?.layouts?.includes(`${venueId}:${date}`)
  const needsRequest = !!venueId && !!kind && (kind === 'live' || hasBackup)
  const retry = useCallback(() => setAttempt((value) => value + 1), [])
  useEffect(() => {
    if (!needsRequest || !venueId || !kind || !version) return
    const cached = cache.current.get(key)
    if (cached) {
      setResult({ key, sections: cached })
      return
    }
    const controller = new AbortController()
    setResult({ key })
    loadConcertLayout(
      { kind, version, checkedAt: null },
      venueId,
      date,
      layout,
      controller.signal
    )
      .then((sections) => {
        if (controller.signal.aborted) return
        cache.current.set(key, sections)
        if (cache.current.size > 48)
          cache.current.delete(cache.current.keys().next().value!)
        setResult({ key, sections })
      })
      .catch((error) => {
        if (controller.signal.aborted) return
        if (error instanceof ConcertCatalogChanged) {
          setResult({ key, error: '目录已有更新，正在重新同步。' })
          refreshCatalog()
          return
        }
        setResult({
          key,
          error: '这个场次的分区暂时未能加载。请重试，或选择其他场次。'
        })
      })
    return () => controller.abort()
  }, [
    key,
    kind,
    version,
    venueId,
    date,
    layout,
    needsRequest,
    refreshCatalog,
    attempt
  ])
  const current = result.key === key ? result : undefined
  const sections =
    current?.sections || cache.current.get(key) || venue?.sections || []
  return {
    sections,
    error: current?.error || '',
    loading:
      needsRequest &&
      !current?.error &&
      !current?.sections &&
      !cache.current.has(key),
    approximate: kind === 'snapshot' && !!date && !hasBackup,
    retry
  }
}
