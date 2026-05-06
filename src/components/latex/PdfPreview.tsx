import React, { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { Spin, Button, Space, message } from 'antd'
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  FilePdfOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// 配置 PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface PdfPreviewProps {
  pdfBlob: Blob | null
  isCompiling: boolean
  compileError?: string | null
  onRetry?: () => void
  // 可选：自定义下载文件名
  downloadFileName?: string
}

const PdfPreview: React.FC<PdfPreviewProps> = ({
  pdfBlob,
  isCompiling,
  compileError,
  onRetry,
  downloadFileName = 'document.pdf', // 默认文件名
}) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [, setLoadError] = useState<string | null>(null)

  // 生成 PDF URL
  React.useEffect(() => {
    if (pdfBlob) {
      // 清理旧的URL
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      const url = URL.createObjectURL(pdfBlob)
      setPdfUrl(url)
      setLoadError(null)
      setPageNumber(1)
      setNumPages(0) // 重置页数

      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPdfUrl(null)
      setNumPages(0)
    }
  }, [pdfBlob])

  // PDF 加载成功
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setLoadError(null)
  }

  // PDF 加载失败
  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error)
    setLoadError('PDF 加载失败，请尝试重新编译')
  }

  // 翻页
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages, prev + 1))
  }

  // 缩放
  const zoomIn = () => {
    setScale(prev => Math.min(3, prev + 0.25))
  }

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25))
  }

  // 下载 PDF
  const handleDownload = () => {
    if (!pdfBlob) {
      message.warning('没有可下载的 PDF 文件')
      return
    }

    try {
      // 创建下载链接
      const url = URL.createObjectURL(pdfBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = downloadFileName
      
      // 触发下载
      document.body.appendChild(link)
      link.click()
      
      // 清理
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      message.success('PDF 下载成功')
    } catch (error) {
      console.error('下载失败:', error)
      message.error('下载失败，请重试')
    }
  }

  // 判断是否可以下载
  const canDownload = !isCompiling && !compileError && pdfBlob

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* 工具栏 */}
      <div
        style={{
          padding: '8px 12px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontWeight: 600, color: '#333' }}>PDF 预览</span>

        <Space size="small">
          {/* 下载按钮 */}
          {canDownload && (
            <Button
              type="text"
              icon={<DownloadOutlined />}
              size="small"
              onClick={handleDownload}
              title="下载 PDF"
            />
          )}
          
          {numPages > 0 && (
            <>
              <Button
                type="text"
                icon={<ZoomOutOutlined />}
                size="small"
                onClick={zoomOut}
                disabled={scale <= 0.5}
              />
              <span style={{ fontSize: 12, minWidth: 50, textAlign: 'center' }}>
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="text"
                icon={<ZoomInOutlined />}
                size="small"
                onClick={zoomIn}
                disabled={scale >= 3}
              />
            </>
          )}
        </Space>
      </div>

      {/* PDF 内容区 */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          justifyContent: 'center',
          padding: 16,
          scrollbarWidth: 'none',
        }}
      >
        {/* 编译中 */}
        {isCompiling && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <Spin size="large" tip="正在编译 LaTeX..." />
            <span style={{ color: '#666', fontSize: 13 }}>编译可能需要几秒钟...</span>
          </div>
        )}

        {/* 编译错误 */}
        {!isCompiling && compileError && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
            <div style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', maxWidth: 300 }}>
              {compileError}
            </div>
            {onRetry && (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                重新编译
              </Button>
            )}
          </div>
        )}

        {/* PDF 预览 */}
        {!isCompiling && !compileError && pdfUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Spin size="small" />
                  <span style={{ color: '#666', fontSize: 13 }}>加载 PDF...</span>
                </div>
              }
              error={
                <div style={{ color: '#ef4444', padding: 16 }}>
                  PDF 加载失败
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div style={{ padding: 20 }}>
                    <Spin tip="加载页面..." />
                  </div>
                }
              />
            </Document>
          </div>
        )}

        {/* 空状态 */}
        {!isCompiling && !compileError && !pdfUrl && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <FilePdfOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <span style={{ color: '#999', fontSize: 14 }}>
              点击「编译」按钮生成 PDF
            </span>
            {onRetry && (
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={onRetry}
              >
                开始编译
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 翻页控制 */}
      {numPages > 0 && (
        <div
          style={{
            padding: '8px 12px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          <Button
            type="text"
            icon={<LeftOutlined />}
            size="small"
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
          />
          <span style={{ fontSize: 13 }}>
            第 {pageNumber} / {numPages} 页
          </span>
          <Button
            type="text"
            icon={<RightOutlined />}
            size="small"
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
          />
        </div>
      )}
    </div>
  )
}

export default PdfPreview
