import React from 'react'
import { Button } from 'antd'
import { InfoCircleOutlined, GithubOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useChangeLanguage } from '@/hooks/useChangeLanguage'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  onOpenInfo: () => void
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, onOpenInfo }) => {
  const { t, i18n } = useTranslation()
  const changeLanguage = useChangeLanguage()

  return (
    <div
      id='mobile-menu'
      className={`fixed top-14 left-0 right-0 bg-white/98 backdrop-blur-md p-4 shadow-lg z-30 flex-col gap-3 max-h-[calc(100vh-3.5rem)] overflow-y-auto transition-all duration-300 sm:hidden ${
        isOpen ? 'flex' : 'hidden'
      }`}
    >
      <button
        onClick={() => {
          onOpenInfo()
          onClose()
        }}
        className='flex items-center gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-600 font-medium w-full text-left'
      >
        <InfoCircleOutlined className='text-xl' />
        <span>{t('aimarkmap.helpBtnTitle')}</span>
      </button>
      <a
        href='https://github.com/kongkongyo/Ai-Markmap'
        target='_blank'
        rel='noopener noreferrer'
        className='flex items-center gap-3 p-3 bg-indigo-50 rounded-lg text-indigo-600 font-medium'
      >
        <GithubOutlined className='text-xl' />
        <span>GitHub</span>
      </a>
      <div className='flex gap-2 pt-2'>
        <Button
          className={`flex-1 ${i18n.language === 'zh' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 border-indigo-300'}`}
          onClick={() => changeLanguage('zh')}
        >
          中文
        </Button>
        <Button
          className={`flex-1 ${i18n.language === 'en' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 border-indigo-300'}`}
          onClick={() => changeLanguage('en')}
        >
          EN
        </Button>
      </div>
    </div>
  )
}

export default MobileMenu
