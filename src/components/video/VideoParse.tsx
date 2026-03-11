import React, { useState } from 'react'
import { Input, Button, Select, message, Typography } from 'antd'
import { PlayCircleOutlined, FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { Title, Paragraph } = Typography
const { Option } = Select

// 扩展 ScreenOrientation 类型以支持 lock 和 unlock 方法
declare global {
  interface ScreenOrientation {
    lock?(orientation: any): Promise<void>
    // @ts-ignore
    unlock?(): void
  }
}

// 视频解析接口列表
const getApiList = (t: any) => [
  {
    name: t('video.api1'),
    url: import.meta.env.VITE_VIDEO_PARSE_URL1 || ''
  },
  {
    name: t('video.api2'),
    url: import.meta.env.VITE_VIDEO_PARSE_URL2 || ''
  },
  {
    name: t('video.api3'),
    url: import.meta.env.VITE_VIDEO_PARSE_URL3 || ''
  },
  {
    name: t('video.api4'),
    url: import.meta.env.VITE_VIDEO_PARSE_URL4 || ''
  },
  {
    name: t('video.api5'),
    url: import.meta.env.VITE_VIDEO_PARSE_URL5 || ''
  }
]

const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
`

const SearchSection = styled.div`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px;
  border-radius: 16px;
  margin-bottom: 40px;
  text-align: center;
  color: #fff;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);

  h2 {
    margin-bottom: 20px;
    font-size: 2rem;
  }

  p {
    margin-bottom: 30px;
    opacity: 0.9;
  }
`

const FormSection = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  max-width: 900px;
  margin: 0 auto;
`

const VideoSection = styled.div<{ $isFullscreen: boolean }>`
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  margin-bottom: 40px;
  position: ${props => props.$isFullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$isFullscreen ? '0' : 'auto'};
  left: ${props => props.$isFullscreen ? '0' : 'auto'};
  width: ${props => props.$isFullscreen ? '100vw' : 'auto'};
  height: ${props => props.$isFullscreen ? '100vh' : 'auto'};
  z-index: ${props => props.$isFullscreen ? '9999' : 'auto'};
  border-radius: ${props => props.$isFullscreen ? '0' : '16px'};
  padding: ${props => props.$isFullscreen ? '0' : '20px'};

  iframe {
    width: 100%;
    height: ${props => props.$isFullscreen ? '100vh' : '600px'};
    border: none;
    border-radius: 8px;
    background: #000;
    display: block;
  }

  @media (max-width: 768px) {
    padding: ${props => props.$isFullscreen ? '0' : '10px'};

    iframe {
      height: ${props => props.$isFullscreen ? '100vh' : '300px'};
    }
  }
`

const FullscreenButton = styled(Button)`
  position: absolute;
  top: 30px;
  right: 30px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6) !important;
  border: none !important;
  color: #fff !important;

  &:hover {
    background: rgba(0, 0, 0, 0.8) !important;
  }
`

const RotatePrompt = styled.div<{ $show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  display: ${props => props.$show ? 'flex' : 'none'};
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  color: #fff;
  text-align: center;
  padding: 20px;

  .icon {
    font-size: 64px;
    margin-bottom: 20px;
    animation: rotate 1.5s ease-in-out infinite;
  }

  .text {
    font-size: 1.2rem;
    line-height: 1.6;
  }

  .sub-text {
    font-size: 0.9rem;
    margin-top: 15px;
    opacity: 0.7;
  }

  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(-90deg);
    }
    75% {
      transform: rotate(-90deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }

  @media (min-width: 769px) {
    display: none !important;
  }
`

const SupportSection = styled.div`
  margin-top: 60px;

  h3 {
    text-align: center;
    margin-bottom: 30px;
    font-size: 1.5rem;
    color: #333;
  }
`

const PlatformGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
`

const PlatformCard = styled.a`
  display: block;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  text-decoration: none;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }

  .platform-name {
    font-weight: 600;
    margin-bottom: 8px;
    color: #667eea;
  }

  .platform-status {
    font-size: 0.85rem;
    color: #52c41a;
  }
`

// 支持的视频平台列表
const getPlatforms = (t: any) => [
  { name: t('video.tencentVideo'), url: 'http://v.qq.com/', status: t('video.availableRecommended') },
  { name: t('video.iqiyi'), url: 'http://www.iqiyi.com/', status: t('video.availableRecommended') },
  { name: t('video.youku'), url: 'http://www.youku.com/', status: t('video.availableRecommended') },
  { name: t('video.mgtv'), url: 'http://www.mgtv.com/', status: t('video.availableRecommended') },
  { name: t('video.bilibili'), url: 'https://www.bilibili.com/', status: t('video.availableRecommended') },
  { name: t('video.letv'), url: 'http://www.le.com/', status: t('video.available') },
  { name: t('video.tudou'), url: 'http://www.tudou.com/', status: t('video.available') },
  { name: t('video.sohu'), url: 'http://tv.sohu.com/', status: t('video.available') },
  { name: t('video.pptv'), url: 'http://www.pptv.com/', status: t('video.available') },
  { name: t('video.movie1905'), url: 'http://www.1905.com/', status: t('video.available') },
  { name: t('video.hjtv'), url: 'https://www.hjtv.me/', status: t('video.mayNotBeAvailable') },
  { name: t('video.omofun'), url: 'https://omofun.tv/', status: t('video.mayNotBeAvailable') }
]

// 检测是否为移动端设备
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

// 检测是否支持屏幕方向锁定 API
const isOrientationLockSupported = () => {
  return !!(screen.orientation && (screen.orientation as any).lock)
}

// 锁定屏幕方向为横屏（仅在真实移动设备且支持该 API 时生效）
const lockOrientation = async () => {
  // 静默处理，不在控制台输出错误
  if (isOrientationLockSupported()) {
    try {
      await (screen.orientation as any).lock('landscape')
    } catch {
      // 忽略错误：可能是模拟器、桌面浏览器或不支持的设备
    }
  }
}

// 解锁屏幕方向
const unlockOrientation = () => {
  // 静默处理，不在控制台输出错误
  if (screen.orientation && typeof screen.orientation.unlock === 'function') {
    try {
      screen.orientation.unlock()
    } catch {
      // 忽略错误
    }
  }
}

const VideoParse: React.FC = () => {
  const { t } = useTranslation()
  const [videoUrl, setVideoUrl] = useState('')
  const [selectedApi, setSelectedApi] = useState(getApiList(t)[0]?.url || '')
  const [loading, setLoading] = useState(false)
  const [playUrl, setPlayUrl] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showRotatePrompt, setShowRotatePrompt] = useState(false)

  // 获取API列表
  const API_LIST = getApiList(t)

  // 获取平台列表
  const PLATFORMS = getPlatforms(t)

  // 验证URL格式
  const isValidUrl = (url: string) => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
    } catch {
      return false
    }
  }

  const handleParse = async () => {
    // 验证视频链接
    if (!videoUrl.trim()) {
      message.warning(t('video.noUrlTip'))
      return
    }

    // 验证URL格式
    if (!isValidUrl(videoUrl)) {
      message.error(t('video.parseFailed'))
      return
    }

    // 验证是否选择了解析接口
    if (!selectedApi) {
      message.warning(t('video.parseFailed'))
      return
    }

    setLoading(true)

    try {
      // 构建播放地址
      const finalUrl = selectedApi + encodeURIComponent(videoUrl)
      setPlayUrl(finalUrl)

      // 模拟加载延迟
      setTimeout(() => {
        setLoading(false)
        message.success(t('video.parseSuccess'))
      }, 500)
    } catch (error) {
      message.error(t('video.parseFailed'))
      setLoading(false)
    }
  }

  const handlePlatformClick = (platform: { name: string; url: string }) => {
    window.open(platform.url, '_blank')
  }

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen
    setIsFullscreen(newFullscreenState)

    // 移动端处理
    if (isMobileDevice()) {
      if (newFullscreenState) {
        // 尝试锁定横屏
        lockOrientation()
        // 显示旋转提示（仅在 HTTP 环境或不支持锁定 API 时）
        setShowRotatePrompt(true)
        // 3秒后自动隐藏提示
        setTimeout(() => setShowRotatePrompt(false), 3000)
      } else {
        unlockOrientation()
        setShowRotatePrompt(false)
      }
    }
  }

  return (
    <PageContainer>
      {/* 横屏提示 */}
      <RotatePrompt $show={showRotatePrompt}>
        <div className="icon">📱</div>
        <div className="text">{t('video.rotatePrompt')}</div>
        <div className="sub-text">{t('video.rotateSubPrompt')}</div>
      </RotatePrompt>

      <SearchSection>
        <Title level={2} style={{ color: '#fff', marginBottom: '16px' }}>
          {t('video.title')}
        </Title>
        <Paragraph style={{ fontSize: '1.1rem', marginBottom: '24px' }}>
          {t('video.description')}
        </Paragraph>

        <FormSection>
          <Select
            value={selectedApi}
            onChange={setSelectedApi}
            placeholder={t('video.selectApi')}
            style={{ width: 200, borderRadius: '12px' }}
            size="large"
          >
            {API_LIST.map((api: any) => (
              <Option key={api.url} value={api.url}>
                {api.name}
              </Option>
            ))}
          </Select>

          <Input
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder={t('video.placeholder')}
            style={{ flex: 1, minWidth: 300, borderRadius: '12px' }}
            onPressEnter={handleParse}
            size="large"
            allowClear
          />

          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleParse}
            loading={loading}
            size="large"
            style={{
              background: '#fff',
              color: '#667eea',
              border: 'none',
              minWidth: '120px'
            }}
          >
            {t('video.parseBtn')}
          </Button>
        </FormSection>

        <Paragraph style={{ fontSize: '0.9rem', marginTop: '16px', opacity: 0.8 }}>
          {t('video.parseTimeoutTip')}
        </Paragraph>
      </SearchSection>

      {/* 视频播放区域 */}
      {playUrl && (
        <VideoSection $isFullscreen={isFullscreen}>
          <FullscreenButton
            icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? t('video.exitFullscreenBtn') : t('video.fullscreenBtn')}
          </FullscreenButton>
          <iframe
            src={playUrl}
            allowFullScreen
            allow="autoplay; encrypted-media"
            title="video-player"
          />
        </VideoSection>
      )}

      <SupportSection>
        <h3>{t('video.supportedSites')}</h3>
        <PlatformGrid>
          {PLATFORMS.map((platform: any) => (
            <PlatformCard
              key={platform.name}
              onClick={() => handlePlatformClick(platform)}
            >
              <div className="platform-name">{platform.name}</div>
              <div className="platform-status">{platform.status}</div>
            </PlatformCard>
          ))}
        </PlatformGrid>
      </SupportSection>
    </PageContainer>
  )
}

export default VideoParse
