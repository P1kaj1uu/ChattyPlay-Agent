import React, { useState, useEffect, useRef } from 'react'
import { message } from 'antd'
import { useTranslation } from 'react-i18next'
import EditorPanel from '@/components/markmap/EditorPanel'
import MindmapPanel from '@/components/markmap/MindmapPanel'
import MobileMenu from '@/components/markmap/MobileMenu'
import MobileTabBar from '@/components/markmap/MobileTabBar'
import PromptModal from '@/components/markmap/PromptModal'
import EditNodeModal from '@/components/markmap/EditNodeModal'
import InfoModal from '@/components/markmap/InfoModal'
import LandscapeMode from '@/components/markmap/LandscapeMode'
import {
  waitForLibraries,
  getNodeColor,
  createExportableSvg,
  downloadBlob,
  generateExportFileName,
  collectNodeLines,
  removeContextMenu,
  createContextMenu,
  LAST_SUCCESSFUL_MODEL_KEY,
  type AiResult,
  type NodeContext
} from '@/utils/markmap'

const Markmap: React.FC = () => {
  const { t } = useTranslation()
  const [mm, setMm] = useState<any>(null)
  const [transformer, setTransformer] = useState<any>(null)
  const [currentMarkdown, setCurrentMarkdown] = useState<string>('')
  const [aiResults, setAiResults] = useState<AiResult[]>([])
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1)
  const [currentViewMode, setCurrentViewMode] = useState<'input' | 'original' | 'markdown'>('input')
  const [aiPromptTemplate, setAiPromptTemplate] = useState<string>('')
  const [editingNodeContext, setEditingNodeContext] = useState<NodeContext | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [apiUrl, setApiUrl] = useState<string>('')
  const [apiKey, setApiKey] = useState<string>('')
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini')
  const [customModel, setCustomModel] = useState<string>('')
  const [versionCount, setVersionCount] = useState<number>(3)
  const [availableModels, setAvailableModels] = useState<string[]>([])
  const [promptModalVisible, setPromptModalVisible] = useState<boolean>(false)
  const [infoModalVisible, setInfoModalVisible] = useState<boolean>(false)
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
  const [currentMobilePanel, setCurrentMobilePanel] = useState<'editor' | 'mindmap'>('editor')
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState('')
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)
  const mindmapContainerRef = useRef<HTMLDivElement>(null)
  const mindmapSvgRef = useRef<SVGSVGElement>(null)
  const landscapeContentRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef<boolean>(false)

  useEffect(() => {
    // 防止重复初始化
    if (isInitializedRef.current) return

    const initLibraries = async () => {
      try {
        await waitForLibraries()

        // 清空 SVG 内容
        if (mindmapSvgRef.current) {
          mindmapSvgRef.current.innerHTML = ''
        }

        const { Transformer, Markmap } = window.markmap
        const transformerInstance = new Transformer()
        setTransformer(transformerInstance)

        if (mindmapSvgRef.current) {
          const mmInstance = Markmap.create(mindmapSvgRef.current, {
            duration: 500,
            nodeMinHeight: 20,
            spacingVertical: 8,
            spacingHorizontal: 100,
            autoFit: true,
            fitRatio: 0.95,
            color: getNodeColor,
            // 添加额外的样式配置确保一致性
            maxWidth: 0,
            nodeMin: 16,
            paddingX: 8,
          })
          setMm(mmInstance)
        }

        loadConfig()
        loadPrompt()

        // 只在第一次加载时设置默认 markdown
        const defaultMarkdown = t('aimarkmap.defaultMarkdown')
        setCurrentMarkdown(defaultMarkdown)

        isInitializedRef.current = true

        if (apiUrl && apiKey) {
          queryAvailableModels(true)
        }
      } catch (error) {
        console.error('初始化失败:', error)
        message.error('初始化失败，请刷新页面重试')
      }
    }

    initLibraries()

    document.addEventListener('fullscreenchange', handleFullScreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange)
    document.addEventListener('mozfullscreenchange', handleFullScreenChange)
    document.addEventListener('MSFullscreenChange', handleFullScreenChange)
    document.addEventListener('click', handleDocumentClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange)
      document.removeEventListener('click', handleDocumentClick)
      document.removeEventListener('keydown', handleKeyDown)
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [])

  // 更新 Mindmap 数据和视图
  useEffect(() => {
    if (mm && transformer) {
      try {
        const { root } = transformer.transform(currentMarkdown)
        mm.setData(root)
        // 立即调用 fit 确保样式和布局正确应用
        setTimeout(() => mm.fit(), 50)
      } catch (error) {
        console.error('渲染Markmap失败:', error)
      }
    }
  }, [currentMarkdown, mm, transformer])

  // 保存配置到本地存储
  useEffect(() => {
    const config = {
      apiUrl,
      apiKey,
      model: selectedModel,
      customModel,
      versionCount,
    }
    localStorage.setItem('ai-mindmap-config', JSON.stringify(config))
  }, [apiUrl, apiKey, selectedModel, customModel, versionCount])

  // 设置节点交互事件
  useEffect(() => {
    if (mm && window.d3) {
      setupNodeInteraction()
    }
  }, [mm])

  const loadConfig = () => {
    try {
      const configStr = localStorage.getItem('ai-mindmap-config')
      const parsed = configStr ? JSON.parse(configStr) : {}

      setApiUrl(parsed.apiUrl || '')
      setApiKey(parsed.apiKey || '')

      if (parsed.versionCount) {
        setVersionCount(parseInt(parsed.versionCount))
      }

      const lastSuccessfulModel = localStorage.getItem(LAST_SUCCESSFUL_MODEL_KEY)
      const modelToSet = lastSuccessfulModel || parsed.model || 'gpt-4o-mini'

      if (['gpt-4o-mini', 'custom', ...availableModels].includes(modelToSet)) {
        setSelectedModel(modelToSet)
      } else {
        setSelectedModel('custom')
        setCustomModel(modelToSet)
      }
    } catch (e) {
      console.error('解析本地配置失败', e)
      localStorage.removeItem('ai-mindmap-config')
    }
  }

  const loadPrompt = () => {
    const savedPrompt = localStorage.getItem('ai-mindmap-prompt')
    setAiPromptTemplate(savedPrompt || t('aimarkmap.defaultPrompt'))
  }

  const queryAvailableModels = async (isSilent = false) => {
    if (!apiUrl || !apiKey) {
      if (!isSilent) {
        message.warning(t('aimarkmap.js_alert_query_no_config'))
      }
      return
    }

    try {
      let modelsApiUrl

      try {
        const url = new URL(apiUrl)
        let pathname = url.pathname.replace(/\/chat\/completions\/?$/, '')
        if (!pathname.endsWith('/models')) {
          pathname = pathname.replace(/\/$/, '') + '/models'
        }
        modelsApiUrl = url.origin + pathname
      } catch (urlError) {
        modelsApiUrl = apiUrl.replace(/\/chat\/completions$/, '/models')
        if (!modelsApiUrl.endsWith('/models')) {
          const baseUrlMatch = apiUrl.match(/^(https?:\/\/[^\/]+(?:\/[^\/]+)*?\/v\d+)/)
          if (baseUrlMatch) {
            modelsApiUrl = `${baseUrlMatch[1]}/models`
          } else {
            throw new Error('无法从API地址推断出/models路径，请检查API地址格式。')
          }
        }
      }

      const response = await fetch(modelsApiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`查询失败: ${response.status} - ${response.statusText}. 响应: ${errorText}`)
      }

      const data = await response.json()
      const models = (data.data || data.models || []).map((m: any) => m.id || m.name || m).filter(Boolean)
      if (models.length === 0) throw new Error('未找到可用模型')

      setAvailableModels(models)

      if (!models.includes(selectedModel === 'custom' ? customModel : selectedModel)) {
        setSelectedModel('custom')
      }

      if (!isSilent) {
        message.success(t('aimarkmap.js_alert_query_success', { n: models.length }))
      }
    } catch (error: any) {
      console.error('查询模型失败:', error)
      if (!isSilent) {
        message.error(t('aimarkmap.js_alert_query_failed', { msg: error.message }))
      }
    }
  }

  const generateWithAI = async () => {
    if (!searchValue) {
      message.warning(t('aimarkmap.js_alert_no_content'))
      return
    }

    setIsLoading(true)
    setStatusMessage(t('aimarkmap.js_status_requesting'))
    startTimer()

    try {
      const content = searchValue
      const fetchPromises = []
      const url = import.meta.env.VITE_OPENAI_BASE_URL + '/chat/completions'
      const deepseekKey = import.meta.env.VITE_OPENAI_API_KEY || ''
      for (let i = 0; i < versionCount; i++) {
        fetchPromises.push(
          fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${deepseekKey}` },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [{ role: 'user', content: aiPromptTemplate.replace('{{CONTENT}}', content) }],
              max_tokens: 2000,
              temperature: 0.6 + i * 0.15,
            })
          })
        )
      }

      const responses = await Promise.allSettled(fetchPromises)
      let successfulResults: AiResult[] = []

      for (const result of responses) {
        if (result.status === 'fulfilled') {
          const response = result.value
          if (response.ok) {
            try {
              const data = await response.json()
              const markdownContent = data.choices?.[0]?.message?.content
              if (markdownContent) {
                const { root } = transformer.transform(markdownContent.trim())
                successfulResults.push({ markdown: markdownContent.trim(), root })
              }
            } catch (e) {
              console.error('解析AI响应失败:', e)
            }
          }
        } else {
          console.error('一个AI请求失败:', result.reason)
        }
        setStatusMessage(t('aimarkmap.js_status_generated', { s: successfulResults.length, n: versionCount }))
      }

      if (successfulResults.length > 0) {
        localStorage.setItem(LAST_SUCCESSFUL_MODEL_KEY, 'deepseek-chat')
        setAiResults(successfulResults)
        setActiveResultIndex(0)
        setCurrentMarkdown(successfulResults[0].markdown)
        setCurrentViewMode('markdown')
        message.success(t('aimarkmap.js_status_done', { n: successfulResults.length }))

        // 移动端自动跳转到导图面板
        if (window.innerWidth <= 768) {
          setCurrentMobilePanel('mindmap')
        }
      } else {
        throw new Error(t('aimarkmap.js_alert_all_failed'))
      }
    } catch (error: any) {
      console.error('AI生成失败:', error)
      message.error(t('aimarkmap.js_alert_gen_failed', { msg: error.message }))
    } finally {
      stopTimer()
      setIsLoading(false)
    }
  }

  const startTimer = () => {
    startTimeRef.current = Date.now()
    setTimerSeconds(0)
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
    }
    timerIntervalRef.current = setInterval(() => {
      const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000
      setTimerSeconds(parseFloat(elapsedSeconds.toFixed(1)))
    }, 100)
  }

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current)
      timerIntervalRef.current = null
    }
  }

  const clearContent = () => {
    setSearchValue('')
    setAiResults([])
    setActiveResultIndex(-1)
    setCurrentMarkdown(t('aimarkmap.defaultMarkdown'))
    setCurrentViewMode('input')
  }

  const switchToResult = (index: number) => {
    if (index < 0 || index >= aiResults.length) return

    setActiveResultIndex(index)
    setCurrentMarkdown(aiResults[index].markdown)
  }

  const handleDisplayEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMarkdown = e.target.value
    setCurrentMarkdown(newMarkdown)

    if (activeResultIndex > -1 && aiResults[activeResultIndex]) {
      const updatedResults = [...aiResults]
      updatedResults[activeResultIndex].markdown = newMarkdown
      try {
        const { root } = transformer.transform(newMarkdown)
        updatedResults[activeResultIndex].root = root
      } catch (error) {
        console.error('Error parsing edited markdown:', error)
      }
      setAiResults(updatedResults)
    }
  }

  const handleTopicInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setSearchValue(text)
    if (text.trim().startsWith('#')) {
      setAiResults([])
      setActiveResultIndex(-1)
      setCurrentMarkdown(text)
    }
  }

  const toggleFullScreen = () => {
    const mindmapPanel = document.querySelector('.mindmap-panel') as any
    if (!mindmapPanel) return

    const doc = document as any
    const isFullScreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement

    if (!isFullScreen) {
      if (mindmapPanel.requestFullscreen) {
        mindmapPanel.requestFullscreen()
      } else if (mindmapPanel.mozRequestFullScreen) {
        mindmapPanel.mozRequestFullScreen()
      } else if (mindmapPanel.webkitRequestFullscreen) {
        mindmapPanel.webkitRequestFullscreen()
      } else if (mindmapPanel.msRequestFullscreen) {
        mindmapPanel.msRequestFullscreen()
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen()
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen()
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen()
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen()
      }
    }
  }

  const handleFullScreenChange = () => {
    const doc = document as any
    const isFullScreen = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement
    setIsFullscreen(!!isFullScreen)

    if (mm) {
      setTimeout(() => { mm.fit() }, 200)
    }
  }

  const exportSVG = async () => {
    if (!mindmapSvgRef.current || !mm) {
      message.warning(t('aimarkmap.js_alert_no_mindmap'))
      return
    }

    try {
      // 等待 markmap 完成渲染和适配
      mm.fit()
      await new Promise(resolve => setTimeout(resolve, 500))

      const svgData = createExportableSvg(mindmapSvgRef.current)

      if (!svgData) {
        throw new Error(t('aimarkmap.js_alert_no_mindmap'))
      }

      const svgBlob = new Blob([svgData.svgString], { type: 'image/svg+xml;charset=utf-8' })
      downloadBlob(svgBlob, generateExportFileName(currentMarkdown, 'svg'))
    } catch (error) {
      console.error('导出SVG失败:', error)
      message.error(t('aimarkmap.js_alert_export_error', { type: 'SVG' }))
    }
  }

  const exportPNG = async () => {
    if (!mindmapSvgRef.current || !mm) {
      message.warning(t('aimarkmap.js_alert_no_mindmap'))
      return
    }

    try {
      // 等待 markmap 完成渲染和适配
      mm.fit()
      await new Promise(resolve => setTimeout(resolve, 500))

      const svgData = createExportableSvg(mindmapSvgRef.current)

      if (!svgData) {
        throw new Error(t('aimarkmap.js_alert_no_mindmap'))
      }

      // 提高缩放比例以获得更清晰的图片
      const scale = 5
      const margin = 20
      const canvas = document.createElement('canvas')
      canvas.width = (svgData.width + margin * 2) * scale
      canvas.height = (svgData.height + margin * 2) * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法获取Canvas上下文')

      // 启用高质量图像平滑
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 填充白色背景
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData.svgString)))

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = (err) => reject(new Error('Failed to load SVG as image. ' + err))
        image.src = dataUrl
      })

      if (img.decode) await img.decode()

      ctx.drawImage(img, margin * scale, margin * scale, svgData.width * scale, svgData.height * scale)

      // 使用最高质量导出
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png', 1.0)
      )

      if (blob) {
        downloadBlob(blob, generateExportFileName(currentMarkdown, 'png'))
      } else {
        throw new Error('Canvas toBlob failed.')
      }
    } catch (error) {
      console.error('导出PNG时发生意外错误:', error)
      message.error(t('aimarkmap.js_alert_export_error', { type: 'PNG' }))
    }
  }

  const openEditModal = (_originalText: string, lineIndex: number, prefix: string) => {
    setEditingNodeContext({ lineIndex, prefix })
    setEditModalVisible(true)
  }

  const closeEditModal = () => {
    setEditingNodeContext(null)
    setEditModalVisible(false)
  }

  const saveNodeEdit = (newText: string) => {
    if (!editingNodeContext) return

    const { lineIndex, prefix } = editingNodeContext
    const newLine = prefix + newText

    const lines = currentMarkdown.split('\n')
    if (lines[lineIndex] !== undefined) {
      lines[lineIndex] = newLine
      const updatedMarkdown = lines.join('\n')
      setCurrentMarkdown(updatedMarkdown)
    }

    if (activeResultIndex > -1 && aiResults[activeResultIndex]) {
      const updatedResults = [...aiResults]
      updatedResults[activeResultIndex].markdown = currentMarkdown
      try {
        const { root } = transformer.transform(currentMarkdown)
        updatedResults[activeResultIndex].root = root
      } catch (error) {
        console.error('Error parsing edited markdown after node edit:', error)
      }
      setAiResults(updatedResults)
    }

    closeEditModal()
  }

  const deleteNode = (nodeToDelete: any) => {
    if (!nodeToDelete) return

    const linesToDelete = new Set<number>()
    collectNodeLines(nodeToDelete, linesToDelete)

    if (linesToDelete.size === 0) {
      console.warn('Could not find line numbers for node deletion.', nodeToDelete)
      return
    }

    const lines = currentMarkdown.split('\n')
    const newLines = lines.filter((_, i) => !linesToDelete.has(i))
    const updatedMarkdown = newLines.join('\n')
    setCurrentMarkdown(updatedMarkdown)

    if (activeResultIndex > -1 && aiResults[activeResultIndex]) {
      const updatedResults = [...aiResults]
      updatedResults[activeResultIndex].markdown = updatedMarkdown
      try {
        const { root } = transformer.transform(updatedMarkdown)
        updatedResults[activeResultIndex].root = root
      } catch (error) {
        console.error('Error parsing markdown after node deletion:', error)
      }
      setAiResults(updatedResults)
    }
  }

  const setupNodeInteraction = () => {
    if (!mm || !window.d3) return

    document.addEventListener('click', (e) => {
      if (!(e.target as Element).closest('.context-menu')) {
        removeContextMenu()
      }
    })

    mm.svg.on('contextmenu.editor', (event: MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      removeContextMenu()

      const node = (event.target as Element).closest('.markmap-node')
      if (!node) return

      const d = window.d3.select(node).datum()
      if (!d?.data?.payload?.lines) return

      createContextMenu(event, d, currentMarkdown, openEditModal, deleteNode)
    })

    // 设置 SVG 缩放行为
    const svg = mm.svg

    const zoom = window.d3.zoom()
      .scaleExtent([0.3, 3])
      .on('zoom', (event: any) => {
        svg.select('g').attr('transform', event.transform)
        // 更新缩放级别状态
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom as any)
  }

  const handleDocumentClick = (e: MouseEvent) => {
    if (isMobileMenuOpen) {
      const mobileMenu = document.getElementById('mobile-menu')
      const hamburgerBtn = document.getElementById('hamburger-btn')
      if (!mobileMenu?.contains(e.target as Node) && !hamburgerBtn?.contains(e.target as Node)) {
        setIsMobileMenuOpen(false)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (isLandscapeMode) {
        e.preventDefault()
        closeLandscapeMode()
        return
      }
      if (editModalVisible) {
        e.preventDefault()
        closeEditModal()
      } else {
        removeContextMenu()
      }
      return
    }

    if (e.key === 'F11') {
      e.preventDefault()
      toggleFullScreen()
    }

    const activeEl = document.activeElement
    const isEditing = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')

    if (!isEditing && aiResults.length > 1) {
      let newIndex
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        newIndex = (activeResultIndex + 1) % aiResults.length
        switchToResult(newIndex)
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        newIndex = (activeResultIndex - 1 + aiResults.length) % aiResults.length
        switchToResult(newIndex)
      }
    }

    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key === 's') {
        e.preventDefault()
        exportPNG()
      }
    }
  }

  const toggleLandscapeMode = () => {
    if (window.innerWidth > 768) return
    if (currentMobilePanel !== 'mindmap') return

    if (!isLandscapeMode) {
      setIsLandscapeMode(true)
      document.body.style.overflow = 'hidden'
      setTimeout(() => {
        centerLandscapeMindmap()
      }, 100)
    } else {
      closeLandscapeMode()
    }
  }

  const closeLandscapeMode = () => {
    setIsLandscapeMode(false)
    document.body.style.overflow = ''
  }

  const centerLandscapeMindmap = () => {
    const svg = document.querySelector('#landscape-mindmap')
    if (!svg) return

    const g = svg.querySelector('g')
    if (!g) return

    const bbox = g.getBBox()
    const containerWidth = svg.clientWidth
    const containerHeight = svg.clientHeight

    if (bbox.width === 0 || bbox.height === 0) return

    const padding = 40
    const scaleX = (containerWidth - padding * 2) / bbox.width
    const scaleY = (containerHeight - padding * 2) / bbox.height
    const scale = Math.min(scaleX, scaleY, 1.5)

    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    const contentCenterX = bbox.x + bbox.width / 2
    const contentCenterY = bbox.y + bbox.height / 2

    const translateX = centerX - contentCenterX * scale
    const translateY = centerY - contentCenterY * scale

    g.setAttribute('transform', `translate(${translateX}, ${translateY}) scale(${scale})`)
  }

  const switchLandscapeVersion = (index: number) => {
    if (index < 0 || index >= aiResults.length) return

    setActiveResultIndex(index)
    setCurrentMarkdown(aiResults[index].markdown)

    setTimeout(() => {
      const content = document.getElementById('landscape-content')
      const originalSvg = document.querySelector('#mindmap')
      if (originalSvg && content) {
        const clonedSvg = originalSvg.cloneNode(true)
        ;(clonedSvg as SVGElement).id = 'landscape-mindmap'
        ;(clonedSvg as SVGElement).style.cssText = 'width:100%;height:100%;display:block;'
        content.innerHTML = ''
        content.appendChild(clonedSvg)
        setTimeout(() => {
          centerLandscapeMindmap()
        }, 100)
      }
    }, 100)
  }

  const exportLandscapeSVG = async () => {
    const landscapeSvg = document.querySelector('#landscape-mindmap') as SVGSVGElement
    if (!landscapeSvg) {
      message.warning(t('aimarkmap.js_alert_no_mindmap'))
      return
    }

    try {
      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 300))

      const svgData = createExportableSvg(landscapeSvg)
      if (!svgData) {
        throw new Error(t('aimarkmap.js_alert_no_mindmap'))
      }

      const svgBlob = new Blob([svgData.svgString], { type: 'image/svg+xml;charset=utf-8' })
      downloadBlob(svgBlob, generateExportFileName(currentMarkdown, 'svg'))
    } catch (error) {
      console.error('横屏导出SVG失败:', error)
      message.error(t('aimarkmap.js_alert_export_error', { type: 'SVG' }))
    }
  }

  const exportLandscapePNG = async () => {
    const landscapeSvg = document.querySelector('#landscape-mindmap') as SVGSVGElement
    if (!landscapeSvg) {
      message.warning(t('aimarkmap.js_alert_no_mindmap'))
      return
    }

    try {
      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 300))

      const svgData = createExportableSvg(landscapeSvg)
      if (!svgData) {
        throw new Error(t('aimarkmap.js_alert_no_mindmap'))
      }

      // 提高缩放比例以获得更清晰的图片
      const scale = 5
      const margin = 20
      const canvas = document.createElement('canvas')
      canvas.width = (svgData.width + margin * 2) * scale
      canvas.height = (svgData.height + margin * 2) * scale

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('无法获取Canvas上下文')

      // 启用高质量图像平滑
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 填充白色背景
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData.svgString)))

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image()
        image.onload = () => resolve(image)
        image.onerror = (err) => reject(new Error('Failed to load SVG as image. ' + err))
        image.src = dataUrl
      })

      if (img.decode) await img.decode()

      ctx.drawImage(img, margin * scale, margin * scale, svgData.width * scale, svgData.height * scale)

      // 使用最高质量导出
      const blob = await new Promise<Blob | null>(resolve =>
        canvas.toBlob(resolve, 'image/png', 1.0)
      )

      if (blob) {
        downloadBlob(blob, generateExportFileName(currentMarkdown, 'png'))
      } else {
        throw new Error('Canvas toBlob failed.')
      }
    } catch (error) {
      console.error('横屏导出PNG失败:', error)
      message.error(t('aimarkmap.js_alert_export_error', { type: 'PNG' }))
    }
  }

  const handleZoomIn = () => {
    if (!mm || !window.d3) return
    const svg = mm.svg
    svg.transition().duration(300).call(
      window.d3.zoom().scaleBy as any,
      1.2
    )
  }

  const handleZoomOut = () => {
    if (!mm || !window.d3) return
    const svg = mm.svg
    svg.transition().duration(300).call(
      window.d3.zoom().scaleBy as any,
      0.8
    )
  }

  const handleResetZoom = () => {
    if (!mm || !window.d3) return
    const svg = mm.svg
    svg.transition().duration(300).call(
      window.d3.zoom().transform as any,
      window.d3.zoomIdentity
    )
    setTimeout(() => {
      mm.fit()
      setZoomLevel(1)
    }, 300)
  }

  const handleSavePrompt = () => {
    if (aiPromptTemplate) {
      if (aiPromptTemplate.includes('{{CONTENT}}')) {
        localStorage.setItem('ai-mindmap-prompt', aiPromptTemplate)
      } else {
        const newPrompt = aiPromptTemplate + '\n\n"{{CONTENT}}"'
        setAiPromptTemplate(newPrompt)
        localStorage.setItem('ai-mindmap-prompt', newPrompt)
      }
    } else {
      localStorage.removeItem('ai-mindmap-prompt')
      setAiPromptTemplate(t('aimarkmap.defaultPrompt'))
    }
    setPromptModalVisible(false)
  }

  return (
    <div className='min-h-screen font-sans'>
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenInfo={() => setInfoModalVisible(true)}
      />

      <div className='flex h-[calc(100vh-3.5rem-3.5rem)] sm:h-[calc(100vh-4rem)] p-0 sm:p-4 gap-0 sm:gap-4 relative overflow-hidden'>
        <EditorPanel
          searchValue={searchValue}
          currentMarkdown={currentMarkdown}
          currentViewMode={currentViewMode}
          versionCount={versionCount}
          aiResults={aiResults}
          onVersionCountChange={setVersionCount}
          onGenerate={generateWithAI}
          onClear={clearContent}
          onSwitchView={setCurrentViewMode}
          onTopicInput={handleTopicInput}
          onDisplayEdit={handleDisplayEdit}
          onOpenPromptModal={() => setPromptModalVisible(true)}
          isLoading={isLoading}
          currentMobilePanel={currentMobilePanel}
        />

        <MindmapPanel
          mindmapContainerRef={mindmapContainerRef}
          mindmapSvgRef={mindmapSvgRef}
          isLoading={isLoading}
          timerSeconds={timerSeconds}
          statusMessage={statusMessage}
          isFullscreen={isFullscreen}
          aiResults={aiResults}
          activeResultIndex={activeResultIndex}
          zoomLevel={zoomLevel}
          onToggleFullscreen={toggleFullScreen}
          onExportSVG={exportSVG}
          onExportPNG={exportPNG}
          onSwitchVersion={switchToResult}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          currentMobilePanel={currentMobilePanel}
        />
      </div>

      <MobileTabBar
        currentMobilePanel={currentMobilePanel}
        onSwitchPanel={setCurrentMobilePanel}
        onToggleLandscape={toggleLandscapeMode}
      />

      <LandscapeMode
        isVisible={isLandscapeMode}
        landscapeContentRef={landscapeContentRef}
        aiResults={aiResults}
        activeResultIndex={activeResultIndex}
        onSwitchVersion={switchLandscapeVersion}
        onExportSVG={exportLandscapeSVG}
        onExportPNG={exportLandscapePNG}
        onClose={closeLandscapeMode}
      />

      <PromptModal
        visible={promptModalVisible}
        promptTemplate={aiPromptTemplate}
        onPromptChange={setAiPromptTemplate}
        onSave={handleSavePrompt}
        onCancel={() => setPromptModalVisible(false)}
      />

      <EditNodeModal
        visible={editModalVisible}
        defaultValue={editingNodeContext ? '' : ''}
        onSave={saveNodeEdit}
        onCancel={closeEditModal}
      />

      <InfoModal
        visible={infoModalVisible}
        onClose={() => setInfoModalVisible(false)}
      />

      <style>{`
        /* 全局 markmap 样式 - 确保所有导图样式一致 */
        .markmap {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        .markmap text {
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .markmap g[data-depth="0"] text {
          font-size: 20px !important;
          font-weight: 700 !important;
        }
        .markmap g[data-depth="1"] text {
          font-size: 16px !important;
          font-weight: 600 !important;
        }
        .markmap g[data-depth="2"] text {
          font-size: 14px !important;
          font-weight: 500 !important;
        }
        .markmap g[data-depth="3"] text,
        .markmap g[data-depth="4"] text,
        .markmap g[data-depth="5"] text {
          font-size: 13px !important;
          font-weight: 400 !important;
        }
        /* 确保线条和形状颜色一致 */
        .markmap path {
          stroke-width: 1.5 !important;
        }
        .markmap circle {
          stroke-width: 1.5 !important;
        }

        .context-menu {
          position: absolute;
          z-index: 3000;
          background-color: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 6px 0;
          min-width: 150px;
          font-size: 0.9rem;
          list-style: none;
          user-select: none;
        }
        .context-menu-item {
          padding: 8px 16px;
          cursor: pointer;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .context-menu-item:hover {
          background-color: #f5f5f5;
        }
        @media (max-width: 768px) {
          .editor-panel,
          .mindmap-panel {
            transition: transform 0.3s ease, opacity 0.2s ease;
          }
        }
      `}</style>
    </div>
  )
}

export default Markmap
