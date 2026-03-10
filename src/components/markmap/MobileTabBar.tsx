import React from 'react'
import { EditOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface MobileTabBarProps {
  currentMobilePanel: 'editor' | 'mindmap'
  onSwitchPanel: (panel: 'editor' | 'mindmap') => void
  onToggleLandscape: () => void
}

const MobileTabBar: React.FC<MobileTabBarProps> = ({
  currentMobilePanel,
  onSwitchPanel,
  onToggleLandscape
}) => {
  const { t } = useTranslation()

  return (
    <div className='fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex justify-around items-center shadow-lg z-30 sm:hidden'>
      <button
        className={`tab-btn flex flex-col items-center justify-center gap-1 flex-1 h-full ${
          currentMobilePanel === 'editor' ? 'text-indigo-600' : 'text-gray-600'
        }`}
        onClick={() => onSwitchPanel('editor')}
      >
        <EditOutlined className='text-2xl' />
        <span className='text-xs'>{t('aimarkmap.mobileTabEditor')}</span>
      </button>
      <button
        className={`tab-btn flex flex-col items-center justify-center gap-1 flex-1 h-full ${
          currentMobilePanel === 'mindmap' ? 'text-indigo-600' : 'text-gray-600'
        }`}
        onClick={() => onSwitchPanel('mindmap')}
      >
        <svg className='w-6 h-6' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <circle cx='12' cy='12' r='3'></circle>
          <line x1='12' y1='2' x2='12' y2='6'></line>
          <line x1='12' y1='18' x2='12' y2='22'></line>
          <line x1='4.93' y1='4.93' x2='7.76' y2='7.76'></line>
          <line x1='16.24' y1='16.24' x2='19.07' y2='19.07'></line>
          <line x1='2' y1='12' x2='6' y2='12'></line>
          <line x1='18' y1='12' x2='22' y2='12'></line>
          <line x1='4.93' y1='19.07' x2='7.76' y2='16.24'></line>
          <line x1='16.24' y1='7.76' x2='19.07' y2='4.93'></line>
        </svg>
        <span className='text-xs'>{t('aimarkmap.mobileTabMindmap')}</span>
      </button>
      <button
        className={`tab-btn flex flex-col items-center justify-center gap-1 flex-1 h-full ${
          currentMobilePanel === 'mindmap' ? 'text-indigo-600' : 'text-gray-600 opacity-50 pointer-events-none'
        }`}
        onClick={onToggleLandscape}
      >
        <svg className='w-6 h-6' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
          <rect x='2' y='6' width='20' height='12' rx='2'></rect>
          <path d='M12 10v4'></path>
          <path d='M10 12h4'></path>
        </svg>
        <span className='text-xs'>{t('aimarkmap.mobileTabLandscape')}</span>
      </button>
    </div>
  )
}

export default MobileTabBar
