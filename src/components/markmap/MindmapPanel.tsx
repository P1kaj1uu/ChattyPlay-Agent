import React from 'react'
import { Button } from 'antd'
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  FileImageOutlined,
  FileOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  CompressOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface MindmapPanelProps {
  mindmapContainerRef: React.RefObject<HTMLDivElement>
  mindmapSvgRef: React.RefObject<SVGSVGElement>
  isLoading: boolean
  timerSeconds: number
  statusMessage: string
  isFullscreen: boolean
  aiResults: Array<{ markdown: string }>
  activeResultIndex: number
  zoomLevel: number
  onToggleFullscreen: () => void
  onExportSVG: () => void
  onExportPNG: () => void
  onSwitchVersion: (index: number) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  currentMobilePanel: 'editor' | 'mindmap'
}

const MindmapPanel: React.FC<MindmapPanelProps> = ({
  mindmapContainerRef,
  mindmapSvgRef,
  isLoading,
  timerSeconds,
  statusMessage,
  isFullscreen,
  aiResults,
  activeResultIndex,
  zoomLevel,
  onToggleFullscreen,
  onExportSVG,
  onExportPNG,
  onSwitchVersion,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  currentMobilePanel
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={`mindmap-panel absolute sm:relative top-0 left-0 w-full h-full bg-white rounded-none sm:rounded-lg shadow-lg flex flex-col overflow-hidden transition-transform duration-300 z-0 sm:z-auto ${
        currentMobilePanel === 'mindmap' ? 'translate-x-0' : 'translate-x-full sm:translate-x-0'
      } ${currentMobilePanel === 'mindmap' ? 'opacity-100' : 'opacity-0 sm:opacity-100'} sm:opacity-100 sm:translate-x-0`}
    >
      <div className='bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-2 sm:p-4 flex flex-wrap items-center gap-2'>
        <span className='text-sm sm:text-base font-semibold'>{t('aimarkmap.mindmapPreviewTitle')}</span>
        <div className='flex gap-1 order-3 w-full sm:w-auto sm:order-none'>
          {aiResults.length > 1 && aiResults.map((_, index) => (
            <Button
              key={index}
              size='small'
              className={`${
                index === activeResultIndex
                  ? 'bg-white/40 font-bold border-white'
                  : 'bg-white/20 border-white/30'
              } text-white`}
              onClick={() => onSwitchVersion(index)}
            >
              {t('aimarkmap.js_tab_version', { i: index + 1 })}
            </Button>
          ))}
        </div>
        <div className='flex items-center gap-2 ml-auto'>
          <Button
            size='small'
            icon={<ZoomOutOutlined />}
            onClick={onZoomOut}
            className='bg-white/20 text-white border-white/30'
            title={t('aimarkmap.js_zoom_out')}
          />
          <span className='text-sm font-medium w-12 text-center'>{Math.round(zoomLevel * 100)}%</span>
          <Button
            size='small'
            icon={<ZoomInOutlined />}
            onClick={onZoomIn}
            className='bg-white/20 text-white border-white/30'
            title={t('aimarkmap.js_zoom_in')}
          />
          <Button
            size='small'
            icon={<CompressOutlined />}
            onClick={onResetZoom}
            className='bg-white/20 text-white border-white/30'
            title={t('aimarkmap.js_reset_zoom')}
          />
          <Button
            size='small'
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={onToggleFullscreen}
            className='bg-white/20 text-white border-white/30 hidden sm:inline-flex'
          >
            {isFullscreen ? t('aimarkmap.js_exit_fullscreen') : t('aimarkmap.js_fullscreen')}
          </Button>
          <Button
            size='small'
            icon={<FileOutlined />}
            onClick={onExportSVG}
            className='bg-white/20 text-white border-white/30'
          >
            {t('aimarkmap.exportSvgBtn')}
          </Button>
          <Button
            size='small'
            icon={<FileImageOutlined />}
            onClick={onExportPNG}
            className='bg-white/20 text-white border-white/30'
          >
            {t('aimarkmap.exportPngBtn')}
          </Button>
        </div>
      </div>

      <div
        ref={mindmapContainerRef}
        className='flex-1 relative bg-white'
      >
        <svg ref={mindmapSvgRef} id='mindmap' className='w-full h-full'></svg>

        {isLoading && (
          <div className='absolute inset-0 bg-white/90 flex flex-col items-center justify-center z-50 gap-2'>
            <div className='relative w-16 h-16'>
              <div className='w-16 h-16 border-4 border-gray-200 border-t-indigo-600 rounded-full animate-spin'></div>
              <span className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 font-semibold text-indigo-600'>
                {timerSeconds.toFixed(1)}s
              </span>
            </div>
            <div className='text-sm text-gray-600'>{t('aimarkmap.thinkingMessage')}</div>
            <div className='text-xs text-gray-500'>{statusMessage}</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MindmapPanel
