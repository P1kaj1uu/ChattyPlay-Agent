import React, { useState } from 'react'
import { Button } from 'antd'
import { PlayCircleOutlined, DownloadOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'
import VideoParse from '@/components/video/VideoParse'
import VideoDownload from '@/components/video/VideoDownload'

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
`

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 32px;
`

const TabButton = styled(Button)<{ $active: boolean }>`
  min-width: 140px;
  height: 48px;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${props => props.$active ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
    color: #fff;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);

    &:hover {
      background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
      color: #fff;
    }
  ` : `
    background: #fff;
    border-color: #d9d9d9;
    color: #666;

    &:hover {
      border-color: #667eea;
      color: #667eea;
    }
  `}
`

const Video: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'parse' | 'download'>('parse')

  return (
    <PageContainer>
      <TabContainer>
        <TabButton
          $active={activeTab === 'parse'}
          icon={<PlayCircleOutlined />}
          onClick={() => setActiveTab('parse')}
        >
          {t('video.tabParse')}
        </TabButton>
        <TabButton
          $active={activeTab === 'download'}
          icon={<DownloadOutlined />}
          onClick={() => setActiveTab('download')}
        >
          {t('video.tabDownload')}
        </TabButton>
      </TabContainer>

      {activeTab === 'parse' ? <VideoParse /> : <VideoDownload />}
    </PageContainer>
  )
}

export default Video
