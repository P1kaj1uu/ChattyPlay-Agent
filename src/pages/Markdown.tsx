import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Drawer, Dropdown, Input, Modal, Radio, Switch, Tooltip, message } from 'antd'
import type { MenuProps } from 'antd'
import {
  BulbOutlined,
  CloseOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FileAddOutlined,
  FolderOpenOutlined,
  LinkOutlined,
  PrinterOutlined,
  RetweetOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import MarkdownEditor from '@/components/markdown/MarkdownEditor'
import MarkdownPreview from '@/components/markdown/MarkdownPreview'
import TableOfContents from '@/components/markdown/TableOfContents'
import { buildStandaloneHtml, renderMarkdown, type ThemeMode } from '@/utils/markdown'
import { buildShareUrl, clearShareHash, readShareDocFromHash } from '@/utils/markdownShare'
import 'katex/dist/katex.min.css'

const DOC_KEY = 'markdown-doc'
const THEME_KEY = 'markdown-theme'

/** 默认欢迎文档：覆盖 Markdown 常用排版、代码高亮、KaTeX 公式与 Mermaid 图表 */
const WELCOME_DOC = `# Markdown 编辑器

左侧编写 Markdown，右侧**实时预览**；文档只保存在你的浏览器里，无需注册。

## 支持的语法

- **粗体**、*斜体*、~~删除线~~、\`行内代码\`
- [超链接](https://markview.art)
- 任务列表
  - [x] 实时预览
  - [x] 代码高亮
  - [ ] 你的下一步

> 引用块：把想法写下来，比记住它更可靠。

## 代码高亮

\`\`\`ts
export function greet(name: string): string {
  // 自动识别语言并高亮
  return \`Hello, \${name}!\`
}
\`\`\`

## 数学公式（KaTeX）

行内公式：质能方程 $E = mc^2$，欧拉恒等式 $e^{i\\pi} + 1 = 0$。

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}
$$

## 表格

| 功能 | 语法 | 状态 |
| --- | --- | --- |
| 公式 | \`$...$\` | ✅ |
| 图表 | \`\`\`mermaid | ✅ |
| 导出 | .md / .html / PDF | ✅ |

## 流程图（Mermaid）

\`\`\`mermaid
flowchart LR
  A[编写 Markdown] --> B{实时预览}
  B -->|满意| C[导出 PDF]
  B -->|继续改| A
\`\`\`

\`\`\`mermaid
sequenceDiagram
  participant U as 用户
  participant E as 编辑器
  participant P as 预览
  U->>E: 输入 Markdown
  E->>P: 实时渲染
  P-->>U: 公式 / 图表 / 高亮
\`\`\`

## 目录与分享

- 点工具栏的**目录**按钮，右侧会展开大纲；点标题即可跳转，滚动时自动高亮当前章节。
- 点工具栏的**分享**按钮，整篇文档会被压缩进链接里，对方打开即可只读查看。

---

开始编辑这份文档吧，内容会自动保存。
`

const MarkdownPage: React.FC = () => {
  // 打开分享链接时文档内容在 hash 里，进入只读查看模式
  const [shareDoc, setShareDoc] = useState<string | null>(() => readShareDocFromHash())

  const [source, setSource] = useState<string>(() => {
    if (shareDoc !== null) return shareDoc
    try {
      return localStorage.getItem(DOC_KEY) ?? WELCOME_DOC
    } catch {
      return WELCOME_DOC
    }
  })
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch { /* ignore */ }
    return 'light'
  })
  const [syncScroll, setSyncScroll] = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700)
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor')

  // 目录
  const [showToc, setShowToc] = useState(false)
  const [tocDrawerOpen, setTocDrawerOpen] = useState(false)
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)
  const [scrollTarget, setScrollTarget] = useState<{ id: string; ts: number } | null>(null)

  // 分享
  const [shareOpen, setShareOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const isSharedView = shareDoc !== null

  // 双向同步滚动：只把“主动滚动的一侧”的比例传给另一侧
  const [previewRatio, setPreviewRatio] = useState<number | undefined>(undefined)
  const [editorRatio, setEditorRatio] = useState<number | undefined>(undefined)
  const lastRatioRef = useRef<{ editor: number; preview: number }>({ editor: 0, preview: 0 })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 一次渲染同时产出 HTML 与目录数据，两者同源，标题锚点天然一致
  const { html, headings } = useMemo(() => renderMarkdown(source), [source])

  // 窗口尺寸监听
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 700)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 自动保存（防抖）。查看分享文档时不写回本地，否则会覆盖自己的文档
  useEffect(() => {
    if (isSharedView) return
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(DOC_KEY, source)
      } catch { /* 容量超限时忽略 */ }
    }, 300)
    return () => window.clearTimeout(timer)
  }, [source, isSharedView])

  // 主题持久化
  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch { /* ignore */ }
  }, [theme])

  const handleEditorScroll = useCallback(
    (ratio: number) => {
      if (!syncScroll) return
      if (Math.abs(ratio - lastRatioRef.current.preview) < 0.005) return
      lastRatioRef.current.preview = ratio
      setPreviewRatio(ratio)
    },
    [syncScroll]
  )

  const handlePreviewScroll = useCallback(
    (ratio: number) => {
      if (!syncScroll) return
      if (Math.abs(ratio - lastRatioRef.current.editor) < 0.005) return
      lastRatioRef.current.editor = ratio
      setEditorRatio(ratio)
    },
    [syncScroll]
  )

  const stats = useMemo(() => {
    const chars = source.length
    const lines = source ? source.split('\n').length : 0
    const words = source.trim() ? source.trim().split(/\s+/).length : 0
    return { chars, lines, words }
  }, [source])

  // 文档标题：首个一级标题，否则 'markdown-document'
  const docTitle = useMemo(() => {
    const match = /^\s*#\s+(.+)$/m.exec(source)
    return match ? match[1].trim() : 'markdown-document'
  }, [source])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /** 导出 .md 源文件 */
  const exportMarkdown = useCallback(() => {
    const safeName = docTitle.replace(/[\\/:*?"<>|]/g, '_') || 'markdown-document'
    downloadBlob(new Blob([source], { type: 'text/markdown;charset=utf-8' }), `${safeName}.md`)
    message.success('已导出 Markdown 文件')
  }, [source, docTitle])

  /**
   * 导出 .html：直接取预览容器的渲染结果，
   * 这样 KaTeX 公式与已渲染的 Mermaid SVG 都能一起带走
   */
  const exportHtml = useCallback(() => {
    const rendered = document.querySelector('.md-preview')?.innerHTML
    if (!rendered) {
      message.warning('预览尚未就绪，请稍后重试')
      return
    }
    const html = buildStandaloneHtml(docTitle, rendered, theme)
    downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8' }), `${docTitle}.html`)
    message.success('已导出 HTML 文件')
  }, [docTitle, theme])

  /** 导出 PDF：走浏览器打印，打印样式只保留预览区域 */
  const exportPdf = useCallback(() => {
    message.info('在打印窗口中选择「另存为 PDF」即可导出')
    const root = document.documentElement
    // data-md-print 让打印样式只作用于本页的预览区域
    root.setAttribute('data-md-print', '')

    const cleanup = () => {
      root.removeAttribute('data-md-print')
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)

    window.setTimeout(() => {
      try {
        window.print()
      } finally {
        // 部分浏览器不触发 afterprint，这里兜底清理
        window.setTimeout(cleanup, 1000)
      }
    }, 120)
  }, [])

  /** 导入本地 .md / .markdown / .txt 文件 */
  const handleImportFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setSource(String(reader.result ?? ''))
      message.success(`已导入 ${file.name}`)
    }
    reader.onerror = () => message.error('文件读取失败')
    reader.readAsText(file, 'utf-8')
  }, [])

  const handleClear = useCallback(() => {
    Modal.confirm({
      title: '清空当前文档？',
      content: '清空后无法恢复，已保存的内容将被移除。',
      okText: '清空',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        setSource(WELCOME_DOC)
        message.success('已重置为示例文档')
      },
    })
  }, [])

  // ---------- 目录 ----------

  /** 点击目录项：跳转到预览中的对应标题 */
  const handleSelectHeading = useCallback(
    (id: string) => {
      setScrollTarget({ id, ts: Date.now() })
      if (isMobile) {
        // 移动端编辑与预览是互斥视图，先切到预览再定位
        setMobileView('preview')
        setTocDrawerOpen(false)
      }
    },
    [isMobile]
  )

  const handleToggleToc = useCallback(() => {
    if (isMobile) {
      setTocDrawerOpen((open) => !open)
    } else {
      setShowToc((open) => !open)
    }
  }, [isMobile])

  // ---------- 分享 ----------

  /** 把当前文档压缩进链接 */
  const handleShare = useCallback(() => {
    setShareUrl(buildShareUrl(source))
    setShareOpen(true)
  }, [source])

  const handleCopyShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      message.success('链接已复制到剪贴板')
    } catch {
      // 非安全上下文或没有剪贴板权限时的兜底方案
      try {
        const textarea = document.createElement('textarea')
        textarea.value = shareUrl
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        message.success('链接已复制到剪贴板')
      } catch {
        message.error('复制失败，请手动选中链接复制')
      }
    }
  }, [shareUrl])

  /** 把分享的文档存为自己的文档（同时解除只读） */
  const handleSaveSharedToMine = useCallback(() => {
    try {
      localStorage.setItem(DOC_KEY, source)
    } catch { /* 容量超限时忽略 */ }
    clearShareHash()
    setShareDoc(null)
    message.success('已保存到我的文档，现在可以编辑了')
  }, [source])

  /** 退出分享查看，回到自己的文档 */
  const handleExitSharedView = useCallback(() => {
    clearShareHash()
    setShareDoc(null)
    try {
      setSource(localStorage.getItem(DOC_KEY) ?? WELCOME_DOC)
    } catch {
      setSource(WELCOME_DOC)
    }
    message.success('已返回我的文档')
  }, [])

  const exportMenu: MenuProps['items'] = [
    { key: 'md', icon: <DownloadOutlined />, label: '导出 Markdown (.md)' },
    { key: 'html', icon: <DownloadOutlined />, label: '导出 HTML (.html)' },
    { key: 'pdf', icon: <PrinterOutlined />, label: '导出 PDF（打印）' },
  ]

  const toolbarBg = theme === 'dark' ? '#252529' : '#fafafa'
  const toolbarBorder = theme === 'dark' ? '#333338' : '#f0f0f0'
  const textColor = theme === 'dark' ? '#e6e6e6' : '#333'
  const subtleColor = theme === 'dark' ? '#9ba1a6' : '#999'
  const editorBg = theme === 'dark' ? '#1e1e21' : '#fff'

  const editorNode = (
    <MarkdownEditor
      value={source}
      onChange={setSource}
      fileName={isSharedView ? 'shared.md（只读）' : 'document.md'}
      theme={theme}
      readOnly={isSharedView}
      onScrollRatio={handleEditorScroll}
      scrollToRatio={editorRatio}
    />
  )

  const previewNode = (
    <MarkdownPreview
      html={html}
      theme={theme}
      onScrollRatio={handlePreviewScroll}
      scrollToRatio={previewRatio}
      onActiveHeadingChange={setActiveHeadingId}
      scrollToHeading={scrollTarget}
    />
  )

  const tocNode = (
    <TableOfContents headings={headings} activeId={activeHeadingId} onSelect={handleSelectHeading} />
  )

  return (
    <div
      data-md-theme={theme}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        background: editorBg,
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '8px 16px',
          background: toolbarBg,
          borderBottom: `1px solid ${toolbarBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: textColor }}>Markdown 编辑器</span>
          {!isMobile && (
            <span style={{ fontSize: 12, color: subtleColor }}>
              {stats.lines} 行 · {stats.words} 词 · {stats.chars} 字符 · 自动保存中
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {!isMobile && (
            <Tooltip title="编辑与预览同步滚动">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: subtleColor }}>
                <RetweetOutlined />
                同步滚动
                <Switch size="small" checked={syncScroll} onChange={setSyncScroll} />
              </span>
            </Tooltip>
          )}

          <Tooltip title={(!isMobile && showToc) || tocDrawerOpen ? '收起目录' : '展开目录'}>
            <Button
              size={isMobile ? 'small' : 'middle'}
              icon={<UnorderedListOutlined />}
              type={!isMobile && showToc ? 'primary' : 'default'}
              onClick={handleToggleToc}
            />
          </Tooltip>

          <Tooltip title="生成分享链接">
            <Button
              size={isMobile ? 'small' : 'middle'}
              icon={<LinkOutlined />}
              onClick={handleShare}
            />
          </Tooltip>

          <Tooltip title={theme === 'dark' ? '切换到浅色主题' : '切换到深色主题'}>
            <Button
              size={isMobile ? 'small' : 'middle'}
              icon={<BulbOutlined />}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            />
          </Tooltip>

          {/* 查看分享文档时不提供导入/重置，避免覆盖来源不明的内容 */}
          {!isMobile && !isSharedView && (
            <>
              <Tooltip title="导入本地 Markdown 文件">
                <Button
                  size="middle"
                  icon={<FolderOpenOutlined />}
                  onClick={() => fileInputRef.current?.click()}
                />
              </Tooltip>

              <Tooltip title="重置为示例文档">
                <Button size="middle" icon={<FileAddOutlined />} onClick={handleClear} />
              </Tooltip>
            </>
          )}

          <Dropdown
            menu={{
              items: exportMenu,
              onClick: ({ key }) => {
                if (key === 'md') exportMarkdown()
                else if (key === 'html') exportHtml()
                else exportPdf()
              },
            }}
            placement="bottomRight"
          >
            <Button
              type="primary"
              size={isMobile ? 'small' : 'middle'}
              icon={<DownloadOutlined />}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
              }}
            >
              导出
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* 隐藏的文件选择框 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImportFile(file)
          e.target.value = ''
        }}
      />

      {/* 分享查看提示条 */}
      {isSharedView && (
        <div className="md-share-banner">
          <span className="md-share-banner-text">
            <LinkOutlined /> 你正在查看别人分享的文档（只读）
          </span>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto', flexWrap: 'wrap' }}>
            <Button
              size="small"
              type="primary"
              onClick={handleSaveSharedToMine}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
            >
              保存到我的文档
            </Button>
            <Button size="small" onClick={handleExitSharedView}>
              返回我的文档
            </Button>
          </div>
        </div>
      )}

      {/* 主体：左编辑 右预览（展开目录时右侧再挂一栏） */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
        {!isMobile && (
          <>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {editorNode}
            </div>
            <div
              style={{
                width: showToc ? '36%' : '46%',
                minWidth: 280,
                borderLeft: `1px solid ${toolbarBorder}`,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: theme === 'dark' ? '#1e1e21' : '#fff',
              }}
            >
              {previewNode}
            </div>
            {showToc && (
              <aside className="md-toc-panel" style={{ width: 240, flexShrink: 0 }}>
                <div className="md-toc-head">
                  <span>目录</span>
                  <Tooltip title="收起目录">
                    <Button
                      type="text"
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => setShowToc(false)}
                    />
                  </Tooltip>
                </div>
                {tocNode}
              </aside>
            )}
          </>
        )}

        {isMobile && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {mobileView === 'editor' ? editorNode : previewNode}
          </div>
        )}
      </div>

      {/* 移动端底部切换 */}
      {isMobile && (
        <div
          style={{
            padding: '8px 16px',
            background: theme === 'dark' ? '#252529' : '#fff',
            borderTop: `1px solid ${toolbarBorder}`,
            flexShrink: 0,
          }}
        >
          <Radio.Group
            value={mobileView}
            onChange={(e) => setMobileView(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
            style={{ display: 'flex', width: '100%' }}
          >
            <Radio.Button value="editor" style={{ flex: 1, textAlign: 'center' }}>
              <EditOutlined /> 编辑
            </Radio.Button>
            <Radio.Button value="preview" style={{ flex: 1, textAlign: 'center' }}>
              <EyeOutlined /> 预览
            </Radio.Button>
          </Radio.Group>
        </div>
      )}

      {/* 分享链接弹窗 */}
      <Modal
        title="分享链接"
        open={shareOpen}
        onCancel={() => setShareOpen(false)}
        footer={[
          <Button
            key="copy"
            type="primary"
            onClick={handleCopyShareUrl}
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
          >
            复制链接
          </Button>,
          <Button key="close" onClick={() => setShareOpen(false)}>
            关闭
          </Button>,
        ]}
      >
        <p style={{ marginTop: 0, fontSize: 13, color: '#888' }}>
          整篇文档已压缩进链接，对方打开即可只读查看；内容不会上传到服务器。
        </p>
        <Input.TextArea
          value={shareUrl}
          readOnly
          autoSize={{ minRows: 3, maxRows: 8 }}
          onFocus={(e) => e.target.select()}
        />
        <p
          style={{
            marginBottom: 0,
            fontSize: 12,
            color: shareUrl.length > 8000 ? '#e11d48' : '#999',
          }}
        >
          链接长度 {shareUrl.length} 字符
          {shareUrl.length > 8000
            ? '，偏长，部分聊天工具可能会截断，建议改用「导出 HTML」'
            : '；接收者需要登录后才能打开'}
        </p>
      </Modal>

      {/* 移动端目录抽屉 */}
      <Drawer
        title="目录"
        placement="right"
        width={280}
        open={tocDrawerOpen}
        onClose={() => setTocDrawerOpen(false)}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        <div className="md-toc-panel" style={{ borderLeft: 'none', flex: 1, height: 'auto' }}>
          {tocNode}
        </div>
      </Drawer>
    </div>
  )
}

export default MarkdownPage
