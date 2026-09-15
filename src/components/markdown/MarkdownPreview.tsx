import React, { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import {
  decodeMermaidSource,
  escapeHtml,
  renderMermaidToSvg,
  type RenderedDiagram,
  type ThemeMode,
} from '@/utils/markdown'
import './markdown.css'

interface MarkdownPreviewProps {
  /** 已渲染过的 HTML（由页面层统一渲染，便于同时产出目录数据） */
  html: string
  theme: ThemeMode
  onScrollRatio?: (ratio: number) => void
  scrollToRatio?: number
  /** 预览区当前所处的章节标题 id，用于目录高亮 */
  onActiveHeadingChange?: (id: string | null) => void
  /** 请求滚动到指定标题；带 ts 以便连续点击同一标题也能触发 */
  scrollToHeading?: { id: string; ts: number } | null
}

/** 判定“当前章节”时的顶部留白，与标题锚点滚动位置的偏移保持一致 */
const HEADING_OFFSET = 28

// 渲染结果放在模块级缓存：移动端切换视图会卸载并重新挂载组件，
// 有缓存就能立即回填，而不必重新渲染一遍图表
const DIAGRAM_CACHE_LIMIT = 80
const diagramCache = new Map<string, RenderedDiagram>()

function cacheDiagram(key: string, value: RenderedDiagram) {
  if (diagramCache.size >= DIAGRAM_CACHE_LIMIT) {
    // Map 按插入顺序迭代，这里淘汰最早写入的一条
    const oldest = diagramCache.keys().next().value
    if (oldest !== undefined) diagramCache.delete(oldest)
  }
  diagramCache.set(key, value)
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  html,
  theme,
  onScrollRatio,
  scrollToRatio,
  onActiveHeadingChange,
  scrollToHeading,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const suppressScrollRef = useRef(false)
  // 渲染任务令牌：只有最新的任务能写 DOM，旧任务在每个 await 之后都会让位
  const taskRef = useRef(0)
  // 渲染失败的图表（主题 + 源码），避免同一份错误代码被反复重试刷屏
  const failedRef = useRef(new Set<string>())
  // 标题元素缓存（预览 DOM 每次都被重建，需要用最新的节点）
  const headingElsRef = useRef<HTMLElement[]>([])
  const activeIdRef = useRef<string | null>(null)
  const rafRef = useRef<number | null>(null)

  /** 计算当前所处章节并上报（仅在变化时回调） */
  const computeActiveHeading = useCallback(() => {
    const el = containerRef.current
    if (!el || !onActiveHeadingChange) return
    const headingEls = headingElsRef.current
    if (!headingEls.length) return

    const containerTop = el.getBoundingClientRect().top
    let current: string | null = null
    for (const node of headingEls) {
      if (!node.isConnected) continue
      if (node.getBoundingClientRect().top - containerTop <= HEADING_OFFSET) {
        current = node.id
      } else {
        // querySelectorAll 保证文档顺序，越过阈值即可停止
        break
      }
    }
    // 还没滚到第一个标题时，认为处于文档开头
    if (!current) current = headingEls[0].id

    if (current !== activeIdRef.current) {
      activeIdRef.current = current
      onActiveHeadingChange(current)
    }
  }, [onActiveHeadingChange])

  const scheduleActiveUpdate = useCallback(() => {
    if (rafRef.current !== null) return
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null
      computeActiveHeading()
    })
  }, [computeActiveHeading])

  /**
   * 源码每变化一次就会整体重建预览 DOM（dangerouslySetInnerHTML）。
   * 这里在浏览器绘制前：① 用缓存同步回填图表，避免输入时图表闪空；② 刷新标题元素缓存。
   */
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    headingElsRef.current = Array.from(
      el.querySelectorAll<HTMLElement>('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]')
    )

    el.querySelectorAll<HTMLElement>('.md-mermaid').forEach((node) => {
      if (node.dataset.rendered === '1') return
      const code = decodeMermaidSource(node.getAttribute('data-mermaid'))
      if (!code) return
      const cached = diagramCache.get(`${theme}::${code}`)
      if (cached) {
        node.innerHTML = cached.svg
        cached.bindFunctions?.(node)
        node.dataset.rendered = '1'
      } else {
        node.classList.add('md-mermaid-loading')
      }
    })

    computeActiveHeading()
  }, [html, theme, computeActiveHeading])

  const renderPendingDiagrams = useCallback(
    async (token: number) => {
      const container = containerRef.current
      if (!container) return

      const nodes = Array.from(container.querySelectorAll<HTMLElement>('.md-mermaid'))
      for (const node of nodes) {
        // 已有更新的任务在跑，让位给它，它会从头处理所有占位块
        if (token !== taskRef.current) return
        if (!node.isConnected || node.dataset.rendered === '1') continue

        const code = decodeMermaidSource(node.getAttribute('data-mermaid'))
        if (!code) continue

        const key = `${theme}::${code}`
        if (failedRef.current.has(key)) {
          node.classList.remove('md-mermaid-loading')
          continue
        }

        try {
          const rendered = await renderMermaidToSvg(code, theme)
          // 先写缓存：即使当前节点已被 React 替换，渲染结果也不会浪费
          cacheDiagram(key, rendered)
          if (token !== taskRef.current || !node.isConnected) continue
          node.innerHTML = rendered.svg
          rendered.bindFunctions?.(node)
          node.dataset.rendered = '1'
          node.classList.remove('md-mermaid-loading')
        } catch (err) {
          failedRef.current.add(key)
          if (failedRef.current.size > 120) failedRef.current.clear()
          if (token !== taskRef.current || !node.isConnected) continue
          const message = err instanceof Error ? err.message : String(err)
          node.innerHTML = `<pre class="md-mermaid-error">图表渲染失败：${escapeHtml(message)}</pre>`
          node.dataset.rendered = '1'
          node.classList.remove('md-mermaid-loading')
        }
      }
    },
    [theme]
  )

  // 源码稳定后再渲染图表（首次进入还需等待 Mermaid chunk 加载）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const token = ++taskRef.current
    const timer = window.setTimeout(() => {
      void renderPendingDiagrams(token)
    }, 180)
    return () => window.clearTimeout(timer)
  }, [html, theme, renderPendingDiagrams])

  // 目录点击：滚动到对应标题
  useEffect(() => {
    const el = containerRef.current
    if (!el || !scrollToHeading) return
    const target = el.querySelector<HTMLElement>(`#${scrollToHeading.id}`)
    if (!target) return

    const delta = target.getBoundingClientRect().top - el.getBoundingClientRect().top
    suppressScrollRef.current = true
    el.scrollTo({ top: el.scrollTop + delta - 12, behavior: 'smooth' })

    const timer = window.setTimeout(() => {
      suppressScrollRef.current = false
      // 跳转结束后重新判定当前章节，让目录高亮跟上
      computeActiveHeading()
    }, 420)
    return () => window.clearTimeout(timer)
  }, [scrollToHeading, computeActiveHeading])

  // 外部（编辑器侧）滚动同步
  useEffect(() => {
    const el = containerRef.current
    if (!el || scrollToRatio === undefined) return
    const max = Math.max(1, el.scrollHeight - el.clientHeight)
    const target = max * scrollToRatio
    if (Math.abs(el.scrollTop - target) < 4) return
    suppressScrollRef.current = true
    el.scrollTop = target
    const timer = window.setTimeout(() => {
      suppressScrollRef.current = false
    }, 60)
    return () => window.clearTimeout(timer)
  }, [scrollToRatio])

  // 卸载时清掉待执行的动画帧
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return
    if (!suppressScrollRef.current && onScrollRatio) {
      const max = Math.max(1, el.scrollHeight - el.clientHeight)
      onScrollRatio(Math.min(1, Math.max(0, el.scrollTop / max)))
    }
    scheduleActiveUpdate()
  }

  return (
    <div
      ref={containerRef}
      className="md-preview"
      onScroll={handleScroll}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default MarkdownPreview
