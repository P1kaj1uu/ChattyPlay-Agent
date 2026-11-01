import type { Position, Section, Venue } from './types'

export type Point3 = [number, number, number]
export interface SectionGeometry {
  section: Section
  angle: number
  span: number
  a: number
  b: number
  base: number
  depth: number
  rise: number
  rows: number
}

export function sectionAngle(section: Section, index: number, count: number) {
  return (
    section.angle ??
    (section.x !== undefined && section.z !== undefined
      ? Math.atan2(section.x, section.z)
      : (index / Math.max(1, count)) * Math.PI * 2)
  )
}

export function createVenueGeometry(venue: Venue): SectionGeometry[] {
  const levels = [
    ...new Set(
      venue.sections
        .filter((section) => section.level !== 'floor')
        .map((section) => section.level)
    )
  ]
  const counts = new Map<string, number>()
  venue.sections.forEach((section) =>
    counts.set(section.level, (counts.get(section.level) || 0) + 1)
  )
  const offsets = new Map<string, number>()
  return venue.sections.map((section) => {
    const index = offsets.get(section.level) || 0
    offsets.set(section.level, index + 1)
    const count = counts.get(section.level) || 1
    const level = Math.max(0, levels.indexOf(section.level))
    const scale = Math.max(0.7, venue.geometry.a / 50)
    const tier =
      venue.id === 'kspo-dome'
        ? section.level === 'lower'
          ? { a: 27, b: 27, base: 1.2, depth: 14, rise: 7.5, rows: 20 }
          : { a: 37, b: 37, base: 12, depth: 16, rise: 12, rows: 21 }
        : {
            a: venue.geometry.a + level * 10 * scale,
            b: venue.geometry.b + level * 10 * scale,
            base: 2 + level * 13 * scale,
            depth: 12 * scale,
            rise: 9 * scale,
            rows: venue.kind === 'stadium' ? 24 : 16
          }
    return {
      ...tier,
      section,
      angle: sectionAngle(section, index, count),
      span: Math.max(
        0.025,
        (section.span ?? ((Math.PI * 2) / count) * 0.88) - 0.012
      )
    }
  })
}

export function pointInSection(
  geometry: SectionGeometry,
  depth: number,
  lateral: number
): Point3 {
  const { section, angle, span, a, b, base, rise } = geometry
  const d = Math.max(0, Math.min(1, depth)),
    l = Math.max(0, Math.min(1, lateral))
  if (section.level === 'floor')
    return [
      (section.x ?? Math.sin(angle) * 15) + (l - 0.5) * (section.width ?? 10),
      0.6,
      (section.z ?? Math.cos(angle) * 15) + (d - 0.5) * (section.depth ?? 10)
    ]
  const bearing = angle + (l - 0.5) * span
  return [
    Math.sin(bearing) * (a + geometry.depth * d),
    base + rise * d,
    Math.cos(bearing) * (b + geometry.depth * d)
  ]
}

export function stagePosition(venue: Venue, layout: string): Point3 {
  return [0, 4, layout === 'center' ? 0 : -venue.geometry.b * 0.6]
}

export function audiencePosition(
  geometry: SectionGeometry,
  position: Position
): Point3 {
  const point = pointInSection(
    geometry,
    position.depth / 100,
    position.lateral / 100
  )
  point[1] += position.standing ? 1.65 : 1.15
  return point
}

export function stageDistance(
  venue: Venue,
  geometry: SectionGeometry,
  position: Position
) {
  const eye = audiencePosition(geometry, position),
    target = stagePosition(venue, position.layout)
  return Math.hypot(eye[0] - target[0], eye[1] - target[1], eye[2] - target[2])
}

export function phoneFieldOfView(zoom: number) {
  const safeZoom = Math.max(0.5, Math.min(5, zoom))
  return (
    (2 * Math.atan(Math.tan((55 * Math.PI) / 360) / safeZoom) * 180) / Math.PI
  )
}
