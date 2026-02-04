import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'

// 全局变量
let isGlobalStyleAdded = false
// 全局初始化状态
let isInitializing = false
// Live2D 实例
let oml2dInstance: any = null

const Live2DContainer = styled.div<{ $visible: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
  width: 250px;
  height: 350px;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};

  #oml2d-container,
  #oml2d-container * {
    pointer-events: auto !important;
  }

  @media (max-width: 768px) {
    width: 200px;
    height: 280px;
    bottom: 10px;
    right: 10px;
  }
`

const LoadingText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #667eea;
  font-size: 12px;
  text-align: center;
  pointer-events: none;
`

interface Live2DDashboardProps {
  isVisible: boolean
}

const Live2DDashboard: React.FC<Live2DDashboardProps> = ({ isVisible }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current || isInitializing) {
      console.log('Live2D 已初始化或正在初始化...')
    }

    // 标记全局初始化状态
    isInitializing = true
    let isMounted = true

    // 添加全局样式覆盖
    if (!isGlobalStyleAdded) {
      const styleId = 'oml2d-override-style'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.innerHTML = `
          #oml2d-stage {
            left: auto !important;
            right: 0 !important;
          }
        `
        document.head.appendChild(style)
      }
      isGlobalStyleAdded = true
    }

    const initLive2D = async () => {
      try {
        console.log('开始初始化 Live2D 看板娘...')

        // 动态导入 oh-my-live2d
        const { loadOml2d } = await import('oh-my-live2d')

        if (!isMounted || !containerRef.current) {
          console.log('组件已卸载或容器不存在')
          isInitializing = false
          return
        }

        // 创建容器
        const container = document.createElement('div')
        container.id = 'oml2d-container'
        container.style.cssText = 'width: 100%; height: 100%;'
        containerRef.current.appendChild(container)

        console.log('加载 Live2D 模型...')
        // 初始化 Live2D 并保存实例
        oml2dInstance = await loadOml2d({
          models: [
            {
              path: 'https://model.hacxy.cn/HK416-2-normal/model.json',
              position: [0, 50],
              scale: 0.08,
              stageStyle: {
                height: 450
              }
            }
          ]
        })

        console.log('Live2D 模型加载完成')

        // 初始化后强制修改样式
        setTimeout(() => {
          const stage = document.getElementById('oml2d-stage')
          if (stage) {
            stage.style.setProperty('left', 'auto', 'important')
            stage.style.setProperty('right', '0', 'important')
            console.log('oml2d-stage 样式已修改')
          }
        }, 100)

        console.log('Live2D 看板娘初始化成功')
        initRef.current = true

        if (isMounted) {
          setLoaded(true)
          console.log('看板娘已设置为可见')
        }

      } catch (error) {
        console.error('Live2D 初始化失败:', error)
        // 初始化失败时重置标记，允许重试
        isInitializing = false
        initRef.current = false
      }
    }

    initLive2D()

    return () => {
      isMounted = false

      // 组件卸载时销毁 Live2D 实例并清理 DOM
      if (oml2dInstance) {
        console.log('组件卸载，销毁 Live2D 实例')
        try {
          if (oml2dInstance.destroy) {
            oml2dInstance.destroy()
          }
        } catch (error) {
          console.error('销毁 Live2D 失败:', error)
        }
        oml2dInstance = null
      }

      // 移除所有 oml2d 相关的 DOM 元素
      // 先移除 canvas 等子元素
      const canvases = document.querySelectorAll('#oml2d-stage canvas')
      canvases.forEach(canvas => canvas.remove())

      // 再移除 stage 元素
      const stage = document.getElementById('oml2d-stage')
      if (stage) {
        stage.remove()
        console.log('已移除 oml2d-stage 元素')
      }

      // 移除其他可能的 oml2d 元素
      const oml2dElements = document.querySelectorAll('[id^="oml2d"]')
      oml2dElements.forEach(el => el.remove())

      console.log('Live2D 资源清理完成')
    }
  }, [])

  return (
    <Live2DContainer ref={containerRef} $visible={isVisible && loaded}>
      {!loaded && <LoadingText>看板娘加载中...</LoadingText>}
    </Live2DContainer>
  )
}

export default Live2DDashboard
