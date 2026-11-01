import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  FiArrowRight,
  FiCalendar,
  FiCamera,
  FiCheck,
  FiChevronDown,
  FiChevronRight,
  FiColumns,
  FiCompass,
  FiDownload,
  FiEye,
  FiHelpCircle,
  FiLayers,
  FiMapPin,
  FiMaximize,
  FiMinimize,
  FiMusic,
  FiRotateCcw,
  FiSearch,
  FiShare2,
  FiSliders,
  FiTrash2,
  FiX
} from 'react-icons/fi'
import Dialog, { lockConcertScroll } from '../components/concert/Dialog'
import NumberField from '../components/concert/NumberField'
import SeatMap from '../components/concert/SeatMap'
import SceneBoundary from '../components/concert/SceneBoundary'
import type { StadiumHandle } from '../components/concert/Stadium'
import { useConcertCatalog } from '../hooks/useConcertCatalog'
import { useConcertSections } from '../hooks/useConcertSections'
import {
  createVenueGeometry,
  stageDistance
} from '../components/concert/geometry'
import {
  LEVELS,
  Position,
  ComparisonPosition,
  Venue
} from '../components/concert/types'
import '../assets/css/concert.css'

const Stadium = lazy(() => import('../components/concert/Stadium'))
type Panel = '' | 'event' | 'seat' | 'adjust'
const EMPTY_POSITION: Position = {
  venue: 'kspo-dome',
  section: '5',
  depth: 40,
  lateral: 50,
  standing: false,
  date: '',
  layout: 'center'
}

