import React, { useEffect, useState } from 'react'
import { Modal, Button } from 'antd'
import { useTranslation } from 'react-i18next'
import {
  checkVersionUpdate,
  handleVersionUpdate,
  updateStoredVersion,
  getVersionInfo,
  isVersionUpdateHandled,
  markVersionUpdateHandled
} from '../utils/versionChecker'

interface VersionUpdateModalProps {
  /** 是否自动检测版本更新 */
  autoCheck?: boolean
  /** 检测间隔时间（毫秒），默认 5000ms */
  checkInterval?: number
}

const VersionUpdateModal: React.FC<VersionUpdateModalProps> = ({
  autoCheck = true,
  checkInterval = 5000
}) => {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const versionInfo = getVersionInfo()

  /**
   * 处理更新按钮点击
   */
  const handleUpdate = () => {
    // 标记已处理
    markVersionUpdateHandled()
    // 更新版本号
    updateStoredVersion()
    // 清空 localStorage 并重新加载
    handleVersionUpdate()
  }

  /**
   * 执行版本检查
   */
  const performVersionCheck = () => {
    // 如果已经处理过，不再显示
    if (isVersionUpdateHandled()) {
      return
    }

    const hasUpdate = checkVersionUpdate()

    if (hasUpdate) {
      setVisible(true)
    }
  }

  /**
   * 初始化时检查版本更新
   */
  useEffect(() => {
    if (autoCheck) {
      // 延迟检查，避免与其他初始化逻辑冲突
      const timer = setTimeout(() => {
        performVersionCheck()
      }, checkInterval)

      return () => clearTimeout(timer)
    }
  }, [autoCheck, checkInterval])

  return (
    <Modal
      title={t('versionUpdate.title')}
      open={visible}
      centered
      closable={false}
      maskClosable={false}
      keyboard={false}
      width={420}
      footer={null}
      onCancel={() => {}}
    >
      <div style={{ padding: '8px 0' }}>
        <p style={{ fontSize: '16px', fontWeight: 500, marginBottom: '16px' }}>
          {t('versionUpdate.message')}
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          {t('versionUpdate.currentVersion')}{versionInfo.stored}
        </p>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
          {t('versionUpdate.latestVersion')}{versionInfo.current}
        </p>
        <p style={{ fontSize: '14px', color: '#ff4d4f', marginBottom: '24px' }}>
          {t('versionUpdate.description')}
        </p>
        <Button
          type="primary"
          danger
          size="large"
          block
          onClick={handleUpdate}
        >
          {t('versionUpdate.updateButton')}
        </Button>
      </div>
    </Modal>
  )
}

export default VersionUpdateModal
