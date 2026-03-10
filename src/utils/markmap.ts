declare global {
  interface Window {
    markmap: any
    d3: any
    fullscreenElement?: any
    webkitFullscreenElement?: any
    mozFullScreenElement?: any
    msFullscreenElement?: any
  }
}

export interface AiResult {
  markdown: string
  root: any
}

export interface NodeContext {
  lineIndex: number
  prefix: string
}

export const LAST_SUCCESSFUL_MODEL_KEY = 'ai-mindmap-last-successful-model'
export const colorPalette = ['#3B82F6', '#16A34A', '#F97316', '#9333EA', '#E11D48', '#0891B2']

export const waitForLibraries = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(() => {
      if (window.markmap) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 100)
    setTimeout(() => {
      clearInterval(checkInterval)
      reject(new Error('核心库加载超时，请检查网络连接或刷新页面。'))
    }, 10000)
  })
}

export const getNodeColor = (node: any) => {
  if (node.depth === 0) return '#374151'
  const index = (node.depth - 1) % colorPalette.length
  return colorPalette[index]
}

export const getMindmapCssRules = () => {
  let cssText = ''

  // 收集所有 markmap 相关的样式规则
  const relevantSelectors = [
    '.markmap',
    '.markmap text',
    '.markmap g',
    '.markmap path',
    '.markmap line',
    '.markmap circle',
    '.markmap foreignObject',
    '[data-depth]'
  ]

  for (const styleSheet of document.styleSheets) {
    try {
      if (styleSheet.cssRules) {
        for (const rule of styleSheet.cssRules as any) {
          const selectorText = rule.selectorText
          // 包含任何相关选择器的规则都收集
          if (relevantSelectors.some(selector => selectorText?.includes(selector))) {
            cssText += rule.cssText + '\n'
          }
        }
      }
    } catch (e) {
      console.warn('无法读取样式表中的CSS规则:', styleSheet.href, e)
    }
  }

  // 添加内联样式（如果有的话）
  const inlineStyles = document.querySelectorAll('style[data-markmap]')
  inlineStyles.forEach(style => {
    if (style.textContent) {
      cssText += style.textContent
    }
  })

  return cssText
}

export const createExportableSvg = (svgElement: SVGSVGElement) => {
  // 直接使用 SVG 的当前尺寸和 viewBox
  const viewBox = svgElement.viewBox.baseVal
  const rect = svgElement.getBoundingClientRect()

  let viewBoxX = 0
  let viewBoxY = 0
  let viewBoxWidth = rect.width || 800
  let viewBoxHeight = rect.height || 600

  // 如果 SVG 有有效的 viewBox，使用它
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    viewBoxX = viewBox.x
    viewBoxY = viewBox.y
    viewBoxWidth = viewBox.width
    viewBoxHeight = viewBox.height
  }

  // 克隆 SVG
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement

  // 移除动态属性
  svgClone.removeAttribute('style')
  svgClone.removeAttribute('width')
  svgClone.removeAttribute('height')

  // 添加 padding，确保内容不会被裁剪
  const padding = 60
  const finalWidth = viewBoxWidth + padding * 2
  const finalHeight = viewBoxHeight + padding * 2

  // 设置固定尺寸
  svgClone.setAttribute('width', finalWidth.toString())
  svgClone.setAttribute('height', finalHeight.toString())

  // 调整 viewBox 以包含 padding
  svgClone.setAttribute('viewBox', `${viewBoxX - padding} ${viewBoxY - padding} ${finalWidth} ${finalHeight}`)

  // 添加样式
  const style = document.createElement('style')
  style.textContent = getMindmapCssRules()
  svgClone.insertBefore(style, svgClone.firstChild)

  const serializer = new XMLSerializer()
  let svgString = serializer.serializeToString(svgClone)

  // 修复命名空间
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink=').replace(/NS\d+:href/g, 'xlink:href')

  return { svgString, width: finalWidth, height: finalHeight }
}

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateExportFileName = (markdown: string, extension: string) => {
  let topic = 'aimarkmap'
  const lines = markdown.split('\n')
  for (const line of lines) {
    const match = line.match(/^#\s+(.+)/)
    if (match) {
      topic = match[1].replace(/[^\w\u4e00-\u9fa5]/g, '').trim() || 'aimarkmap'
      break
    }
  }

  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')

  return `${topic}_${dateStr}.${extension}`
}

export const collectNodeLines = (node: any, linesSet: Set<number>) => {
  const markmapNode = node.data
  if (markmapNode?.payload?.lines) {
    const [start, end] = markmapNode.payload.lines
    for (let i = start; i < end; i++) {
      linesSet.add(i)
    }
  }
  if (node.children) {
    for (const child of node.children) {
      collectNodeLines(child, linesSet)
    }
  }
}

export const removeContextMenu = () => {
  const existingMenu = document.getElementById('node-context-menu')
  if (existingMenu) {
    existingMenu.remove()
  }
}

export const createContextMenu = (
  event: MouseEvent,
  nodeData: any,
  currentMarkdown: string,
  onEditNode: (originalText: string, lineIndex: number, prefix: string) => void,
  onDeleteNode: (node: any) => void
) => {
  event.preventDefault()
  event.stopPropagation()
  removeContextMenu()

  const { pageX, pageY } = event

  const lines = currentMarkdown.split('\n')
  const lineIndex = nodeData.data?.payload?.lines?.[0]
  if (lineIndex === undefined || lines[lineIndex] === undefined) {
    console.error('Invalid node data for context menu:', nodeData)
    return
  }
  const fullLine = lines[lineIndex]

  const menu = document.createElement('div')
  menu.id = 'node-context-menu'
  menu.className = 'context-menu'
  menu.addEventListener('contextmenu', e => e.preventDefault())

  const editItem = document.createElement('div')
  editItem.className = 'context-menu-item'
  editItem.innerHTML = '✏️ 编辑节点'
  editItem.onclick = (e) => {
    e.stopPropagation()
    removeContextMenu()

    const match = fullLine.match(/^(\s*(?:#+\s*|-\s*|\d+\.\s*))/)
    const prefix = match ? match[0] : ''
    const originalText = nodeData.data.content

    onEditNode(originalText, lineIndex, prefix)
  }
  menu.appendChild(editItem)

  const deleteItem = document.createElement('div')
  deleteItem.className = 'context-menu-item'
  deleteItem.innerHTML = '🗑️ 删除节点'
  deleteItem.onclick = (e) => {
    e.stopPropagation()
    onDeleteNode(nodeData)
    removeContextMenu()
  }
  menu.appendChild(deleteItem)

  document.body.appendChild(menu)

  const menuWidth = menu.offsetWidth
  const menuHeight = menu.offsetHeight
  const { innerWidth, innerHeight } = window

  let left = pageX
  let top = pageY

  if (pageX + menuWidth > innerWidth) {
    left = innerWidth - menuWidth - 5
  }
  if (pageY + menuHeight > innerHeight) {
    top = innerHeight - menuHeight - 5
  }

  menu.style.top = `${top}px`
  menu.style.left = `${left}px`
}