function SelectVenue({
  venues,
  value,
  onChange,
  placeholder = '请选择场馆'
}: {
  venues: Venue[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}) {
  return (
    <select
      aria-label="选择场馆"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {venues.map((venue) => (
        <option key={venue.id} value={venue.id}>
          {venue.city} · {venue.name}
        </option>
      ))}
    </select>
  )
}

export default function Concert() {
  const [params, setParams] = useSearchParams()
  const {
    catalog,
    source,
    error: catalogError,
    syncError,
    syncing,
    refresh
  } = useConcertCatalog()
  const [panel, setPanel] = useState<Panel>('')
  const [display, setDisplay] = useState<'2d' | '3d'>('3d')
  const [mode, setMode] = useState<'overview' | 'audience' | 'phone'>(() =>
    params.get('view') === 'phone'
      ? 'phone'
      : params.get('view') === 'audience'
        ? 'audience'
        : 'overview'
  )
  const [roof, setRoof] = useState(false)
  const [zoom, setZoom] = useState(() =>
    ['0.5', '1', '2', '3', '5'].includes(params.get('zoom') || '')
      ? Number(params.get('zoom'))
      : 1
  )
  const [level, setLevel] = useState('lower')
  const [directory, setDirectory] = useState(false)
  const [directoryTab, setDirectoryTab] = useState<'venues' | 'events'>(
    'venues'
  )
  const [search, setSearch] = useState('')
  const [region, setRegion] = useState('全部')
  const [help, setHelp] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [toast, setToast] = useState('')
  const [viewerError, setViewerError] = useState('')
  const [immersive, setImmersive] = useState(false)
  const [nativeFullscreen, setNativeFullscreen] = useState(false)
  const [compare, setCompare] = useState<ComparisonPosition[]>([])
  const [comparing, setComparing] = useState(false)
  const stadium = useRef<StadiumHandle>(null)
  const viewer = useRef<HTMLDivElement>(null)
  const showAudience = () => {
    setDisplay('3d')
    setMode('audience')
    setPanel(window.matchMedia('(max-width: 760px)').matches ? '' : 'adjust')
  }
  useEffect(() => {
    if (!params.has('tab')) return
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        next.delete('tab')
        return next
      },
      { replace: true }
    )
  }, [params, setParams])

  useEffect(() => {
    const changed = () =>
      setNativeFullscreen(document.fullscreenElement === viewer.current)
    document.addEventListener('fullscreenchange', changed)
    return () => document.removeEventListener('fullscreenchange', changed)
  }, [])
  useEffect(() => (immersive ? lockConcertScroll() : undefined), [immersive])
  useEffect(() => {
    const keyboard = (event: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || event.defaultPrevented)
        return
      if (event.key === 'Escape' && immersive) {
        setImmersive(false)
        return
      }
      if (
        event.key === '/' &&
        !event.ctrlKey &&
        !event.metaKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        event.preventDefault()
        setDirectory(true)
      }
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [immersive])
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    document.title = '演唱 Live · 在出发前，看看现场'
    return () => {
      document.title = 'ChattyPlay'
    }
  }, [])
  const venues = catalog?.venues || []
  const baseVenue =
    venues.find((item) => item.id === params.get('venue')) ||
    venues.find((item) => item.id === 'kspo-dome') ||
    venues[0]
  const event = catalog?.events.find(
    (item) => item.id === params.get('event') && item.venue === baseVenue?.id
  )
  const requestedDate = params.get('date') || ''
  const selectedDate =
    event?.date ||
    (/^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : '')
  const selectedLayout = /^[a-z-]{1,40}$/.test(params.get('layout') || '')
    ? params.get('layout')!
    : event?.layout || baseVenue?.defaultLayout || 'center'
  const {
    sections,
    error: sectionError,
    loading: sectionsLoading,
    approximate,
    retry: retrySections
  } = useConcertSections(
    baseVenue,
    selectedDate,
    selectedLayout,
    source,
    catalog,
    refresh
  )
  const venue = useMemo(
    () =>
      baseVenue && {
        ...baseVenue,
        sections
      },
    [baseVenue, sections]
  )
  const clamp = (value: string | null, fallback: number) =>
    value !== null && Number.isFinite(Number(value))
      ? Math.max(0, Math.min(100, Number(value)))
      : fallback
  const requestedSection = params.get('section') || venue?.defaults.section
  const section =
    venue?.sections.find((item) => item.id === requestedSection) ||
    venue?.sections[0]
  const selectedLevel = section?.level
  useEffect(() => {
    if (selectedLevel) setLevel(selectedLevel)
  }, [selectedLevel])
  const position = useMemo<Position>(
    () => ({
      venue: venue?.id || EMPTY_POSITION.venue,
      section: section?.id || EMPTY_POSITION.section,
      depth: clamp(params.get('depth'), 40),
      lateral: clamp(params.get('lateral'), 50),
      standing: params.get('standing') === '1',
      date: selectedDate,
      layout: selectedLayout
    }),
    [venue, section, params, selectedDate, selectedLayout]
  )
  const selectedGeometry = useMemo(
    () =>
      venue
        ? createVenueGeometry(venue).find(
            (item) => item.section.id === section?.id
          )
        : undefined,
    [venue, section?.id]
  )
  const estimatedRows =
    section?.level === 'floor' ? 12 : selectedGeometry?.rows || 20
  const estimatedSeats =
    section?.level === 'floor'
      ? 15
      : selectedGeometry
        ? Math.min(
            34,
            Math.max(
              8,
              Math.floor(
                ((selectedGeometry.a + selectedGeometry.depth / 2) *
                  selectedGeometry.span) /
                  0.6
              )
            )
          )
        : 30
  const distance =
    venue && selectedGeometry
      ? Math.round(stageDistance(venue, selectedGeometry, position))
      : 0
  const setPosition = useCallback(
    (patch: Partial<Position>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous)
          Object.entries(patch).forEach(([key, value]) =>
            next.set(
              key,
              typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
            )
          )
          return next
        },
        { replace: true }
      )
    },
    [setParams]
  )
  const selectVenue = (id: string) => {
    const nextVenue = venues.find((v) => v.id === id)
    if (!nextVenue) return
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      next.set('venue', id)
      next.set(
        'section',
        nextVenue.defaults.section || nextVenue.sections[0]?.id || ''
      )
      next.set('layout', nextVenue.defaultLayout)
      next.delete('event')
      next.delete('date')
      next.delete('depth')
      next.delete('lateral')
      next.delete('standing')
      return next
    })
    setLevel(
      nextVenue.sections.find((s) => s.id === nextVenue.defaults.section)
        ?.level ||
        nextVenue.sections[0]?.level ||
        'lower'
    )
    setMode('overview')
  }
  const makeComparison = (): ComparisonPosition => ({
    ...position,
    id: crypto.randomUUID(),
    name: `${venue!.short} · ${section!.label}`,
    venueData: venue!,
    performance: event?.id
  })
  const alreadyCompared = compare.some(
    (p) =>
      p.venue === position.venue &&
      p.section === position.section &&
      p.depth === position.depth &&
      p.lateral === position.lateral &&
      p.layout === position.layout &&
      p.date === position.date &&
      p.standing === position.standing
  )
  const addCompare = () => {
    if (!section || sectionsLoading) return
    if (alreadyCompared) {
      setToast('这个位置已在对比中')
      return
    }
    if (compare.length >= 3) {
      setComparing(true)
      return
    }
    setCompare((previous) => [...previous, makeComparison()])
    setToast('已加入位置对比')
  }
  const share = async () => {
    const link = new URL('/concert', window.location.origin)
    Object.entries(position).forEach(([key, value]) =>
      link.searchParams.set(
        key,
        typeof value === 'boolean' ? (value ? '1' : '0') : String(value)
      )
    )
    if (event) link.searchParams.set('event', event.id)
    link.searchParams.set('view', mode)
    if (mode === 'phone') link.searchParams.set('zoom', String(zoom))
    try {
      await navigator.clipboard.writeText(link.href)
      setToast('位置链接已复制')
    } catch {
      setShareLink(link.href)
    }
  }
  const selectSection = (id: string) => {
    setPosition({ section: id })
    const next = venue?.sections.find((s) => s.id === id)
    if (next) setLevel(next.level)
  }
  const openComparison = (item: ComparisonPosition) => {
    setParams({
      venue: item.venue,
      section: item.section,
      depth: String(item.depth),
      lateral: String(item.lateral),
      standing: item.standing ? '1' : '0',
      layout: item.layout,
      date: item.date,
      ...(item.performance ? { event: item.performance } : {})
    })
    setMode('audience')
    setDisplay('3d')
    setPanel(window.matchMedia('(max-width: 760px)').matches ? '' : 'adjust')
    setComparing(false)
  }
  const fullscreen = async () => {
    if (immersive) {
      setImmersive(false)
      return
    }
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => {})
      return
    }
    try {
      if (viewer.current?.requestFullscreen)
        await viewer.current.requestFullscreen()
      else setImmersive(true)
    } catch {
      setImmersive(true)
    }
  }
  const saveSnapshot = () => {
    const frame = viewer.current
        ?.querySelector('.phone-frame')
        ?.getBoundingClientRect(),
      bounds = viewer.current?.getBoundingClientRect()
    const crop =
      frame && bounds
        ? {
            x: (frame.left - bounds.left) / bounds.width,
            y: (frame.top - bounds.top) / bounds.height,
            width: frame.width / bounds.width,
            height: frame.height / bounds.height
          }
        : undefined
    if (!stadium.current?.snapshot(crop))
      setViewerError('取景未能保存，请重试或使用系统截图。')
  }
  const changePerformance = (id: string) => {
    const performance = catalog?.events.find((item) => item.id === id)
    setParams((previous) => {
      const next = new URLSearchParams(previous)
      if (id) next.set('event', id)
      else next.delete('event')
      next.delete('date')
      next.delete('section')
      next.delete('depth')
      next.delete('lateral')
      next.delete('standing')
      next.set(
        'layout',
        performance?.layout || baseVenue?.defaultLayout || 'center'
      )
      return next
    })
    setMode('overview')
  }
  if (catalogError || !catalog || !venue)
    return (
      <div className="concert-app concert-loading">
        <FiCompass />
        <h2>{catalogError || sectionError || '正在同步最新场馆…'}</h2>
        {(catalogError || sectionError) && (
          <button className="primary-button" onClick={refresh}>
            重新加载
          </button>
        )}
      </div>
    )

  return (
    <div className="concert-app is-exploring">
      <header className="concert-topbar">
        <div className="concert-brand">
          <span>
            <FiCompass aria-hidden="true" />
          </span>
          <div>
            <h1>演唱视角</h1>
            <p>场馆与座位预览</p>
          </div>
        </div>
        <button className="concert-search" onClick={() => setDirectory(true)}>
          <FiSearch aria-hidden="true" />
          <span>找场馆 / 场次</span>
          <kbd>/</kbd>
        </button>
        <button
          className="concert-help-button"
          aria-label="使用帮助"
          onClick={() => setHelp(true)}
        >
          <FiHelpCircle aria-hidden="true" />
          <span>使用帮助</span>
        </button>
      </header>
      <div
        className={`concert-data-status ${syncError ? 'is-stale' : ''}`}
        role="status"
      >
        <span>
          {syncing
            ? '正在同步最新数据…'
            : source?.kind === 'snapshot'
              ? '同步暂不可用 · 当前为本地备份（2026-10-25）'
              : `${syncError ? '同步失败，显示上次数据' : '数据已同步'}${source?.checkedAt ? ` · ${new Date(source.checkedAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}` : ''}`}
        </span>
        <button
          onClick={refresh}
          disabled={syncing}
          aria-label="同步最新场馆数据"
        >
          <FiRotateCcw />
          {syncing ? '同步中' : '同步最新'}
        </button>
      </div>

      <>
        <div className="concert-contextbar">
          <header className="concert-context">
            <button
              aria-expanded={panel === 'event'}
              onClick={() => setPanel(panel === 'event' ? '' : 'event')}
            >
              <span>
                <strong>{venue.short}</strong>
                <small>
                  {event
                    ? `${event.title} · ${event.date}`
                    : '自由预览 · 未选择演出'}
                </small>
              </span>
              <FiChevronDown />
            </button>
          </header>
          <div
            className="concert-display-tabs"
            role="tablist"
            aria-label="场馆展示方式"
            onKeyDown={(event) => {
              if (
                !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)
              )
                return
              event.preventDefault()
              const next =
                event.key === 'Home'
                  ? '2d'
                  : event.key === 'End'
                    ? '3d'
                    : display === '2d'
                      ? '3d'
                      : '2d'
              setDisplay(next)
              document.getElementById(`concert-tab-${next}`)?.focus()
            }}
          >
            <button
              role="tab"
              id="concert-tab-2d"
              aria-controls="concert-scene"
              tabIndex={display === '2d' ? 0 : -1}
              aria-selected={display === '2d'}
              className={display === '2d' ? 'active' : ''}
              onClick={() => setDisplay('2d')}
            >
              2D 座位图
            </button>
            <button
              role="tab"
              id="concert-tab-3d"
              aria-controls="concert-scene"
              tabIndex={display === '3d' ? 0 : -1}
              aria-selected={display === '3d'}
              className={display === '3d' ? 'active' : ''}
              onClick={() => setDisplay('3d')}
            >
              3D 视角
            </button>
          </div>
        </div>
        <div className={`concert-explore-layout ${panel ? 'panel-open' : ''}`}>
          <div
            className={`concert-viewer ${immersive ? 'is-immersive' : ''}`}
            ref={viewer}
            id="concert-scene"
            role="tabpanel"
            aria-labelledby={
              display === '2d' ? 'concert-tab-2d' : 'concert-tab-3d'
            }
            aria-busy={sectionsLoading}
          >
            {section && !sectionsLoading ? (
              <>
                <div className="scene-layer" hidden={display !== '3d'}>
                  <SceneBoundary
                    key={`${venue.id}:${position.layout}`}
                    onMap={() => setDisplay('2d')}
                  >
                    <Suspense
                      fallback={
                        <div className="scene-loading" role="status">
                          <FiCompass />
                          <span>正在构建场馆…</span>
                        </div>
                      }
                    >
                      <Stadium
                        ref={stadium}
                        venue={venue}
                        position={position}
                        mode={mode}
                        roof={roof}
                        zoom={zoom}
                        onZoom={(direction) =>
                          setZoom((value) => {
                            const steps = [0.5, 1, 2, 3, 5]
                            return steps[
                              Math.max(
                                0,
                                Math.min(
                                  steps.length - 1,
                                  steps.indexOf(value) + direction
                                )
                              )
                            ]
                          })
                        }
                        onSelect={selectSection}
                        onMap={() => setDisplay('2d')}
                      />
                    </Suspense>
                  </SceneBoundary>
                </div>
                <div className="scene-layer" hidden={display !== '2d'}>
                  <SeatMap
                    venue={venue}
                    selected={section?.id || ''}
                    layout={position.layout}
                    onSelect={selectSection}
                  />
                </div>
              </>
            ) : (
              <div
                className="viewer-placeholder"
                role={sectionError ? 'alert' : 'status'}
              >
                <FiCompass />
                <strong>
                  {sectionError ? '分区资料暂时不可用' : '正在准备场馆视角'}
                </strong>
                <p>{sectionError || '正在加载对应场次的分区，请稍候。'}</p>
                {sectionError && (
                  <div>
                    <button className="primary-button" onClick={retrySections}>
                      重新加载分区
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setDirectory(true)}
                    >
                      选择其他场馆
                    </button>
                  </div>
                )}
              </div>
            )}
            {display === '3d' && section && !sectionsLoading && (
              <>
                <div className="viewer-tools">
                  <button
                    title="靠近所选分区"
                    aria-label="靠近所选分区"
                    onClick={() => {
                      stadium.current?.focus()
                      setMode('overview')
                    }}
                  >
                    <FiMapPin />
                  </button>
                  <button
                    title="重置视角"
                    aria-label="重置视角"
                    onClick={() => {
                      setMode('overview')
                      stadium.current?.reset()
                    }}
                  >
                    <FiRotateCcw />
                  </button>
                  <button
                    title="屋顶结构示意"
                    aria-label="屋顶结构示意"
                    aria-pressed={roof}
                    className={roof ? 'active' : ''}
                    onClick={() => setRoof(!roof)}
                  >
                    <FiLayers />
                  </button>
                  <button
                    title={
                      immersive || nativeFullscreen ? '退出全屏' : '全屏查看'
                    }
                    aria-label={
                      immersive || nativeFullscreen ? '退出全屏' : '全屏查看'
                    }
                    onClick={fullscreen}
                  >
                    {immersive || nativeFullscreen ? (
                      <FiMinimize />
                    ) : (
                      <FiMaximize />
                    )}
                  </button>
                  <button
                    title="操作说明"
                    aria-label="操作说明"
                    onClick={() => setHelp(true)}
                  >
                    <FiHelpCircle />
                  </button>
                </div>
                <div className="viewer-modes">
                  {(
                    [
                      {
                        value: 'overview',
                        text: '场馆总览',
                        icon: <FiCompass />
                      },
                      {
                        value: 'audience',
                        text: '观众视角',
                        icon: <FiEye />
                      },
                      { value: 'phone', text: '手机取景', icon: <FiCamera /> }
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.value}
                      className={mode === item.value ? 'active' : ''}
                      aria-pressed={mode === item.value}
                      onClick={() => setMode(item.value)}
                    >
                      {item.icon}
                      <span>{item.text}</span>
                    </button>
                  ))}
                </div>
                {mode === 'phone' && (
                  <div className="phone-frame">
                    <div className="phone-crosshair" />
                    <span>手机视角模拟 · {zoom}×</span>
                    <div className="phone-zooms">
                      {[0.5, 1, 2, 3, 5].map((value) => (
                        <button
                          className={zoom === value ? 'active' : ''}
                          key={value}
                          aria-pressed={zoom === value}
                          aria-label={`拍摄倍率 ${value} 倍`}
                          onClick={() => setZoom(value)}
                        >
                          {value}×
                        </button>
                      ))}
                      <button aria-label="保存取景示意" onClick={saveSnapshot}>
                        <FiDownload />
                      </button>
                    </div>
                  </div>
                )}
                <span className="viewer-hint">
                  {mode === 'overview'
                    ? '拖动旋转 · 双指或滚轮缩放'
                    : '拖动环顾 · 观察位置保持不变'}
                </span>
              </>
            )}
          </div>
          {panel && (
            <Dialog
              settings
              title={
                panel === 'event'
                  ? '场馆与场次'
                  : panel === 'seat'
                    ? '选择位置'
                    : '视角设置'
              }
              onClose={() => setPanel('')}
            >
              {sectionsLoading && (
                <div className="panel-loading" role="status">
                  正在加载分区…
                </div>
              )}
              {sectionError && (
                <div className="panel-error" role="alert">
                  <p>{sectionError}</p>
                  <button className="secondary-button" onClick={retrySections}>
                    重试分区加载
                  </button>
                </div>
              )}
              {panel === 'event' && (
                <>
                  <p className="eyebrow">01 / 找到你的现场</p>
                  <label>
                    场馆
                    <SelectVenue
                      venues={venues}
                      value={venue.id}
                      onChange={selectVenue}
                    />
                  </label>
                  <button
                    className="text-button"
                    onClick={() => {
                      setDirectoryTab('venues')
                      setDirectory(true)
                    }}
                  >
                    浏览全部 {venues.length} 个场馆 <FiArrowRight />
                  </button>
                  <label>
                    演出场次
                    <select
                      aria-label="选择演出场次"
                      value={event?.id || ''}
                      onChange={(e) => changePerformance(e.target.value)}
                    >
                      <option value="">自由预览 · 未选择演出</option>
                      {catalog.events
                        .filter((item) => item.venue === venue.id)
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.date} · {item.title}
                          </option>
                        ))}
                    </select>
                  </label>
                  {event && (
                    <div className="event-note">
                      <strong>{event.title}</strong>
                      <p>
                        {event.date} {event.time}
                      </p>
                      <p>
                        {event.previewNotice ||
                          event.sourceNote ||
                          '舞台布局与实际现场可能存在差异，请以主办方公布信息为准。'}
                      </p>
                      <a href={event.source} target="_blank" rel="noreferrer">
                        查看演出来源 <FiArrowRight />
                      </a>
                    </div>
                  )}
                  <label>舞台预览</label>
                  <div className="segmented">
                    {[
                      ...(!['end', 'center', 'thrust'].includes(position.layout)
                        ? [
                            [
                              position.layout,
                              position.layout === 'vertical'
                                ? '纵向舞台'
                                : position.layout === 'horizontal'
                                  ? '横向舞台'
                                  : '本场布局'
                            ]
                          ]
                        : []),
                      ['end', '三面台'],
                      ['center', '四面台'],
                      ['thrust', '延伸台']
                    ].map(([value, text]) => (
                      <button
                        className={position.layout === value ? 'active' : ''}
                        aria-pressed={position.layout === value}
                        key={value}
                        onClick={() => {
                          setPosition({ layout: value })
                          setMode('overview')
                        }}
                      >
                        {text}
                      </button>
                    ))}
                  </div>
                  {sections.length > 0 && !sectionsLoading && (
                    <SeatMap
                      venue={venue}
                      selected={section?.id || ''}
                      layout={position.layout}
                      onSelect={selectSection}
                      compact
                    />
                  )}
                  <p className="storage-note">
                    场馆尺寸、层高与排座为估算。演出资料来自公开信息，具体场次布局待官方座位图核验。
                  </p>
                </>
              )}
              {panel === 'seat' && section && !sectionsLoading && (
                <>
                  <p className="eyebrow">02 / 选择预览位置</p>
                  <div className="segmented floor-tabs">
                    {[...new Set(venue.sections.map((item) => item.level))].map(
                      (item) => (
                        <button
                          key={item}
                          className={level === item ? 'active' : ''}
                          aria-pressed={level === item}
                          onClick={() => setLevel(item)}
                        >
                          {LEVELS[item] || item}
                        </button>
                      )
                    )}
                  </div>
                  <label>
                    分区
                    <select
                      aria-label="选择分区"
                      value={section?.id || ''}
                      onChange={(e) => selectSection(e.target.value)}
                    >
                      {venue.sections
                        .filter((s) => s.level === level || s.id === section.id)
                        .map((item) => (
                          <option value={item.id} key={item.id}>
                            {item.label}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="section-picker">
                    {venue.sections
                      .filter((item) => item.level === level)
                      .map((item) => (
                        <button
                          key={item.id}
                          className={section.id === item.id ? 'active' : ''}
                          aria-pressed={section.id === item.id}
                          onClick={() => selectSection(item.id)}
                        >
                          {item.label}
                        </button>
                      ))}
                  </div>
                  {sections.length > 0 && !sectionsLoading && (
                    <SeatMap
                      venue={venue}
                      selected={section?.id || ''}
                      layout={position.layout}
                      onSelect={selectSection}
                      compact
                    />
                  )}
                  <div className="form-grid">
                    <NumberField
                      label="排位（估算）"
                      value={
                        Math.round(
                          (position.depth / 100) * (estimatedRows - 1)
                        ) + 1
                      }
                      max={estimatedRows}
                      onCommit={(value) =>
                        setPosition({
                          depth:
                            ((value - 1) / Math.max(1, estimatedRows - 1)) * 100
                        })
                      }
                    />
                    <NumberField
                      label="座位（估算）"
                      value={
                        Math.round(
                          (position.lateral / 100) * (estimatedSeats - 1)
                        ) + 1
                      }
                      max={estimatedSeats}
                      onCommit={(value) =>
                        setPosition({
                          lateral:
                            ((value - 1) / Math.max(1, estimatedSeats - 1)) *
                            100
                        })
                      }
                    />
                  </div>
                  <button
                    className="primary-button full-width"
                    onClick={showAudience}
                  >
                    <FiEye /> 从这里看舞台
                  </button>
                </>
              )}
              {panel === 'adjust' && section && !sectionsLoading && (
                <>
                  <p className="eyebrow">03 / 调整你的视角</p>
                  <h3>{section.label}</h3>
                  <p className="muted">
                    调整分区内的位置，预览与舞台的相对关系。
                  </p>
                  <label>
                    前后位置 <output>{Math.round(position.depth)}%</output>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={position.depth}
                      aria-label="前后位置"
                      onChange={(e) =>
                        setPosition({ depth: Number(e.target.value) })
                      }
                    />
                    <span className="range-labels">
                      <span>靠前</span>
                      <span>靠后</span>
                    </span>
                  </label>
                  <label>
                    左右位置 <output>{Math.round(position.lateral)}%</output>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={position.lateral}
                      aria-label="左右位置"
                      onChange={(e) =>
                        setPosition({ lateral: Number(e.target.value) })
                      }
                    />
                    <span className="range-labels">
                      <span>左侧</span>
                      <span>右侧</span>
                    </span>
                  </label>
                  <label>观看姿态</label>
                  <div className="segmented">
                    <button
                      className={!position.standing ? 'active' : ''}
                      aria-pressed={!position.standing}
                      onClick={() => setPosition({ standing: false })}
                    >
                      坐姿 · 1.15 m
                    </button>
                    <button
                      className={position.standing ? 'active' : ''}
                      aria-pressed={position.standing}
                      onClick={() => setPosition({ standing: true })}
                    >
                      站姿 · 1.65 m
                    </button>
                  </div>
                  <div className="position-info">
                    <span>至舞台中心约</span>
                    <strong>
                      {distance} <small>m</small>
                    </strong>
                    <p>相对距离估算，不代表实测视野</p>
                  </div>
                  <button
                    className="primary-button full-width"
                    onClick={showAudience}
                  >
                    <FiEye /> 从这里看舞台
                  </button>
                  <div className="position-actions">
                    <button
                      className="secondary-button"
                      disabled={alreadyCompared}
                      onClick={addCompare}
                    >
                      {alreadyCompared ? <FiCheck /> : <FiColumns />}{' '}
                      {alreadyCompared ? '已加入对比' : '加入对比'}
                    </button>
                    <button
                      className="icon-button"
                      aria-label="分享当前估算位置"
                      onClick={share}
                    >
                      <FiShare2 />
                    </button>
                  </div>
                  <p className="storage-note">
                    预览用于比较相对位置，不包含现场人员、设备与临时设施等遮挡因素。
                  </p>
                </>
              )}
            </Dialog>
          )}
        </div>
        <div className="concert-dock">
          <div>
            <div className="selected-position">
              <span>当前分区</span>
              <strong>{section?.label || '等待分区'}</strong>
              <small>
                {sectionsLoading
                  ? '正在切换视角…'
                  : approximate
                    ? '基础场馆示意'
                    : '排座与距离估算'}
              </small>
            </div>
            {!!compare.length && (
              <button
                className="compare-tray"
                onClick={() => setComparing(true)}
              >
                <FiColumns />
                位置对比 <b>{compare.length}</b>
                <FiChevronRight />
              </button>
            )}
          </div>
          <nav aria-label="场馆设置">
            {(
              [
                { key: 'event', text: '选场次', icon: <FiCalendar /> },
                { key: 'seat', text: '选位置', icon: <FiMapPin /> },
                { key: 'adjust', text: '调视角', icon: <FiSliders /> }
              ] as const
            ).map((item) => (
              <button
                className={panel === item.key ? 'active' : ''}
                disabled={item.key !== 'event' && (!section || sectionsLoading)}
                aria-expanded={panel === item.key}
                key={item.key}
                onClick={() => setPanel(panel === item.key ? '' : item.key)}
              >
                {item.icon}
                {item.text}
              </button>
            ))}
          </nav>
        </div>
      </>

      {directory && (
        <Dialog title="找到下一次现场" onClose={() => setDirectory(false)} wide>
          <div className="directory-search">
            <FiSearch />
            <input
              autoFocus
              aria-label="搜索演出、场馆或城市"
              placeholder="搜索演出、场馆或城市"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="icon-button"
                aria-label="清空搜索"
                onClick={() => setSearch('')}
              >
                <FiX />
              </button>
            )}
          </div>
          <div className="directory-tabs">
            <button
              aria-pressed={directoryTab === 'venues'}
              className={directoryTab === 'venues' ? 'active' : ''}
              onClick={() => setDirectoryTab('venues')}
            >
              场馆 · {venues.length}
            </button>
            <button
              aria-pressed={directoryTab === 'events'}
              className={directoryTab === 'events' ? 'active' : ''}
              onClick={() => setDirectoryTab('events')}
            >
              演出 · {catalog.events.length}
            </button>
          </div>
          <div className="directory-regions">
            {['全部', ...new Set(venues.map((v) => v.region))].map((item) => (
              <button
                aria-pressed={region === item}
                className={region === item ? 'active' : ''}
                onClick={() => setRegion(item)}
                key={item}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="directory-results">
            {directoryTab === 'venues'
              ? (() => {
                  const results = venues.filter(
                    (v) =>
                      `${v.name} ${v.city} ${v.region} ${v.english} ${v.aliases}`
                        .toLowerCase()
                        .includes(search.trim().toLowerCase()) &&
                      (region === '全部' || v.region === region)
                  )
                  return results.length ? (
                    results.map((v) => (
                      <button
                        key={v.id}
                        className="directory-row"
                        onClick={() => {
                          selectVenue(v.id)
                          setDirectory(false)
                          setPanel('event')
                          setMode('overview')
                        }}
                      >
                        <span className="directory-icon">
                          <FiMapPin />
                        </span>
                        <span>
                          <strong>{v.name}</strong>
                          <small>
                            {v.region} · {v.city}
                          </small>
                        </span>
                        <FiArrowRight />
                      </button>
                    ))
                  ) : (
                    <p className="concert-empty">
                      没有找到相关场馆，试试其他城市或名称。
                    </p>
                  )
                })()
              : (() => {
                  const results = catalog.events
                    .filter(
                      (e) =>
                        `${e.title} ${e.artist} ${e.date} ${venues.find((v) => v.id === e.venue)?.city}`
                          .toLowerCase()
                          .includes(search.trim().toLowerCase()) &&
                        (region === '全部' ||
                          venues.find((v) => v.id === e.venue)?.region ===
                            region)
                    )
                    .sort((a, b) => b.date.localeCompare(a.date))
                  return results.length ? (
                    results.map((e) => (
                      <button
                        key={e.id}
                        className="directory-row"
                        onClick={() => {
                          const v = venues.find((v) => v.id === e.venue)
                          if (!v) return
                          setParams({
                            venue: v.id,
                            section: v.defaults.section,
                            layout: e.layout || v.defaultLayout,
                            event: e.id
                          })
                          setDirectory(false)
                          setPanel('event')
                          setMode('overview')
                        }}
                      >
                        <span className="directory-icon">
                          <FiMusic />
                        </span>
                        <span>
                          <strong>{e.title}</strong>
                          <small>
                            {e.date} ·{' '}
                            {venues.find((v) => v.id === e.venue)?.short}
                          </small>
                        </span>
                        <FiArrowRight />
                      </button>
                    ))
                  ) : (
                    <p className="concert-empty">
                      没有找到相关演出，试试歌手或日期。
                    </p>
                  )
                })()}
          </div>
        </Dialog>
      )}
      {comparing && (
        <Dialog
          title="把不同视角，放在一起看看"
          onClose={() => setComparing(false)}
          wide
        >
          <p className="dialog-intro">
            最多对比 3 个位置。距离与画面均为估算示意。
          </p>
          <div className="compare-grid">
            {compare.map((item) => {
              const v = item.venueData
              return (
                <article className="compare-card" key={item.id}>
                  <SeatMap
                    venue={v}
                    selected={item.section}
                    layout={item.layout}
                    onSelect={() => openComparison(item)}
                    compact
                  />
                  <h3>{item.name}</h3>
                  <p>
                    前后 {Math.round(item.depth)}% · 左右{' '}
                    {Math.round(item.lateral)}%
                  </p>
                  <p>
                    {item.standing ? '站姿' : '坐姿'} ·{' '}
                    {item.layout === 'center'
                      ? '四面台'
                      : item.layout === 'thrust'
                        ? '延伸台'
                        : '三面台'}
                  </p>
                  <button
                    className="primary-button"
                    onClick={() => openComparison(item)}
                  >
                    查看观众视角
                    <FiEye />
                  </button>
                  <button
                    className="text-button"
                    onClick={() =>
                      setCompare((previous) =>
                        previous.filter((p) => p.id !== item.id)
                      )
                    }
                  >
                    <FiTrash2 />
                    移除
                  </button>
                </article>
              )
            })}
          </div>
          <button
            className="secondary-button full-width"
            onClick={() => {
              setComparing(false)
              setPanel('adjust')
            }}
          >
            继续添加位置 · {compare.length} / 3
          </button>
        </Dialog>
      )}
      {help && (
        <Dialog title="在出发前，看看现场" onClose={() => setHelp(false)}>
          <div className="help-content">
            <section>
              <FiCompass />
              <div>
                <h3>探索，找到自己的视角</h3>
                <p>
                  拖动旋转、滚轮或双指缩放。点击座位选择分区，在“选位置”中调整位置，切换观众视角或手机取景。
                </p>
              </div>
            </section>
            <section>
              <FiColumns />
              <div>
                <h3>把不同位置，放在一起对比</h3>
                <p>
                  在“调视角”中将位置加入对比。位置链接可以复制分享，接收者打开后即可查看相同的估算位置。
                </p>
              </div>
            </section>
            <p className="storage-note">
              场馆和演出资料优先同步参考站最新发布版本；同步失败时会明确标示备份或上次数据。3D
              尺寸、排座、舞台布局与视野为示意估算，不含现场临时遮挡。演出信息以主办方为准。
            </p>
          </div>
        </Dialog>
      )}
      {shareLink && (
        <Dialog title="分享当前估算位置" onClose={() => setShareLink('')}>
          <p className="dialog-intro">复制下方链接，分享同一个场馆位置。</p>
          <input
            className="share-link-input"
            readOnly
            value={shareLink}
            onFocus={(e) => e.target.select()}
            aria-label="位置分享链接"
          />
        </Dialog>
      )}
      {viewerError && (
        <div className="concert-alert" role="alert">
          <span>{viewerError}</span>
          <button
            className="icon-button"
            aria-label="关闭提示"
            onClick={() => setViewerError('')}
          >
            <FiX />
          </button>
        </div>
      )}
      <div role="status" aria-atomic="true">
        {toast && (
          <div className="concert-toast">
            <FiCheck aria-hidden="true" />
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
