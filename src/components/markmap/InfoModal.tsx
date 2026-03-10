import React from 'react'
import { Modal } from 'antd'
import { useTranslation } from 'react-i18next'

interface InfoModalProps {
  visible: boolean
  onClose: () => void
}

const InfoModal: React.FC<InfoModalProps> = ({ visible, onClose }) => {
  const { t } = useTranslation()

  return (
    <Modal
      title={t('aimarkmap.infoModalTitle')}
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      className='max-h-[80vh]'
    >
      <div
        className='overflow-y-auto max-h-[60vh] p-4'
        dangerouslySetInnerHTML={{ __html: t('aimarkmap.infoModalContentHtml') }}
      />
    </Modal>
  )
}

export default InfoModal
