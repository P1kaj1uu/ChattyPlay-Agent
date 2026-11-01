import type { Catalog, Section } from '../components/concert/types'

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string => typeof value === 'string'
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function isConcertSections(value: unknown): value is Section[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 10000 &&
    value.every(
      (section) =>
        record(section) &&
        text(section.id) &&
        text(section.label) &&
        text(section.level) &&
        ['angle', 'span', 'x', 'z', 'width', 'depth'].every(
          (key) => section[key] === undefined || finite(section[key])
        )
    ) &&
    new Set(value.map((section) => section.id)).size === value.length
  )
}

export function isConcertCatalog(value: unknown): value is Catalog {
  if (
    !record(value) ||
    !Array.isArray(value.venues) ||
    !value.venues.length ||
    value.venues.length > 10000 ||
    !Array.isArray(value.events) ||
    value.events.length > 30000
  )
    return false
  const ids = new Set(
    value.venues.map((venue) => (record(venue) ? venue.id : undefined))
  )
  return (
    ids.size === value.venues.length &&
    value.venues.every(
      (venue) =>
        record(venue) &&
        [
          'id',
          'name',
          'short',
          'city',
          'region',
          'english',
          'aliases',
          'kind',
          'defaultLayout'
        ].every((key) => text(venue[key])) &&
        record(venue.geometry) &&
        finite(venue.geometry.a) &&
        venue.geometry.a > 0 &&
        finite(venue.geometry.b) &&
        venue.geometry.b > 0 &&
        record(venue.defaults) &&
        text(venue.defaults.section) &&
        ((value.lazySections === true &&
          Array.isArray(venue.sections) &&
          venue.sections.length === 0) ||
          (isConcertSections(venue.sections) &&
            venue.sections.some(
              (section) =>
                section.id ===
                (venue.defaults as Record<string, unknown>).section
            )))
    ) &&
    value.events.every(
      (event) =>
        record(event) &&
        ['id', 'venue', 'title', 'artist', 'date'].every((key) =>
          text(event[key])
        ) &&
        ids.has(event.venue)
    ) &&
    (value.layouts === undefined ||
      (Array.isArray(value.layouts) && value.layouts.every(text)))
  )
}
