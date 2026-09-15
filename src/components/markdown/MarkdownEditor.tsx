import React, { useEffect, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { Spin } from 'antd'

type ThemeMode = 'light' | 'dark'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  fileName?: string
  theme: ThemeMode
  /** 查看分享文档时置为只读 */
  readOnly?: boolean
  onScrollRatio?: (ratio: number) => void
  scrollToRatio?: number
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  fileName,
  theme,
  readOnly = false,
  onScrollRatio,
  scrollToRatio,
}) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  // 避免“预览滚动 -> 编辑器滚动”再次触发回传造成抖动
  const suppressScrollRef = useRef(false)
  // onMount 只执行一次，用 ref 持有最新的回调，避免闭包捕获旧的 syncScroll 状态
  const onScrollRatioRef = useRef(onScrollRatio)

  useEffect(() => {
    onScrollRatioRef.current = onScrollRatio
  }, [onScrollRatio])

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor

    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: false },
      wordWrap: 'on',
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontLigatures: true,
      tabSize: 2,
      renderWhitespace: 'selection',
      bracketPairColorization: { enabled: true },
      smoothScrolling: true,
      padding: { top: 12, bottom: 24 },
      readOnly,
    })

    editor.onDidScrollChange(() => {
      if (suppressScrollRef.current) return
      if (!onScrollRatioRef.current) return
      const scrollTop = editor.getScrollTop()
      const max = Math.max(1, editor.getScrollHeight() - editor.getLayoutInfo().height)
      onScrollRatioRef.current(Math.min(1, Math.max(0, scrollTop / max)))
    })
  }

  // 外部（预览侧）滚动同步
  useEffect(() => {
    const ed = editorRef.current
    if (!ed || scrollToRatio === undefined) return
    const max = Math.max(1, ed.getScrollHeight() - ed.getLayoutInfo().height)
    const target = max * scrollToRatio
    if (Math.abs(ed.getScrollTop() - target) < 4) return
    suppressScrollRef.current = true
    ed.setScrollTop(target)
    const timer = window.setTimeout(() => {
      suppressScrollRef.current = false
    }, 60)
    return () => window.clearTimeout(timer)
  }, [scrollToRatio])

  // 文件切换时重置内容
  useEffect(() => {
    const ed = editorRef.current
    if (ed && ed.getValue() !== value) {
      ed.setValue(value)
    }
  }, [value])

  // 主题跟随页面
  useEffect(() => {
    editorRef.current?.updateOptions({ theme: theme === 'dark' ? 'vs-dark' : 'vs' })
  }, [theme])

  // 只读状态（查看分享文档时）
  useEffect(() => {
    editorRef.current?.updateOptions({ readOnly })
  }, [readOnly])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {fileName && (
        <div
          style={{
            padding: '7px 16px',
            background: theme === 'dark' ? '#252529' : '#fafafa',
            borderBottom: `1px solid ${theme === 'dark' ? '#333338' : '#f0f0f0'}`,
            fontSize: 13,
            color: theme === 'dark' ? '#c9cdd2' : '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 500 }}>{fileName}</span>
          <span style={{ color: '#ccc' }}>|</span>
          <span style={{ fontSize: 12, color: theme === 'dark' ? '#8b9096' : '#999' }}>
            Markdown 源码
          </span>
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language="markdown"
          theme={theme === 'dark' ? 'vs-dark' : 'vs'}
          value={value}
          onChange={(v) => onChange(v ?? '')}
          onMount={handleEditorDidMount}
          loading={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin />
            </div>
          }
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  )
}

export default MarkdownEditor
