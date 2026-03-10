import React from 'react'
import { Modal, Input } from 'antd'
import { useTranslation } from 'react-i18next'

const { TextArea } = Input

interface EditNodeModalProps {
  visible: boolean
  defaultValue: string
  onSave: (value: string) => void
  onCancel: () => void
}

const EditNodeModal: React.FC<EditNodeModalProps> = ({
  visible,
  defaultValue,
  onSave,
  onCancel
}) => {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('aimarkmap.editNodeTitle')}
      open={visible}
      onCancel={onCancel}
      footer={null}
      className='max-w-lg'
    >
      <div className='space-y-4 py-4'>
        <TextArea
          defaultValue={defaultValue}
          onChange={(e) => onSave(e.target.value)}
          placeholder={t('aimarkmap.editNodePlaceholder')}
          rows={4}
          className='h-24'
        />
      </div>
    </Modal>
  )
}

export default EditNodeModal
