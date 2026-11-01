import { useEffect, useState } from 'react'
import { Venue, LEVELS } from './types'
import { createVenueGeometry } from './geometry'

function arcPath(
  a: number,
  b: number,
  inner: number,
  outer: number,
  start: number,
  end: number
) {
  const point = (angle: number, radius: number) =>
    `${300 + Math.sin(angle) * a * radius},${265 + Math.cos(angle) * b * radius}`
  return `M${point(start, outer)} A${a * outer},${b * outer} 0 0,0 ${point(end, outer)} L${point(end, inner)} A${a * inner},${b * inner} 0 0,1 ${point(start, inner)} Z`
}

export default function SeatMap({
  venue,
  selected,
  layout,
  onSelect,
  compact = false
}: {
  venue: Venue
  selected: string
  layout: string
  onSelect: (id: string) => void
  compact?: boolean
}) {
  const [zoom, setZoom] = useState(1)
  useEffect(() => setZoom(1), [venue.id, layout])
  const levels = [
    ...new Set(
      venue.sections.filter((s) => s.level !== 'floor').map((s) => s.level)
    )
  ]
  const radiusA = 208
  const radiusB = Math.min(218, (208 * venue.geometry.b) / venue.geometry.a)
  const geometry = createVenueGeometry(venue)
  return (
    <div className={`concert-seat-map ${compact ? 'compact' : ''}`}>
      {!compact && (
        <div className="map-caption">
          本场座位图方向 · 非地理北向 <span>点击分区，探索视角</span>
        </div>
      )}
      <div className="map-svg-viewport">
        <div
          className="map-surface"
          style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
        >
          <svg viewBox="0 0 600 550" aria-label={`${venue.name}分区座位示意图`}>
            <ellipse
              cx="300"
              cy="265"
              rx={radiusA + 16}
              ry={radiusB + 16}
              fill="#e5eadf"
            />
            <ellipse
              cx="300"
              cy="265"
              rx={radiusA * 0.48}
              ry={radiusB * 0.48}
              fill="#f8faf3"
            />
            {venue.sections.map((section, index) => {
              const active = section.id === selected
              const level = Math.max(0, levels.indexOf(section.level))
              const inRadius = 0.5 + level * (0.46 / Math.max(1, levels.length))
              const outRadius = inRadius + 0.42 / Math.max(1, levels.length)
              const angle = geometry[index].angle
              const span = Math.min(geometry[index].span, 0.5)
              const label = section.label.replace(/ 区$/, '')
              const floor = section.level === 'floor'
              const x = floor
                ? 300 +
                  ((section.x ?? Math.sin(angle) * 15) * radiusA * 0.43) /
                    venue.geometry.a
                : 300 + (Math.sin(angle) * radiusA * (inRadius + outRadius)) / 2
              const y = floor
                ? 265 +
                  ((section.z ?? Math.cos(angle) * 15) * radiusB * 0.43) /
                    venue.geometry.b
                : 265 + (Math.cos(angle) * radiusB * (inRadius + outRadius)) / 2
              const activate = () => onSelect(section.id)
              const width = Math.max(
                8,
                Math.min(
                  48,
                  ((section.width ?? 10) * radiusA * 0.43) / venue.geometry.a
                )
              )
              const height = Math.max(
                8,
                Math.min(
                  48,
                  ((section.depth ?? 10) * radiusB * 0.43) / venue.geometry.b
                )
              )
              return (
                <g
                  key={section.id}
                  role="button"
                  tabIndex={
                    active ||
                    (!venue.sections.some((item) => item.id === selected) &&
                      index === 0)
                      ? 0
                      : -1
                  }
                  aria-label={section.label}
                  aria-pressed={active}
                  onClick={activate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      activate()
                    }
                    if (
                      [
                        'ArrowLeft',
                        'ArrowRight',
                        'ArrowUp',
                        'ArrowDown',
                        'Home',
                        'End'
                      ].includes(e.key)
                    ) {
                      e.preventDefault()
                      const next =
                        e.key === 'Home'
                          ? 0
                          : e.key === 'End'
                            ? venue.sections.length - 1
                            : (index +
                                (e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                                  ? -1
                                  : 1) +
                                venue.sections.length) %
                              venue.sections.length
                      onSelect(venue.sections[next].id)
                      const element =
                        e.currentTarget.parentElement?.querySelectorAll<SVGGElement>(
                          '.seat-map-section'
                        )[next]
                      element?.focus({ preventScroll: true })
                      element?.scrollIntoView({
                        block: 'nearest',
                        inline: 'nearest'
                      })
                    }
                  }}
                  className={`seat-map-section ${active ? 'selected' : ''}`}
                >
                  {floor ? (
                    <rect
                      x={x - width / 2}
                      y={y - height / 2}
                      width={width}
                      height={height}
                      rx="2"
                      fill={active ? '#416c83' : '#a6b59a'}
                      stroke="#f9fbf4"
                      strokeWidth="2"
                    />
                  ) : (
                    <path
                      d={arcPath(
                        radiusA,
                        radiusB,
                        inRadius,
                        outRadius,
                        angle - span / 2,
                        angle + span / 2
                      )}
                      fill={
                        active ? '#416c83' : level % 2 ? '#9caf8c' : '#b8c5ac'
                      }
                      stroke="#f9fbf4"
                      strokeWidth="2"
                    />
                  )}
                  <text
                    x={x}
                    y={y + 3}
                    textAnchor="middle"
                    fill={active ? 'white' : '#315440'}
                    fontSize={label.length > 5 ? 6 : 10}
                  >
                    {label.length > 11 ? label.slice(-9) : label}
                  </text>

                  <title>
                    {section.label} · {LEVELS[section.level] || section.level}
                  </title>
                </g>
              )
            })}
            {layout === 'center' ? (
              <>
                <rect
                  x="279"
                  y="244"
                  width="42"
                  height="42"
                  rx="4"
                  fill="#345a44"
                />
                <text
                  x="300"
                  y="269"
                  textAnchor="middle"
                  fill="#e9efda"
                  fontSize="10"
                >
                  四面台
                </text>
              </>
            ) : (
              <>
                <rect
                  x="246"
                  y="164"
                  width="108"
                  height="32"
                  rx="3"
                  fill="#345a44"
                />
                <text
                  x="300"
                  y="184"
                  textAnchor="middle"
                  fill="#e9efda"
                  fontSize="11"
                >
                  主舞台
                </text>
                {layout === 'thrust' && (
                  <path d="M294 196h12v65h23v15h-58v-15h23z" fill="#345a44" />
                )}
              </>
            )}
            <text
              x="300"
              y="530"
              textAnchor="middle"
              fill="#7e8c72"
              fontSize="11"
            >
              {venue.short} · 分区与排座示意
            </text>
          </svg>
        </div>
      </div>
      {!compact && (
        <div className="map-zoom">
          <button
            aria-label="缩小座位图"
            disabled={zoom <= 1}
            onClick={() =>
              setZoom((v) => Math.max(1, Math.round((v - 0.25) * 100) / 100))
            }
          >
            −
          </button>
          <output>{Math.round(zoom * 100)}%</output>
          <button
            aria-label="放大座位图"
            disabled={zoom >= 2.5}
            onClick={() =>
              setZoom((v) => Math.min(2.5, Math.round((v + 0.25) * 100) / 100))
            }
          >
            ＋
          </button>
          <button onClick={() => setZoom(1)}>重置</button>
        </div>
      )}
    </div>
  )
}
