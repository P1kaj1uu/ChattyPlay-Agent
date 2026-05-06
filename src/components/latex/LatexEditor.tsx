import React, { useEffect, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { Spin } from 'antd'

interface LatexEditorProps {
  value: string
  onChange: (value: string) => void
  fileName?: string
}

const LatexEditor: React.FC<LatexEditorProps> = ({ value, onChange, fileName }) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  // 编辑器挂载完成
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // 注册 LaTeX 语言（如果 Monaco 内置没有）
    if (!monaco.languages.getLanguages().some((lang: { id: string }) => lang.id === 'latex')) {
      monaco.languages.register({ id: 'latex' })

      // LaTeX 语法高亮规则
      monaco.languages.setMonarchTokensProvider('latex', {
        tokenizer: {
          root: [
            // 注释
            [/%.*$/, 'comment'],
            // 命令以 \ 开头
            [/\\[a-zA-Z]+/, 'keyword'],
            [/\\[^a-zA-Z]/, 'keyword'],
            // 环境
            [/\\begin\{[^}]+\}/, 'keyword'],
            [/\\end\{[^}]+\}/, 'keyword'],
            // 大括号内容
            [/\{[^}]*\}/, 'string'],
            // 编译指令
            [/\\(?:documentclass|usepackage|begin|end|author|title|date|bibliography)/, 'keyword'],
            // 数学模式
            [/\$\$/, { token: 'delimiter', bracket: '@open', next: '@mathDisplay' }],
            [/\$/, { token: 'delimiter', bracket: '@open', next: '@mathInline' }],
            // 普通文本
            [/[\[\]]/, 'string'],
          ],
          mathDisplay: [
            [/\$\$/, { token: 'delimiter', bracket: '@close', next: '@pop' }],
            [/./, 'number'],
          ],
          mathInline: [
            [/\$/, { token: 'delimiter', bracket: '@close', next: '@pop' }],
            [/./, 'number'],
          ],
        },
      })

      // LaTeX 主题定义（可选）
      monaco.editor.defineTheme('latexTheme', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'keyword', foreground: '667eea', fontStyle: 'bold' },
          { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
          { token: 'string', foreground: '10b981' },
          { token: 'number', foreground: 'f59e0b' },
        ],
        colors: {},
      })
    }

    // 设置编辑器选项
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
    })

    // 聚焦编辑器
    editor.focus()
  }

  // 内容变化处理
  const handleEditorChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue)
    }
  }

  // 监听 value 变化（文件切换时）
  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== value) {
        editorRef.current.setValue(value)
      }
    }
  }, [value])

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 文件标签 */}
      {fileName && (
        <div
          style={{
            padding: '8px 16px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
            fontSize: 13,
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 500 }}>{fileName}</span>
          <span style={{ color: '#ccc' }}>|</span>
          <span style={{ fontSize: 12 }}>.tex, .bib, .cls, .txt 等文本文件</span>
        </div>
      )}

      {/* 编辑器 */}
      <div style={{ flex: 1 }}>
        <Editor
          height="100%"
          language="latex"
          value={value}
          onChange={handleEditorChange}
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

export default LatexEditor
