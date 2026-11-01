import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  audiencePosition,
  createVenueGeometry,
  phoneFieldOfView,
  stageDistance
} from './geometry'
import type { Position, Venue } from './types'

const position: Position = {
  venue: 'arena',
  section: 'front',
  date: '',
  layout: 'end',
  depth: 0,
  lateral: 50,
  standing: false
}
const venue: Venue = {
  id: 'arena',
  name: 'Arena',
  short: 'Arena',
  city: '',
  region: '',
  english: '',
  aliases: '',
  kind: 'arena',
  url: '',
  mapUrl: null,
  geometry: { a: 40, b: 40, levels: 2 },
  defaultLayout: 'end',
  defaults: position,
  sections: [
    { id: 'front', label: 'Front', level: 'lower', angle: Math.PI, span: 0.3 },
    { id: 'back', label: 'Back', level: 'lower', angle: 0, span: 0.3 },
    { id: 'upper', label: 'Upper', level: 'upper', angle: 0, span: 0.3 },
    {
      id: 'floor',
      label: 'Floor',
      level: 'floor',
      x: 0,
      z: 0,
      width: 10,
      depth: 12
    }
  ]
}

test('distance reflects stage placement, stand tier and selected row', () => {
  const [front, back, upper] = createVenueGeometry(venue)
  assert(
    stageDistance(venue, front, position) < stageDistance(venue, back, position)
  )
  assert(
    stageDistance(venue, upper, position) > stageDistance(venue, back, position)
  )
  assert(
    stageDistance(venue, back, { ...position, depth: 100 }) >
      stageDistance(venue, back, position)
  )
  assert(
    Math.abs(
      stageDistance(venue, front, { ...position, layout: 'center' }) -
        stageDistance(venue, back, { ...position, layout: 'center' })
    ) < 1e-9
  )
})

test('audience eye remains within the selected section and standing raises it by half a metre', () => {
  const floor = createVenueGeometry(venue)[3]
  const seated = audiencePosition(floor, {
    ...position,
    depth: 50,
    lateral: 50
  })
  const standing = audiencePosition(floor, {
    ...position,
    depth: 50,
    lateral: 50,
    standing: true
  })
  assert.deepEqual([seated[0], seated[2]], [0, 0])
  assert(Math.abs(standing[1] - seated[1] - 0.5) < 1e-9)
  const edge = audiencePosition(floor, {
    ...position,
    depth: 200,
    lateral: -100
  })
  assert.deepEqual([edge[0], edge[2]], [-5, 6])
})

test('phone zoom changes optical magnification by the chosen factor', () => {
  const visible = (zoom: number) =>
    Math.tan((phoneFieldOfView(zoom) * Math.PI) / 360)
  assert(Math.abs(visible(1) / visible(5) - 5) < 1e-9)
  assert(Math.abs(visible(0.5) / visible(1) - 2) < 1e-9)
  assert.equal(phoneFieldOfView(0), phoneFieldOfView(0.5))
  assert.equal(phoneFieldOfView(99), phoneFieldOfView(5))
})
