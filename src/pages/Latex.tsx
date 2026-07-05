import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button, message, Modal, Tooltip, Select, Radio } from 'antd'
import { PlayCircleOutlined, FullscreenOutlined, FileTextOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import FileTree, { type FileTreeRef, type FileNode } from '@/components/latex/FileTree'
import LatexEditor from '@/components/latex/LatexEditor'
import PdfPreview from '@/components/latex/PdfPreview'
import { compileLatex } from '@/services/latexApi'

// 英文模板
const ENGLISH_TEMPLATE = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath}
\\usepackage{graphicx}
\\usepackage{float}
\\title{My First LaTeX Document}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This is a sample LaTeX document for testing.

\\section{Mathematical Formulas}
The famous Euler's formula:
\\begin{equation}
e^{i\\pi} + 1 = 0
\\end{equation}

Einstein's mass-energy equivalence:
\\begin{equation}
E = mc^2
\\end{equation}

\\section{Lists}
\\begin{itemize}
  \\item First item
  \\item Second item
  \\item Third item
\\end{itemize}

\\section{Conclusion}
This document demonstrates some basic LaTeX features.

\\end{document}`

// 中文模板
const CHINESE_TEMPLATE = `\\documentclass[UTF8]{ctexart}
\\usepackage{xeCJK}
\\setCJKmainfont{Noto Sans CJK SC}
\\usepackage{graphicx}
\\usepackage{float}
\\title{我的第一篇 LaTeX 文档}
\\author{Your Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{简介}
这是使用 LaTeX 编写的示例文档。

\\section{数学公式}
著名的欧拉公式:
\\begin{equation}
e^{i\\pi} + 1 = 0
\\end{equation}

爱因斯坦质能方程:
\\begin{equation}
E = mc^2
\\end{equation}

\\section{列表}
\\begin{itemize}
  \\item 第一项
  \\item 第二项
  \\item 第三项
\\end{itemize}

\\section{结论}
本文档展示了 LaTeX 的一些基本功能。

\\end{document}`

const Latex: React.FC = () => {
  // 状态管理
  const [selectedFileKey, setSelectedFileKey] = useState<string | null>('main')
  const [selectedFileName, setSelectedFileName] = useState<string>('main.tex')
  const [editorContent, setEditorContent] = useState<string>('')
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [isCompiling, setIsCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [compiler, setCompiler] = useState<'xelatex' | 'pdflatex' | 'lualatex'>('xelatex')
  const [isImage, setIsImage] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageFiles, setImageFiles] = useState<Array<{ key: string; name: string; blob: Blob }>>([])
  
  // 移动端视图切换：'files' | 'editor' | 'preview'
  const [mobileView, setMobileView] = useState<'files' | 'editor' | 'preview'>('editor')

  // 防抖定时器
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  // FileTree ref，用于调其 replaceTree
  const fileTreeRef = useRef<FileTreeRef>(null)

  // 初始加载默认内容
  useEffect(() => {
    // 持久化模板到 localStorage（zip 上传会清空，这里每次进入页面重置一次）
    localStorage.setItem('latex-chinese-template', CHINESE_TEMPLATE)
    localStorage.setItem('latex-english-template', ENGLISH_TEMPLATE)

    // 检查是否有保存的文件内容，如果有则加载，否则使用模板
    const savedContent = localStorage.getItem('latex-file-main')
    if (savedContent) {
      setEditorContent(savedContent)
    } else {
      setEditorContent(ENGLISH_TEMPLATE)
    }
  }, [])

  // 编译 LaTeX
  const handleCompile = useCallback(async (code?: string) => {
    const codeToCompile = code ?? editorContent

    if (!codeToCompile.trim()) {
      message.warning('请输入 LaTeX 代码')
      return
    }

    setIsCompiling(true)
    setCompileError(null)
    setPdfBlob(null) // 清除旧的PDF缓存

    try {
      // 将图片文件转换为 base64 格式
      const filesArray = await Promise.all(
        imageFiles.map(async (img) => {
          const base64 = await blobToBase64(img.blob)
          return {
            name: img.name,
            content: base64
          }
        })
      )

      console.log('编译时包含的图片文件:', imageFiles.map(f => f.name))

      const result = await compileLatex({ code: codeToCompile, compiler, files: filesArray })

      if (result.success && result.pdfBlob) {
        setPdfBlob(result.pdfBlob)
        message.success('编译成功')

        // 编译成功后自动切换到预览视图（移动端）
        if (window.innerWidth < 700) {
          setMobileView('preview')
        }
      } else {
        // 不向后端原始错误暴露给用户，统一展示友好提示
        console.warn('LaTeX 编译失败（后端返回）:', result.error)
        const friendlyError = '当前 LaTeX 编译超时，请联系管理员开通会员'
        setCompileError(friendlyError)
        message.error(friendlyError)
      }
    } catch (err) {
      // 异常情况同样不暴露原始错误
      console.warn('LaTeX 编译请求异常:', err)
      const friendlyError = '当前 LaTeX 编译超时，请联系管理员开通会员'
      setCompileError(friendlyError)
      message.error(friendlyError)
    } finally {
      setIsCompiling(false)
    }
  }, [editorContent, compiler, imageFiles])

  // 辅助函数：将 Blob 转换为 base64 格式
  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        // 保留完整的 data URI 格式
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // 文件树选择
  const handleSelectFile = useCallback((key: string, content: string, imageBlob?: Blob) => {
    console.log('imageBlob:', imageBlob)
    // 先保存当前编辑内容到 localStorage
    if (selectedFileKey && editorContent) {
      localStorage.setItem(`latex-file-${selectedFileKey}`, editorContent)
    }

    setSelectedFileKey(key)

    // 检查是否为图片文件（以 IMAGE: 开头）
    if (content.startsWith('IMAGE:')) {
      // 是图片文件
      const imageData = content.substring(6) // 去掉 "IMAGE:" 前缀
      setIsImage(true)
      setImageUrl(imageData)
      setEditorContent('') // 清空编辑器内容
      setSelectedFileName(key.split('-').pop() || 'image.png')
    } else {
      // 是文本文件
      setIsImage(false)
      setImageUrl('')
    
      // 从 localStorage 读取文件内容
      const savedContent = localStorage.getItem(`latex-file-${key}`)
      const fileContent = savedContent ?? content
    
      setEditorContent(fileContent)
      console.log('fileContent', key)
      setSelectedFileName('文本文件')
    }
    
    // 移动端选择文件后切换到编辑器视图
    if (window.innerWidth < 700) {
      setMobileView('editor')
    }
  }, [selectedFileKey, editorContent])

  // 在文件树中查找指定标题的文件
  const findNodeByTitle = useCallback((nodes: FileNode[], title: string): FileNode | null => {
    for (const n of nodes) {
      if (n.title.toLowerCase() === title) return n
      if (n.children) {
        const r = findNodeByTitle(n.children, title)
        if (r) return r
      }
    }
    return null
  }, [])

  // 找到第一个 .tex 文件
  const findFirstTex = useCallback((nodes: FileNode[]): FileNode | null => {
    for (const n of nodes) {
      if (n.type === 'tex') return n
      if (n.children) {
        const r = findFirstTex(n.children)
        if (r) return r
      }
    }
    return null
  }, [])

  // 处理 zip 上传完成后的替代流程
  const handleZipUploaded = useCallback((rootNodes: FileNode[]) => {
    // 0. 先校验：解压后必须存在 .tex 文件，否则弹窗提示并不做任何改动
    const entry =
      findNodeByTitle(rootNodes, 'main.tex') ||
      findNodeByTitle(rootNodes, 'index.tex') ||
      findFirstTex(rootNodes)

    if (!entry) {
      Modal.warning({
        title: '格式不正确',
        content: '请上传符合 LaTeX 格式的文件夹压缩包',
        okText: '我知道了',
      })
      return
    }

    // 1. 清理所有相关的 localStorage（保留模板本身，模板从常量读取）
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (
        k &&
        (k.startsWith('latex-file-') ||
          k.startsWith('latex-image-') ||
          k === 'latex-file-tree-v3')
      ) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    // 2. 用 FileTree 的 replaceTree 替代文件树
    fileTreeRef.current?.replaceTree(rootNodes)

    // 3. 重置本地状态
    setImageFiles([])
    setPdfBlob(null)
    setCompileError(null)
    setIsImage(false)
    setImageUrl('')
    setSelectedFileKey(null)
    setSelectedFileName('')
    setEditorContent('')

    // 4. 选中入口文件并加载
    if (window.innerWidth < 700) {
      setMobileView('editor')
    }

    if (entry.type === 'image') {
      const url = entry.imageUrl || (entry.imageBlob ? URL.createObjectURL(entry.imageBlob) : '')
      setSelectedFileKey(entry.key)
      setSelectedFileName(entry.title)
      setIsImage(true)
      setImageUrl(url)
    } else {
      const content = entry.content || ''
      setSelectedFileKey(entry.key)
      setSelectedFileName(entry.title)
      setEditorContent(content)
    }
    message.success(`已加载压缩包，入口：${entry.title}`)
  }, [findNodeByTitle, findFirstTex])

  // 应用模板：清空文件树，重建为单个 main.tex 并展示模板内容
  const applyTemplate = useCallback((templateKey: 'english' | 'chinese') => {
    const content = templateKey === 'english' ? ENGLISH_TEMPLATE : CHINESE_TEMPLATE

    // 1. 清理所有相关的 localStorage（保留模板本身）
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (
        k &&
        (k.startsWith('latex-file-') ||
          k.startsWith('latex-image-') ||
          k === 'latex-file-tree-v3')
      ) {
        keysToRemove.push(k)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))

    // 2. 用单个 main.tex 替代文件树
    const newNode: FileNode = {
      key: 'main',
      title: 'main.tex',
      type: 'tex',
      content,
    }
    fileTreeRef.current?.replaceTree([newNode])

    // 3. 重置本地状态
    setImageFiles([])
    setPdfBlob(null)
    setCompileError(null)
    setIsImage(false)
    setImageUrl('')

    // 4. 选中并加载模板到编辑器
    setSelectedFileKey('main')
    setSelectedFileName('main.tex')
    setEditorContent(content)
    localStorage.setItem('latex-file-main', content)

    if (window.innerWidth < 700) {
      setMobileView('editor')
    }

    if (templateKey === 'english') {
      message.success('已切换到英文模板')
    } else {
      message.warning('中文模板：编译可能需要更多时间，且显示效果取决于服务器字体支持')
    }
  }, [])

  // 全屏切换
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // 监听窗口大小变化
  const [isMobile, setIsMobile] = useState(window.innerWidth < 700)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 700)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 自动保存文件内容到 localStorage
  useEffect(() => {
    if (selectedFileKey && editorContent && !isImage) {
      localStorage.setItem(`latex-file-${selectedFileKey}`, editorContent)
    }
  }, [selectedFileKey, editorContent, isImage])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        background: '#fff',
      }}
    >
      {/* 顶部工具栏 */}
      <div
        style={{
          padding: '8px 16px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
            LaTeX 编辑器
          </span>
          {!isMobile && selectedFileName && (
            <span style={{ fontSize: 12, color: '#999' }}>
              {selectedFileName}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMobile && (
            <>
              <Button
                size="small"
                onClick={() => applyTemplate('english')}
              >
                英文模板
              </Button>

              <Button
                size="small"
                onClick={() => applyTemplate('chinese')}
              >
                中文模板
              </Button>
            </>
          )}

          <Select
            value={compiler}
            onChange={(value) => setCompiler(value)}
            style={{ width: isMobile ? 100 : 120 }}
            size="small"
          >
            <Select.Option value="xelatex">XeLaTeX</Select.Option>
            <Select.Option value="pdflatex">PDFLaTeX</Select.Option>
            <Select.Option value="lualatex">LuaLaTeX</Select.Option>
          </Select>

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={() => handleCompile()}
            loading={isCompiling}
            size={isMobile ? "small" : "middle"}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
            }}
          >
            编译
          </Button>

          <Tooltip title={isFullscreen ? '退出全屏' : '全屏'}>
            <Button
              icon={<FullscreenOutlined />}
              onClick={toggleFullscreen}
              size={isMobile ? "small" : "middle"}
            />
          </Tooltip>
        </div>
      </div>

      {/* 三栏布局 - 响应式 */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative', minHeight: 0 }}>
        {/* 左侧文件树 - PC端固定显示 */}
        {!isMobile && (
          <div
            style={{
              width: 240,
              borderRight: '1px solid #f0f0f0',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            <FileTree
              ref={fileTreeRef}
              selectedKey={selectedFileKey}
              onSelectFile={handleSelectFile}
              onImagesChange={setImageFiles}
              onZipUploaded={handleZipUploaded}
            />
          </div>
        )}

        {/* 移动端文件树视图 */}
        {isMobile && mobileView === 'files' && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            <FileTree
              ref={fileTreeRef}
              selectedKey={selectedFileKey}
              onSelectFile={handleSelectFile}
              onImagesChange={setImageFiles}
              onZipUploaded={handleZipUploaded}
            />
          </div>
        )}

        {/* 中间编辑器 - PC端固定显示，移动端根据视图切换 */}
        {!isMobile && (
          <div
            style={{
              flex: 1,
              height: '100%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            {isImage ? (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5'
              }}>
                <img
                  src={imageUrl}
                  alt="预览"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <LatexEditor
                value={editorContent}
                onChange={setEditorContent}
                fileName={selectedFileName}
              />
            )}
          </div>
        )}

        {/* 移动端编辑器视图 */}
        {isMobile && mobileView === 'editor' && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            {isImage ? (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f5f5f5'
              }}>
                <img
                  src={imageUrl}
                  alt="预览"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ) : (
              <LatexEditor
                value={editorContent}
                onChange={setEditorContent}
                fileName={selectedFileName}
              />
            )}
          </div>
        )}

        {/* 右侧 PDF 预览 - PC端固定显示 */}
        {!isMobile && (
          <div
            style={{
              width: '45%',
              minWidth: 300,
              height: '100%',
              borderLeft: isMobile ? 'none' : '1px solid #f0f0f0',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: isMobile ? 'absolute' : 'relative',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#fff',
              zIndex: isMobile && mobileView !== 'preview' ? 5 : 10
            }}
          >
            <PdfPreview
              pdfBlob={pdfBlob}
              isCompiling={isCompiling}
              compileError={compileError}
              onRetry={() => handleCompile()}
              downloadFileName="Latex-Document.pdf"
            />
          </div>
        )}

        {/* 移动端预览视图 */}
        {isMobile && mobileView === 'preview' && (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}
          >
            <PdfPreview
              pdfBlob={pdfBlob}
              isCompiling={isCompiling}
              compileError={compileError}
              onRetry={() => handleCompile()}
              downloadFileName="Latex-Document.pdf"
            />
          </div>
        )}
      </div>

      {/* 移动端底部导航栏 */}
      {isMobile && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            padding: '8px 16px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
            zIndex: 25,
            position: 'relative'
          }}
        >
          <Radio.Group
            value={mobileView}
            onChange={(e) => setMobileView(e.target.value)}
            optionType="button"
            buttonStyle="solid"
            size="small"
            className="bg-white rounded-lg flex w-full"
            style={{ display: 'flex', width: '100%' }}
          >
            <Radio.Button value="files" className="flex-1 text-center" style={{ flex: 1 }}>
              <FileTextOutlined /> 文件
            </Radio.Button>
            <Radio.Button value="editor" className="flex-1 text-center" style={{ flex: 1 }}>
              <EditOutlined /> 编辑
            </Radio.Button>
            <Radio.Button value="preview" className="flex-1 text-center" style={{ flex: 1 }}>
              <EyeOutlined /> 预览
            </Radio.Button>
          </Radio.Group>
        </div>
      )}
    </div>
  )
}

export default Latex