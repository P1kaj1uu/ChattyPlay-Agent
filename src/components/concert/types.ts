export interface Section {
  id: string
  label: string
  level: string
  angle?: number
  span?: number
  x?: number
  z?: number
  width?: number
  depth?: number
  price?: number | null
}

export interface Position {
  venue: string
  section: string
  depth: number
  lateral: number
  standing: boolean
  date: string
  layout: string
}

export interface Venue {
  id: string
  name: string
  short: string
  city: string
  region: string
  english: string
  aliases: string
  kind: string
  geometry: { a: number; b: number; levels: number }
  url: string
  mapUrl: string | null
  defaultLayout: string
  defaults: Position
  sections: Section[]
}

export interface Performance {
  id: string
  venue: string
  artist: string
  title: string
  date: string
  time: string
  source: string
  sourceNote?: string
  previewNotice?: string
  layout?: string
}

export interface Catalog {
  venues: Venue[]
  events: Performance[]
  layouts?: string[]
  lazySections?: boolean
}
export interface ComparisonPosition extends Position {
  id: string
  name: string
  performance?: string
  venueData: Venue
}

export const LEVELS: Record<string, string> = {
  lower: '1F',
  middle: '2F',
  upper: '3F',
  top: '4F',
  floor: '内场'
}
