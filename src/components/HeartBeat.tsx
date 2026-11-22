import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MeshSurfaceSampler } from 'three-stdlib'
import { TrackballControls } from 'three-stdlib'
import { createNoise4D } from 'simplex-noise'
import gsap from 'gsap'
import styled from 'styled-components'

const HeartBeatContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000000;
  z-index: 9999;
`

interface HeartBeatProps {
  onComplete: () => void
}

const HeartBeat: React.FC<HeartBeatProps> = ({ onComplete }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let disposed = false
    let completed = false
    let timer: ReturnType<typeof setTimeout>
    const finish = () => {
      if (disposed || completed) return
      completed = true
      clearTimeout(timer)
      onComplete()
    }
    // 模型加载超时也应进入首页，避免一直停在黑屏。
    timer = setTimeout(finish, 10000)
    let heartbeatTimeline: gsap.core.Timeline | undefined

    // 创建场景
    const scene = new THREE.Scene()

    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.position.z = 1.8

    // 创建渲染器
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true })
    } catch (error) {
      console.error('心跳渲染器初始化失败:', error)
      clearTimeout(timer)
      timer = setTimeout(finish, 0)
      return () => { disposed = true; clearTimeout(timer) }
    }
    renderer.setClearColor(new THREE.Color('rgb(0,0,0)'))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    containerRef.current.appendChild(renderer.domElement)

    // 轨迹球控制器
    const controls = new TrackballControls(camera, renderer.domElement)
    controls.noPan = true
    controls.maxDistance = 3
    controls.minDistance = 0.7

    // 创建物体组
    const group = new THREE.Group()
    scene.add(group)

    let heart: any = null
    let sampler: any = null
    let originHeart: Float32Array | null = null

    // 调色板
    const palette = [
      new THREE.Color('#ffd4ee'),
      new THREE.Color('#ff77fc'),
      new THREE.Color('#ff77ae'),
      new THREE.Color('#ff1775')
    ]

    // 简单噪声
    const simplex = createNoise4D()
    const pos = new THREE.Vector3()

    // 粒子类
    class SparkPoint {
      color: THREE.Color
      rand: number
      pos: THREE.Vector3
      one: THREE.Vector3 | null
      two: THREE.Vector3 | null

      constructor() {
        if (sampler) {
          sampler.sample(pos)
        }
        this.color = palette[Math.floor(Math.random() * palette.length)]
        this.rand = Math.random() * 0.03
        this.pos = pos.clone()
        this.one = null
        this.two = null
      }

      update(beatValue: number) {
        const noise =
          simplex(pos.x * 1, pos.y * 1, pos.z * 1, 0.1) + 1.5
        const noise2 =
          simplex(pos.x * 500, pos.y * 500, pos.z * 500, 1) + 1
        this.one = this.pos.clone().multiplyScalar(1.01 + noise * 0.15 * beatValue)
        this.two = this.pos
          .clone()
          .multiplyScalar(1 + noise2 * 1 * (beatValue + 0.3) - beatValue * 1.2)
      }
    }

    const spikes: SparkPoint[] = []
    let positions: number[] = []
    let colors: number[] = []

    // 粒子几何体和材质
    const geometry = new THREE.BufferGeometry()
    const material = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.009
    })
    const particles = new THREE.Points(geometry, material)
    group.add(particles)

    // 心跳动画变量
    const beat = { a: 0 }

    // OBJ加载器
    const loader = new OBJLoader()
    loader.load(
      '/model/heartBeat.obj',
      (obj) => {
        if (disposed || completed) {
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry.dispose()
              const materials = Array.isArray(child.material) ? child.material : [child.material]
              materials.forEach(material => material.dispose())
            }
          })
          return
        }
        heart = (obj as any).children[0]
        heart.geometry.rotateX(-Math.PI * 0.5)
        heart.geometry.scale(0.04, 0.04, 0.04)
        heart.geometry.translate(0, -0.4, 0)
        group.add(heart)

        // 基础网格材质
        const originalMaterials = Array.isArray(heart.material) ? heart.material : [heart.material]
        originalMaterials.forEach((material: THREE.Material) => material.dispose())
        heart.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color('rgb(0,0,0)')
        })
        originHeart = new Float32Array(heart.geometry.attributes.position.array)

        // 创建表面采样器
        sampler = new MeshSurfaceSampler(heart).build()

        // 初始化粒子
        init()

        // 设置心跳动画
        heartbeatTimeline = gsap
          .timeline({
            repeat: -1,
            repeatDelay: 0.3
          })
          .to(beat, {
            a: 0.5,
            duration: 0.6,
            ease: 'power2.in'
          })
          .to(beat, {
            a: 0.0,
            duration: 0.6,
            ease: 'power3.out'
          })

        // 开始渲染循环
        renderer.setAnimationLoop(render)

        // 正常加载后完整播放 3 秒。
        clearTimeout(timer)
        timer = setTimeout(finish, 3000)
      },
      (progress) => {
        console.log('加载进度:', Math.round((progress.loaded / progress.total) * 100) + '%')
      },
      (error) => {
        console.error('模型加载失败:', error)
        finish()
      }
    )

    function init() {
      positions = []
      colors = []
      for (let i = 0; i < 10000; i++) {
        const g = new SparkPoint()
        spikes.push(g)
      }
    }

    const maxZ = 0.23
    const rateZ = 0.5

    function render(a: number) {
      positions = []
      colors = []
      spikes.forEach((g) => {
        g.update(beat.a)
        const rand = g.rand
        const color = g.color
        if (maxZ * rateZ + rand > (g.one?.z || 0) && (g.one?.z || 0) > -maxZ * rateZ - rand) {
          positions.push(g.one!.x, g.one!.y, g.one!.z)
          colors.push(color.r, color.g, color.b)
        }
        if (maxZ * rateZ + rand * 2 > (g.one?.z || 0) && (g.one?.z || 0) > -maxZ * rateZ - rand * 2) {
          positions.push(g.two!.x, g.two!.y, g.two!.z)
          colors.push(color.r, color.g, color.b)
        }
      })

      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))

      if (heart && originHeart) {
        const vs = heart.geometry.attributes.position.array
        for (let i = 0; i < vs.length; i += 3) {
          const v = new THREE.Vector3(originHeart[i], originHeart[i + 1], originHeart[i + 2])
          const noise = simplex(originHeart[i] * 1.5, originHeart[i + 1] * 1.5, originHeart[i + 2] * 1.5, a * 0.0005) + 1
          v.multiplyScalar(0 + noise * 0.15 * beat.a)
          vs[i] = v.x
          vs[i + 1] = v.y
          vs[i + 2] = v.z
        }
        heart.geometry.attributes.position.needsUpdate = true
      }

      controls.update()
      renderer.render(scene, camera)
    }

    // 窗口大小调整
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // 清理
    return () => {
      disposed = true
      clearTimeout(timer)
      heartbeatTimeline?.kill()
      controls.dispose()
      geometry.dispose()
      material.dispose()
      if (heart) {
        heart.geometry.dispose()
        heart.material.dispose()
      }
      window.removeEventListener('resize', handleResize)
      renderer.setAnimationLoop(null)
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      scene.clear()
    }
  }, [onComplete])

  return <HeartBeatContainer ref={containerRef} />
}

export default HeartBeat
