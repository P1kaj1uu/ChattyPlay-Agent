import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  audiencePosition,
  createVenueGeometry,
  phoneFieldOfView,
  pointInSection,
  stagePosition,
  type SectionGeometry
} from './geometry'
import type { Position, Venue } from './types'

type ViewMode = 'overview' | 'audience' | 'phone'
export interface SnapshotCrop {
  x: number
  y: number
  width: number
  height: number
}
export interface StadiumHandle {
  reset: () => void
  focus: () => void
  snapshot: (crop?: SnapshotCrop) => boolean
}
interface Props {
  venue: Venue
  position: Position
  mode: ViewMode
  roof: boolean
  zoom: number
  onZoom: (direction: number) => void
  onSelect: (id: string) => void
  onMap: () => void
}
interface SceneState {
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  scene: THREE.Scene
  marker: THREE.Sprite
  labels: THREE.Group
  roof: THREE.Group
  seats: THREE.InstancedMesh
  ranges: Map<string, [number, number]>
  geometry: Map<string, SectionGeometry>
  stage: THREE.Vector3
  mode: ViewMode
  selected: string
  invalidate: () => void
  dispose: () => void
}

function labelSprite(text: string, selected = false) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 96
  const context = canvas.getContext('2d')!
  if (selected) {
    context.fillStyle = '#416c83'
    context.beginPath()
    context.roundRect(3, 3, 506, 90, 20)
    context.fill()
    context.strokeStyle = '#ffffff'
    context.lineWidth = 4
    context.stroke()
  }
  let size = selected ? 38 : text.length > 6 ? 34 : 54
  const font = () => {
    context.font = `${selected ? 600 : 500} ${size}px "PingFang SC", sans-serif`
  }
  font()
  while (context.measureText(text).width > 474 && size > 18) {
    size -= 2
    font()
  }
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.strokeStyle = '#f2f5eb'
  context.lineWidth = 5
  if (!selected) context.strokeText(text, 256, 50)
  context.fillStyle = selected ? '#ffffff' : '#345542'
  context.fillText(text, 256, 50)
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(canvas),
      depthTest: false
    })
  )
  sprite.scale.set(selected ? 32 : 18, selected ? 6 : 3.4, 1)
  sprite.renderOrder = 5
  return sprite
}

function releaseScene(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>(),
    materials = new Set<THREE.Material>(),
    textures = new Set<THREE.Texture>()
  scene.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.geometry && !(object instanceof THREE.Sprite))
      geometries.add(mesh.geometry)
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    list.filter(Boolean).forEach((material) => {
      materials.add(material)
      const texture = (material as THREE.MeshStandardMaterial).map
      if (texture) textures.add(texture)
    })
  })
  textures.forEach((texture) => texture.dispose())
  materials.forEach((material) => material.dispose())
  geometries.forEach((geometry) => geometry.dispose())
  renderer.dispose()
  renderer.forceContextLoss()
  renderer.domElement.remove()
}

function clearOrbitMotion(state: SceneState) {
  const damping = state.controls.enableDamping
  state.controls.enableDamping = false
  state.controls.update()
  state.controls.enableDamping = damping
}

function resetOverview(state: SceneState, venue: Venue) {
  clearOrbitMotion(state)
  const radius = Math.max(venue.geometry.a, venue.geometry.b) + 27,
    fit = Math.max(1, 1.35 / state.camera.aspect)
  state.mode = 'overview'
  state.controls.enabled = true
  state.controls.maxPolarAngle = Math.PI * 0.49
  state.controls.minDistance = 5
  state.controls.maxDistance = radius * 9
  state.camera.fov = 40
  state.camera.updateProjectionMatrix()
  state.camera.position.set(
    radius * 1.25 * fit,
    radius * 1.3 * fit,
    radius * 1.4 * fit
  )
  state.controls.target.set(0, 5, 0)
  state.controls.update()
  state.invalidate()
}

