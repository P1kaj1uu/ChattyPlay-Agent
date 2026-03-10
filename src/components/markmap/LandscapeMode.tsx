import React from 'react'
import { Button } from 'antd'
import { FullscreenExitOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface LandscapeModeProps {
  isVisible: boolean
  landscapeContentRef: React.RefObject<HTMLDivElement>
  aiResults: Array<{ markdown: string }>
  activeResultIndex: number
  onSwitchVersion: (index: number) => void
  onExportSVG: () => void
  onExportPNG: () => void
  onClose: () => void
}

const LandscapeMode: React.FC<LandscapeModeProps> = ({
  isVisible,
  landscapeContentRef,
  aiResults,
  activeResultIndex,
  onSwitchVersion,
  onExportSVG,
  onExportPNG,
  onClose
}) => {
  const { t } = useTranslation()

  if (!isVisible) return null

  return (
    <div className='landscape-mode-overlay fixed inset-0 bg-white z-[9999] flex flex-col'>
      <div className='flex justify-between items-center p-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white'>
        <span className='text-sm font-semibold'>{t('aimarkmap.mindmapPreviewTitle')}</span>
        <div className='flex gap-1 overflow-x-auto px-2'>
          {aiResults.length > 1 && aiResults.map((_, index) => (
            <Button
              key={index}
              size='small'
              className={`${
                index === activeResultIndex
                  ? 'bg-white/40 font-bold border-white'
                  : 'bg-white/20 border-white/30'
              } text-white whitespace-nowrap`}
              onClick={() => onSwitchVersion(index)}
            >
              {t('aimarkmap.js_tab_version', { i: index + 1 })}
            </Button>
          ))}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            size='small'
            onClick={onExportSVG}
            className='bg-white/20 text-white border-white/30'
          >
            {t('aimarkmap.exportSvgBtn')}
          </Button>
          <Button
            size='small'
            onClick={onExportPNG}
            className='bg-white/20 text-white border-white/30'
          >
            {t('aimarkmap.exportPngBtn')}
          </Button>
          <Button
            size='small'
            onClick={onClose}
            className='bg-white/20 text-white border-white/30'
          >
            <FullscreenExitOutlined /> {t('aimarkmap.mobileCloseLandscape')}
          </Button>
        </div>
      </div>
      <div
        id='landscape-content'
        ref={landscapeContentRef}
        className='flex-1 overflow-hidden relative bg-white'
      ></div>
    </div>
  )
}

export default LandscapeMode
