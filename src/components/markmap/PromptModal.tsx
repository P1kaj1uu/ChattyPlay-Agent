import React from 'react'
import { Modal, Input, Button } from 'antd'
import { useTranslation } from 'react-i18next'

const { TextArea } = Input

interface PromptModalProps {
  visible: boolean
  promptTemplate: string
  onPromptChange: (value: string) => void
  onSave: () => void
  onCancel: () => void
}

const PromptModal: React.FC<PromptModalProps> = ({
  visible,
  promptTemplate,
  onPromptChange,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('aimarkmap.promptSettingsTitle')}
      open={visible}
      onCancel={onCancel}
      footer={null}
      className='max-w-2xl'
    >
      <div className='space-y-4 py-4'>
        <div
          className='bg-blue-50 border border-blue-200 text-blue-600 p-3 rounded text-sm'
          dangerouslySetInnerHTML={{ __html: t('aimarkmap.promptTip') }}
        />
        <TextArea
          value={promptTemplate}
          onChange={(e) => onPromptChange(e.target.value)}
          placeholder={t('aimarkmap.promptInputPlaceholder')}
          rows={10}
          className='min-h-[200px]'
        />
        <div className='flex justify-end'>
          <Button type='primary' onClick={onSave}>
            {t('aimarkmap.saveAndCloseBtn')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PromptModal