function buildScene(
  element: HTMLDivElement,
  venue: Venue,
  layout: string,
  onSelect: (id: string) => void,
  onLost: () => void,
  onZoom: (direction: number) => void
): SceneState {
  const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: false
    }),
    scene = new THREE.Scene()
  try {
    scene.background = new THREE.Color('#e4e7df')
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, element.clientWidth < 760 ? 1.5 : 2)
    )
    renderer.outputColorSpace = THREE.SRGBColorSpace
    const canvas = renderer.domElement
    canvas.tabIndex = 0
    canvas.setAttribute('role', 'img')
    canvas.setAttribute(
      'aria-label',
      `${venue.name}三维场馆。方向键调整视角，加减键缩放，Home 键复位；可通过选位置按钮选择分区。`
    )
    element.appendChild(canvas)
    const camera = new THREE.PerspectiveCamera(
      40,
      Math.max(1, element.clientWidth) / Math.max(1, element.clientHeight),
      0.1,
      3000
    )
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.09
    controls.enablePan = false
    scene.add(new THREE.HemisphereLight(0xffffff, 0x78836e, 1.8))
    const light = new THREE.DirectionalLight(0xffffff, 1.6)
    light.position.set(-40, 90, 60)
    scene.add(light)
    const worldSize = Math.max(venue.geometry.a, venue.geometry.b) + 45
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(worldSize, 96),
      new THREE.MeshStandardMaterial({ color: '#d3d9cc', roughness: 1 })
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.4
    scene.add(ground)
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1, 96),
      new THREE.MeshStandardMaterial({ color: '#acb7a0', roughness: 1 })
    )
    floor.rotation.x = -Math.PI / 2
    floor.scale.set(venue.geometry.a, venue.geometry.b, 1)
    scene.add(floor)
    const sections = createVenueGeometry(venue)
    const density = sections.map((geometry) => ({
      geometry,
      rows: geometry.section.level === 'floor' ? 12 : geometry.rows,
      columns:
        geometry.section.level === 'floor'
          ? 15
          : Math.min(
              34,
              Math.max(
                8,
                Math.floor(
                  ((geometry.a + geometry.depth / 2) * geometry.span) / 0.6
                )
              )
            )
    }))
    const total = density.reduce(
        (sum, item) => sum + item.rows * item.columns,
        0
      ),
      budget = element.clientWidth < 760 ? 40000 : 80000,
      sample = Math.min(1, Math.sqrt(budget / Math.max(1, total)))
    density.forEach((item) => {
      item.rows = Math.max(2, Math.floor(item.rows * sample))
      item.columns = Math.max(2, Math.floor(item.columns * sample))
    })
    const seats = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.42, 0.55, 0.42),
      new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }),
      density.reduce((sum, item) => sum + item.rows * item.columns, 0)
    )
    const dummy = new THREE.Object3D(),
      green = new THREE.Color('#345e45'),
      seatSections: string[] = [],
      ranges = new Map<string, [number, number]>(),
      terraces: THREE.BufferGeometry[] = []
    const labels = new THREE.Group()
    scene.add(labels)
    let instance = 0
    density.forEach(({ geometry, rows, columns }) => {
      const first = instance
      for (let row = 0; row < rows; row++)
        for (let column = 0; column < columns; column++) {
          dummy.position.fromArray(
            pointInSection(
              geometry,
              (row + 0.5) / rows,
              (column + 0.5) / columns
            )
          )
          dummy.position.y += 0.35
          dummy.rotation.y =
            geometry.angle + ((column + 0.5) / columns - 0.5) * geometry.span
          dummy.updateMatrix()
          seats.setMatrixAt(instance, dummy.matrix)
          seats.setColorAt(instance, green)
          seatSections.push(geometry.section.id)
          instance++
        }
      ranges.set(geometry.section.id, [first, instance])
      const label = labelSprite(geometry.section.label.replace(/ 区$/, ''))
      label.position
        .fromArray(pointInSection(geometry, 0.1, 0.5))
        .add(new THREE.Vector3(0, 2.5, 0))
      labels.add(label)
      if (geometry.section.level === 'floor') return
      const vertices: number[] = []
      for (let row = 0; row < geometry.rows; row++) {
        const inner = row / geometry.rows,
          outer = (row + 1) / geometry.rows
        const point = (angle: number, depth: number) => [
          Math.sin(angle) * (geometry.a + geometry.depth * depth),
          geometry.base + geometry.rise * inner - 0.25,
          Math.cos(angle) * (geometry.b + geometry.depth * depth)
        ]
        for (let step = 0; step < 8; step++) {
          const a =
              geometry.angle - geometry.span / 2 + (geometry.span * step) / 8,
            b =
              geometry.angle -
              geometry.span / 2 +
              (geometry.span * (step + 1)) / 8
          vertices.push(
            ...point(a, inner),
            ...point(b, inner),
            ...point(b, outer),
            ...point(a, inner),
            ...point(b, outer),
            ...point(a, outer)
          )
        }
      }
      const strip = new THREE.BufferGeometry()
      strip.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(vertices, 3)
      )
      strip.computeVertexNormals()
      terraces.push(strip)
    })
    seats.instanceMatrix.needsUpdate = true
    scene.add(seats)
    if (terraces.length) {
      const merged = mergeGeometries(terraces)
      terraces.forEach((strip) => strip.dispose())
      if (merged)
        scene.add(
          new THREE.Mesh(
            merged,
            new THREE.MeshStandardMaterial({
              color: '#c5cebb',
              side: THREE.DoubleSide,
              roughness: 1
            })
          )
        )
    }
    const stage = new THREE.Vector3().fromArray(stagePosition(venue, layout)),
      group = new THREE.Group()
    group.position.set(stage.x, 0, stage.z)
    scene.add(group)
    const stageMaterial = new THREE.MeshStandardMaterial({
      color: '#2e4936',
      roughness: 0.85
    })
    const platform = new THREE.Mesh(
      layout === 'center'
        ? new THREE.CylinderGeometry(8, 8, 1.3, 64)
        : new THREE.BoxGeometry(25, 1.8, 10),
      stageMaterial
    )
    platform.position.y = 1
    group.add(platform)
    if (layout === 'thrust') {
      const runway = new THREE.Mesh(
        new THREE.BoxGeometry(3.5, 1.3, 22),
        stageMaterial
      )
      runway.position.set(0, 0.8, 12)
      group.add(runway)
    }
    const screenCanvas = document.createElement('canvas')
    screenCanvas.width = 512
    screenCanvas.height = 256
    const ctx = screenCanvas.getContext('2d')!
    ctx.fillStyle = '#567a70'
    ctx.fillRect(0, 0, 512, 256)
    ctx.fillStyle = '#f1f4e4'
    ctx.textAlign = 'center'
    ctx.font = '600 48px sans-serif'
    ctx.fillText('LIVE', 256, 131)
    ctx.font = '20px sans-serif'
    ctx.fillText('观演视角 · 示意预览', 256, 176)
    const screenMaterial = new THREE.MeshStandardMaterial({
      map: new THREE.CanvasTexture(screenCanvas),
      roughness: 0.8
    })
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(
        layout === 'center' ? 12 : 22,
        8,
        layout === 'center' ? 12 : 1
      ),
      [
        screenMaterial,
        screenMaterial,
        stageMaterial,
        stageMaterial,
        screenMaterial,
        screenMaterial
      ]
    )
    screen.position.set(0, 12, layout === 'center' ? 0 : -3)
    group.add(screen)
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 13, 8),
      stageMaterial
    )
    pole.position.y = 7
    group.add(pole)
    const marker = labelSprite('', true),
      roof = new THREE.Group()
    scene.add(marker)
    for (let i = 0; i < 14; i++) {
      const angle = (i * Math.PI) / 14,
        points = []
      for (let step = 0; step <= 32; step++) {
        const t = (step * Math.PI) / 32
        points.push(
          new THREE.Vector3(
            Math.cos(t) * worldSize * Math.cos(angle),
            26 + Math.sin(t) * worldSize * 0.3,
            Math.cos(t) * worldSize * Math.sin(angle)
          )
        )
      }
      roof.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({
            color: '#7e9176',
            transparent: true,
            opacity: 0.35
          })
        )
      )
    }
    roof.visible = false
    scene.add(roof)
    let frame = 0,
      dirty = true,
      inViewport = true,
      disposed = false,
      lost = false
    const draw = () => {
      frame = 0
      if (disposed || lost || !inViewport || document.hidden) return
      const changed = state.mode === 'overview' && controls.update()
      if (dirty || changed) {
        renderer.render(scene, camera)
        dirty = false
      }
      if (changed && !frame) frame = requestAnimationFrame(draw)
    }
    const invalidate = () => {
      dirty = true
      if (!frame && !disposed && !lost && inViewport && !document.hidden)
        frame = requestAnimationFrame(draw)
    }
    const state: SceneState = {
      renderer,
      scene,
      camera,
      controls,
      marker,
      labels,
      roof,
      seats,
      ranges,
      geometry: new Map(sections.map((item) => [item.section.id, item])),
      stage,
      mode: 'overview',
      selected: '',
      invalidate,
      dispose: () => {}
    }
    const resize = () => {
      const width = element.clientWidth,
        height = element.clientHeight
      if (!width || !height) return
      const aspect = width / height
      if (state.mode === 'overview') {
        const fit =
          Math.max(1, 1.35 / aspect) / Math.max(1, 1.35 / camera.aspect)
        camera.position
          .sub(controls.target)
          .multiplyScalar(fit)
          .add(controls.target)
      }
      camera.aspect = aspect
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
      invalidate()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    const intersection =
      typeof IntersectionObserver === 'undefined'
        ? undefined
        : new IntersectionObserver((entries) => {
            inViewport = entries[0]?.isIntersecting ?? true
            if (inViewport) invalidate()
            else {
              cancelAnimationFrame(frame)
              frame = 0
            }
          })
    intersection?.observe(element)
    const pointers = new Map<number, { x: number; y: number }>()
    let moved = false,
      yaw = 0,
      pitch = 0
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (pointers.size > 1) moved = true
      else {
        moved = false
        if (state.mode !== 'overview') {
          canvas.setPointerCapture(event.pointerId)
          const direction = camera.getWorldDirection(new THREE.Vector3())
          yaw = Math.atan2(direction.x, direction.z)
          pitch = Math.asin(direction.y)
        }
      }
    }
    const move = (event: PointerEvent) => {
      const start = pointers.get(event.pointerId)
      if (!start) return
      if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5)
        moved = true
      if (state.mode === 'overview' || pointers.size !== 1) return
      const y = Math.max(
          -Math.PI * 0.46,
          Math.min(Math.PI * 0.46, pitch + (event.clientY - start.y) * 0.004)
        ),
        x = yaw - (event.clientX - start.x) * 0.004
      controls.target
        .copy(camera.position)
        .add(
          new THREE.Vector3(
            Math.sin(x) * Math.cos(y),
            Math.sin(y),
            Math.cos(x) * Math.cos(y)
          )
        )
      camera.lookAt(controls.target)
      invalidate()
    }
    const up = (event: PointerEvent) => {
      const start = pointers.get(event.pointerId)
      pointers.delete(event.pointerId)
      if (
        !start ||
        moved ||
        state.mode !== 'overview' ||
        event.type === 'pointercancel' ||
        event.button !== 0 ||
        Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5
      )
        return
      const rect = canvas.getBoundingClientRect(),
        ray = new THREE.Raycaster()
      ray.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1
        ),
        camera
      )
      const hit = ray.intersectObject(seats)[0]
      if (hit?.instanceId !== undefined) onSelect(seatSections[hit.instanceId])
    }
    const keyboard = (event: KeyboardEvent) => {
      if (
        ![
          'ArrowLeft',
          'ArrowRight',
          'ArrowUp',
          'ArrowDown',
          '+',
          '=',
          '-',
          'Home'
        ].includes(event.key)
      )
        return
      event.preventDefault()
      if (event.key === 'Home') {
        if (state.mode === 'overview') resetOverview(state, venue)
        else {
          camera.lookAt(stage)
          controls.target.copy(stage)
          invalidate()
        }
        return
      }
      if (event.key === '+' || event.key === '=' || event.key === '-') {
        const factor = event.key === '-' ? 1.12 : 0.89
        if (state.mode === 'overview') {
          const offset = camera.position.clone().sub(controls.target),
            length = offset.length()
          offset.multiplyScalar(
            Math.max(
              controls.minDistance,
              Math.min(controls.maxDistance, length * factor)
            ) / length
          )
          camera.position.copy(controls.target).add(offset)
          controls.update()
        } else if (state.mode === 'phone') onZoom(event.key === '-' ? -1 : 1)
        else {
          camera.fov = Math.max(8, Math.min(100, camera.fov * factor))
          camera.updateProjectionMatrix()
        }
      } else if (state.mode === 'overview') {
        const spherical = new THREE.Spherical().setFromVector3(
          camera.position.clone().sub(controls.target)
        )
        spherical.theta +=
          event.key === 'ArrowLeft'
            ? -0.12
            : event.key === 'ArrowRight'
              ? 0.12
              : 0
        spherical.phi = Math.max(
          0.1,
          Math.min(
            Math.PI * 0.49,
            spherical.phi +
              (event.key === 'ArrowUp'
                ? -0.1
                : event.key === 'ArrowDown'
                  ? 0.1
                  : 0)
          )
        )
        camera.position
          .copy(controls.target)
          .add(new THREE.Vector3().setFromSpherical(spherical))
        controls.update()
      } else {
        const direction = camera.getWorldDirection(new THREE.Vector3()),
          x =
            Math.atan2(direction.x, direction.z) +
            (event.key === 'ArrowLeft'
              ? 0.12
              : event.key === 'ArrowRight'
                ? -0.12
                : 0),
          y = Math.max(
            -Math.PI * 0.46,
            Math.min(
              Math.PI * 0.46,
              Math.asin(direction.y) +
                (event.key === 'ArrowUp'
                  ? 0.1
                  : event.key === 'ArrowDown'
                    ? -0.1
                    : 0)
            )
          )
        controls.target
          .copy(camera.position)
          .add(
            new THREE.Vector3(
              Math.sin(x) * Math.cos(y),
              Math.sin(y),
              Math.cos(x) * Math.cos(y)
            )
          )
        camera.lookAt(controls.target)
      }
      invalidate()
    }
    const contextLost = (event: Event) => {
      event.preventDefault()
      lost = true
      cancelAnimationFrame(frame)
      frame = 0
      onLost()
    }
    const visibility = () => {
      if (!document.hidden) invalidate()
      else {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }
    canvas.addEventListener('pointerdown', down)
    canvas.addEventListener('pointermove', move)
    canvas.addEventListener('pointerup', up)
    canvas.addEventListener('pointercancel', up)
    canvas.addEventListener('keydown', keyboard)
    canvas.addEventListener('webglcontextlost', contextLost)
    document.addEventListener('visibilitychange', visibility)
    controls.addEventListener('change', invalidate)
    state.dispose = () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      intersection?.disconnect()
      canvas.removeEventListener('pointerdown', down)
      canvas.removeEventListener('pointermove', move)
      canvas.removeEventListener('pointerup', up)
      canvas.removeEventListener('pointercancel', up)
      canvas.removeEventListener('keydown', keyboard)
      canvas.removeEventListener('webglcontextlost', contextLost)
      document.removeEventListener('visibilitychange', visibility)
      controls.removeEventListener('change', invalidate)
      controls.dispose()
      releaseScene(renderer, scene)
    }
    resetOverview(state, venue)
    return state
  } catch (error) {
    releaseScene(renderer, scene)
    throw error
  }
}

