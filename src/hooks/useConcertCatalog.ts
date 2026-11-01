import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadBackupConcertCatalog,
  loadLiveConcertCatalog,
  type LoadedConcertCatalog
} from '../services/concertClient'

export function useConcertCatalog() {
  const [data, setData] = useState<LoadedConcertCatalog | null>(null)
  const [error, setError] = useState('')
  const [syncError, setSyncError] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [revision, setRevision] = useState(0)
  const lastGood = useRef<LoadedConcertCatalog | null>(null)
  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const controller = new AbortController()
    const sync = async () => {
      setSyncing(true)
      setError('')
      try {
        const result = await loadLiveConcertCatalog(controller.signal)
        if (controller.signal.aborted) return
        if (lastGood.current?.source.version === result.source.version)
          result.catalog = lastGood.current.catalog
        lastGood.current = result
        setData(result)
        setSyncError(false)
      } catch {
        if (controller.signal.aborted) return
        setSyncError(true)
        if (!lastGood.current) {
          try {
            const result = await loadBackupConcertCatalog(controller.signal)
            if (controller.signal.aborted) return
            lastGood.current = result
            setData(result)
          } catch {
            if (!controller.signal.aborted)
              setError('场馆资料暂时未能加载，请重试。')
          }
        }
      } finally {
        if (!controller.signal.aborted) setSyncing(false)
      }
    }
    void sync()
    return () => controller.abort()
  }, [revision])
  return {
    catalog: data?.catalog || null,
    source: data?.source || null,
    error,
    syncError,
    syncing,
    refresh
  }
}
