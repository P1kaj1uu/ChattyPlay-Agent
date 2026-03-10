import React from 'react'
import { Button, Input, Slider } from 'antd'
import { ClearOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

const { TextArea } = Input

interface EditorPanelProps {
  searchValue: string
  currentMarkdown: string
  currentViewMode: 'input' | 'original' | 'markdown'
  versionCount: number
  aiResults: Array<{ markdown: string }>
  onVersionCountChange: (value: number) => void
  onGenerate: () => void
  onClear: () => void
  onSwitchView: (view: 'input' | 'original' | 'markdown') => void
  onTopicInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onDisplayEdit: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onOpenPromptModal: () => void
  isLoading: boolean
  currentMobilePanel: 'editor' | 'mindmap'
}

const EditorPanel: React.FC<EditorPanelProps> = ({
  searchValue,
  currentMarkdown,
  currentViewMode,
  versionCount,
  aiResults,
  onVersionCountChange,
  onGenerate,
  onClear,
  onSwitchView,
  onTopicInput,
  onDisplayEdit,
  onOpenPromptModal,
  isLoading,
  currentMobilePanel
}) => {
  const { t } = useTranslation()

  return (
    <div
      className={`editor-panel absolute sm:relative top-0 left-0 w-full sm:w-96 h-full bg-white/95 backdrop-blur rounded-none sm:rounded-lg shadow-lg flex flex-col overflow-hidden transition-transform duration-300 z-10 sm:z-auto ${
        currentMobilePanel === 'editor' ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
      } ${currentMobilePanel === 'editor' ? 'opacity-100' : 'opacity-0 sm:opacity-100'} sm:opacity-100 sm:translate-x-0`}
    >
      <div className='bg-gradient-to-r from-indigo-500 to-purple-600 p-2 sm:p-4 border-b border-indigo-200 flex justify-between items-center'>
        <Button
          type='text'
          onClick={onOpenPromptModal}
          className='text-white'
        >
          {t('aimarkmap.promptSettingsBtn')}
        </Button>
      </div>

      <div className='p-2 sm:p-4 bg-white/80 border-b border-gray-200'>
        <div className='flex items-center gap-2'>
          <span className='text-xs sm:text-sm text-gray-600'>{t('aimarkmap.versionsLabel')}</span>
          <Slider
            min={1}
            max={5}
            value={versionCount}
            onChange={onVersionCountChange}
            className='flex-1'
          />
          <span className='text-indigo-600 font-semibold min-w-[20px] text-center'>
            {versionCount}
          </span>
        </div>
      </div>

      <div className='p-2 sm:p-4 bg-white/80 border-b border-gray-200'>
        <div className='flex gap-1 mb-2'>
          <Button
            type='primary'
            icon={<span>🚀</span>}
            onClick={onGenerate}
            loading={isLoading}
            className='flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 border-0'
          >
            {t('aimarkmap.generateBtn')}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={onClear}
            className='flex-1 bg-gradient-to-r from-red-50 to-pink-50 text-red-600 border-red-400'
          >
            {t('aimarkmap.clearBtn')}
          </Button>
        </div>
        <div className='flex gap-1'>
          <Button
            icon={<span>📄</span>}
            onClick={() => onSwitchView('original')}
            className={`flex-1 ${
              currentViewMode === 'original'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-gradient-to-r from-blue-50 to-purple-50 text-indigo-600 border-indigo-300'
            }`}
            disabled={!searchValue.trim()}
          >
            {t('aimarkmap.showOriginalBtn')}
          </Button>
          <Button
            icon={<span>📝</span>}
            onClick={() => onSwitchView('markdown')}
            className={`flex-1 ${
              currentViewMode === 'markdown'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                : 'bg-gradient-to-r from-green-50 to-blue-50 text-green-700 border-green-500'
            }`}
            disabled={aiResults.length === 0 && !searchValue.trim().startsWith('#')}
          >
            {t('aimarkmap.showMarkdownBtn')}
          </Button>
        </div>
      </div>

      <div className='flex-1 p-2 sm:p-4 flex flex-col'>
        <TextArea
          value={searchValue}
          placeholder={t('aimarkmap.topicInputPlaceholder')}
          onInput={onTopicInput}
          className={`w-full flex-1 min-h-[200px] ${
            currentViewMode === 'input' ? 'block' : 'hidden'
          }`}
        />
        <TextArea
          value={currentViewMode === 'original' ? searchValue : currentMarkdown}
          onChange={currentViewMode === 'markdown' ? onDisplayEdit : undefined}
          readOnly={currentViewMode === 'original'}
          placeholder={t('aimarkmap.contentDisplayPlaceholder')}
          className={`w-full flex-1 min-h-[200px] ${
            currentViewMode !== 'input' ? 'block' : 'hidden'
          }`}
        />
      </div>
    </div>
  )
}

export default EditorPanel