const Stadium = forwardRef<StadiumHandle, Props>(function Stadium(
  { venue, position, mode, roof, zoom, onZoom, onSelect, onMap },
  ref
) {
  const host = useRef<HTMLDivElement>(null),
    state = useRef<SceneState>(),
    select = useRef(onSelect),
    changeZoom = useRef(onZoom)
  select.current = onSelect
  changeZoom.current = onZoom
  const layout = position.layout
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0)
  useImperativeHandle(ref, () => ({
    reset: () => {
      if (state.current) resetOverview(state.current, venue)
    },
    focus: () => {
      const current = state.current,
        geometry = current?.geometry.get(position.section)
      if (!current || !geometry) return
      clearOrbitMotion(current)
      current.mode = 'overview'
      current.controls.enabled = true
      current.controls.minDistance = 3
      current.controls.maxPolarAngle = Math.PI * 0.49
      current.camera.fov = 40
      current.camera.updateProjectionMatrix()
      const point = new THREE.Vector3().fromArray(
        pointInSection(geometry, position.depth / 100, position.lateral / 100)
      )
      current.camera.position.copy(
        point
          .clone()
          .multiplyScalar(1.3)
          .add(new THREE.Vector3(0, 10, 0))
      )
      current.controls.target.copy(point)
      current.controls.update()
      current.marker.visible = true
      current.invalidate()
    },
    snapshot: (crop) => {
      const current = state.current
      if (!current || failed) return false
      try {
        current.renderer.render(current.scene, current.camera)
        const original = current.renderer.domElement,
          output = document.createElement('canvas'),
          x = Math.max(0, Math.min(0.99, crop?.x || 0)),
          y = Math.max(0, Math.min(0.99, crop?.y || 0)),
          width = Math.max(0.01, Math.min(1 - x, crop?.width || 1)),
          height = Math.max(0.01, Math.min(1 - y, crop?.height || 1))
        output.width = Math.round(original.width * width)
        output.height = Math.round(original.height * height)
        output
          .getContext('2d')!
          .drawImage(
            original,
            original.width * x,
            original.height * y,
            original.width * width,
            original.height * height,
            0,
            0,
            output.width,
            output.height
          )
        const link = document.createElement('a')
        link.href = output.toDataURL('image/png')
        link.download = `${venue.short}-${position.section}-视角示意.png`
        link.click()
        return true
      } catch {
        return false
      }
    }
  }))
  useEffect(() => {
    if (!host.current) return
    setFailed(false)
    try {
      const scene = buildScene(
        host.current,
        venue,
        layout,
        (id) => select.current(id),
        () => setFailed(true),
        (direction) => changeZoom.current(direction)
      )
      state.current = scene
      return () => {
        scene.dispose()
        if (state.current === scene) state.current = undefined
      }
    } catch {
      setFailed(true)
    }
  }, [venue, layout, retry])
  useEffect(() => {
    const current = state.current,
      geometry = current?.geometry.get(position.section)
    if (!current || !geometry) return
    if (current.selected !== position.section) {
      for (const [section, color] of [
        [current.selected, '#345e45'],
        [position.section, '#477b95']
      ] as const) {
        const range = current.ranges.get(section),
          shade = new THREE.Color(color)
        if (range)
          for (let index = range[0]; index < range[1]; index++)
            current.seats.setColorAt(index, shade)
      }
      if (current.seats.instanceColor)
        current.seats.instanceColor.needsUpdate = true
      const marker = labelSprite(`当前选择 · ${geometry.section.label}`, true),
        material = current.marker.material as THREE.SpriteMaterial
      material.map?.dispose()
      material.dispose()
      current.marker.material = marker.material
      current.selected = position.section
    }
    current.marker.position
      .fromArray(
        pointInSection(geometry, position.depth / 100, position.lateral / 100)
      )
      .add(new THREE.Vector3(0, 9, 0))
    current.marker.visible = mode === 'overview'
    current.labels.visible = mode === 'overview'
    if (mode !== 'overview') {
      clearOrbitMotion(current)
      current.controls.enabled = false
      current.camera.position.fromArray(audiencePosition(geometry, position))
      current.controls.target.copy(current.stage)
      current.camera.lookAt(current.stage)
      if (mode === 'audience') {
        current.camera.fov = 65
        current.camera.updateProjectionMatrix()
      }
    } else if (current.mode !== 'overview') resetOverview(current, venue)
    current.mode = mode
    current.invalidate()
  }, [venue, position, mode, retry])
  useEffect(() => {
    if (state.current && mode === 'phone') {
      state.current.camera.fov = phoneFieldOfView(zoom)
      state.current.camera.updateProjectionMatrix()
      state.current.invalidate()
    }
  }, [venue, position.layout, mode, zoom, retry])
  useEffect(() => {
    if (state.current) {
      state.current.roof.visible = roof
      state.current.invalidate()
    }
  }, [roof, venue, position.layout, retry])
  return (
    <div ref={host} className="concert-stadium">
      {failed && (
        <div className="stadium-fallback" role="alert">
          <strong>3D 场馆暂时无法显示</strong>
          <p>可以切换座位图继续选区，或重新加载场馆。</p>
          <div>
            <button className="primary-button" onClick={onMap}>
              使用 2D 座位图
            </button>
            <button
              className="secondary-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              重试 3D
            </button>
          </div>
        </div>
      )}
    </div>
  )
})
export default Stadium
