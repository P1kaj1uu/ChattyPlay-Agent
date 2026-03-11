import React, { useState } from 'react'
import { Input, Button, message, Typography, Card, Spin, Tag, Space, Divider, Progress } from 'antd'
import { LinkOutlined, DownloadOutlined, LoadingOutlined, PlayCircleOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

const { Title, Text, Paragraph } = Typography
const { TextArea } = Input

interface VideoFormat {
  format_id: string
  ext: string
  url: string
  vcodec: string
  acodec: string
  width?: number
  height?: number
  filesize?: number
}

interface VideoInfo {
  title: string
  thumbnail: string
  duration: number
  url: string | null
  webpage_url: string
  formats: VideoFormat[]
  _source: string
  _bilibili_dash?: boolean
  _解析方式?: string
}

interface DownloadProgress {
  formatId: string
  loaded: number
  total: number
  percentage: number
}

const PageContainer = styled.div`
  max-width: 900px;
  margin: 0 auto;
`

const InputCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 32px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

  .ant-card-body {
    padding: 32px;
  }
`

const InputHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
`

const GradientTitle = styled(Title)`
  background: linear-gradient(90deg, #6a11cb 0%, #2575fc 50%, #ff2575 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px !important;
`

const StyledTextArea = styled(TextArea)`
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  padding: 16px;
  font-size: 15px;
  transition: all 0.3s ease;

  &:focus {
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &::placeholder {
    color: #999;
  }
`

const ExtractButton = styled(Button)`
  margin-top: 20px;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;

  &:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
    color: #fff;
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`

const ResultCard = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 20px;
  overflow: hidden;

  .ant-card-body {
    padding: 0;
  }
`

const VideoHeader = styled.div`
  display: flex;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
`

const ThumbnailWrapper = styled.div`
  position: relative;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  img {
    width: 200px;
    height: 150px;
    object-fit: cover;
    display: block;
  }
`

const PlayOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;

  &:hover {
    opacity: 1;
  }
`

const VideoInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
`

const VideoTitle = styled(Title)`
  margin-bottom: 12px !important;
  line-height: 1.4 !important;
`

const MetaInfo = styled(Space)`
  margin-bottom: 12px;
`

const FormatSection = styled.div`
  padding: 24px;
  background: #fff;
`

const FormatTitle = styled(Title)`
  font-size: 18px;
  margin-bottom: 20px !important;
`

const FormatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
`

const FormatCard = styled.div`
  border: 2px solid #e8e8e8;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s ease;
  background: #fafafa;

  &:hover {
    border-color: #667eea;
    background: #f0f3ff;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  }
`

const FormatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`

const FormatTag = styled(Tag)`
  margin: 0;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 500;
`

const FormatDetails = styled.div`
  color: #666;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.8;
`

const DownloadButton = styled(Button)`
  width: 100%;
  height: 40px;
  border-radius: 8px;
  font-weight: 500;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #fff;

  &:hover {
    background: linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%);
    color: #fff;
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

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '未知大小'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// 支持的视频平台列表
const getPlatforms = (t: any) => [
  { name: t('video.bilibili'), url: 'https://www.bilibili.com/', status: t('video.availableRecommended') },
  { name: t('video.douyin'), url: 'https://www.douyin.com/', status: t('video.availableRecommended') },
  { name: t('video.xiaohongshu'), url: 'https://www.xiaohongshu.com/', status: t('video.availableRecommended') },
]

const VideoDownload: React.FC = () => {
  const { t } = useTranslation()
  const PLATFORMS = getPlatforms(t)
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<Record<string, DownloadProgress>>({})

  const handleExtract = async () => {
    if (!videoUrl.trim()) {
      message.warning('请输入视频链接')
      return
    }

    // 验证URL格式
    try {
      new URL(videoUrl)
    } catch {
      message.error('请输入有效的视频链接')
      return
    }

    setLoading(true)
    setVideoInfo(null)

    try {
      const response = await fetch('/api/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoUrl })
      })

      if (!response.ok) {
        const responseText = await response.text()
        let errorMessage = '解析失败'
        try {
          const errorData = JSON.parse(responseText)
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          if (responseText) {
            errorMessage = `解析失败 (${response.status}): ${responseText.substring(0, 200)}`
          }
        }
        throw new Error(errorMessage)
      }

      const data: VideoInfo = await response.json()

      if (!data.formats || data.formats.length === 0) {
        message.warning('未找到可下载的视频格式')
      } else {
        setVideoInfo(data)
        message.success('解析成功')
      }
    } catch (error) {
      message.error('解析失败，请检查链接是否正确')
      console.error('解析错误:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format: VideoFormat, index: number) => {
    const formatId = `download-${index}`

    // 检测是否是B站视频
    const isBilibili = videoInfo?._source === 'bilibili_official_api' ||
                       videoInfo?.webpage_url?.includes('bilibili.com')

    // 检测是否是抖音视频
    const isDouyin = videoInfo?._source?.includes('douyin') ||
                     videoInfo?.webpage_url?.includes('douyin.com')
    
    // 检测是否是小红书视频
    const isXHS = videoInfo?._source?.includes('"xiaohongshu') ||
                     videoInfo?.webpage_url?.includes('xiaohongshu.com')

    console.log('🔍 下载调试信息:', {
      index,
      formatId,
      isBilibili,
      isDouyin,
      isXHS,
      _source: videoInfo?._source,
      url: videoInfo?.webpage_url,
      ext: format.ext,
      vcodec: format.vcodec,
      bilibiliCondition: isBilibili && format.ext === 'mp4' && format.vcodec !== 'none',
      douyinCondition: (isDouyin || isXHS) && format.ext === 'mp4' && format.vcodec !== 'none'
    })

    // 如果是B站的MP4视频，使用特殊下载API
    if (isBilibili && format.ext === 'mp4' && format.vcodec !== 'none') {
      console.log('✅ 使用B站下载API')
      message.loading('正在准备下载...', 0)

      try {
        // 使用fetch发送POST请求到bilibili-download API
        const response = await fetch('/api/bilibili-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: videoInfo?.webpage_url })
        })

        message.destroy()

        if (response.ok) {
          // 获取响应的Content-Type
          const contentType = response.headers.get('content-type') || ''
          console.log('📡 响应Content-Type:', contentType)

          if (contentType.includes('application/json')) {
            console.log('📄 JSON响应，解析中...')
            // JSON响应 - 可能包含下载链接
            const data = await response.json()
            if (data.url || data.download_url) {
              const downloadUrl = data.url || data.download_url
              // 使用带进度的下载
              await downloadWithProgress(downloadUrl, `${videoInfo?.title || 'video'}.mp4`, formatId)
            } else {
              message.warning('未获取到下载链接，使用备用下载方式')
              // 回退到直接下载
              const link = document.createElement('a')
              link.href = format.url
              link.target = '_blank'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              message.success('开始下载')
            }
          } else {
            // 视频文件响应 - 带进度下载
            console.log('🎬 视频文件响应，开始带进度下载')
            const contentLength = response.headers.get('content-length')
            const total = contentLength ? parseInt(contentLength, 10) : 0
            console.log('📦 文件大小:', total, 'bytes')

            const reader = response.body?.getReader()
            const chunks: Uint8Array[] = []
            let receivedLength = 0

            if (reader) {
              console.log('✅ Reader创建成功，初始化进度')
              // 初始化进度
              setDownloadProgress({
                [formatId]: { formatId, loaded: 0, total, percentage: 0 }
              })

              while (true) {
                const { done, value } = await reader.read()

                if (done) break

                chunks.push(value)
                receivedLength += value.length

                // 更新进度
                const percentage = total > 0 ? Math.round((receivedLength / total) * 100) : 0
                console.log(`📊 下载进度: ${percentage}% (${receivedLength}/${total})`)
                setDownloadProgress(prev => ({
                  ...prev,
                  [formatId]: { formatId, loaded: receivedLength, total, percentage }
                }))
              }

              console.log('✅ 下载完成，创建Blob')

              // 合并所有chunks
              const blob = new Blob(chunks.map(chunk => chunk.buffer as ArrayBuffer), { type: contentType })
              const url = URL.createObjectURL(blob)

              // 下载文件
              const link = document.createElement('a')
              link.href = url
              link.download = `${videoInfo?.title || 'video'}.mp4`
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)

              // 清除进度
              setDownloadProgress(prev => {
                const newProgress = { ...prev }
                delete newProgress[formatId]
                return newProgress
              })

              message.success('下载完成！')
            } else {
              throw new Error('无法读取响应流')
            }
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        message.destroy()
        message.error('下载失败，使用直接下载')
        console.error('B站下载错误:', error)

        // 清除进度
        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[formatId]
          return newProgress
        })

        // 失败时回退到直接下载
        const link = document.createElement('a')
        link.href = format.url
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success('开始下载')
      }
    } else if ((isDouyin || isXHS) && format.ext === 'mp4' && format.vcodec !== 'none') {
      // 如果是抖音或小红书的MP4视频，使用proxy-download API
      console.log('✅ 使用抖音/小红书下载API')
      message.loading('正在准备下载...', 0)

      try {
        const filename = `${videoInfo?.title || 'video'}.mp4`

        // 使用fetch发送POST请求到proxy-download API
        const response = await fetch('/api/proxy-download', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: videoInfo?.url,
            filename: filename
          })
        })

        message.destroy()

        if (response.ok) {
          // 获取响应的Content-Type
          const contentType = response.headers.get('content-type') || ''
          console.log('📡 抖音响应Content-Type:', contentType)

          if (contentType.includes('application/json')) {
            console.log('📄 JSON响应，解析中...')
            // JSON响应 - 可能包含错误信息
            const data = await response.json()
            if (data.error) {
              message.error(data.error || '下载失败')
            } else if (data.url || data.download_url) {
              const downloadUrl = data.url || data.download_url
              // 使用带进度的下载
              await downloadWithProgress(downloadUrl, filename, formatId)
            } else {
              message.warning('未获取到下载链接，使用备用下载方式')
              // 回退到直接下载
              const link = document.createElement('a')
              link.href = format.url
              link.target = '_blank'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              message.success('开始下载')
            }
          } else {
            // 视频文件响应 - 带进度下载
            console.log('🎬 视频文件响应，开始带进度下载')
            const contentLength = response.headers.get('content-length')
            const total = contentLength ? parseInt(contentLength, 10) : 0
            console.log('📦 文件大小:', total, 'bytes')

            const reader = response.body?.getReader()
            const chunks: Uint8Array[] = []
            let receivedLength = 0

            if (reader) {
              console.log('✅ Reader创建成功，初始化进度')
              // 初始化进度
              setDownloadProgress({
                [formatId]: { formatId, loaded: 0, total, percentage: 0 }
              })

              while (true) {
                const { done, value } = await reader.read()

                if (done) break

                chunks.push(value)
                receivedLength += value.length

                // 更新进度
                const percentage = total > 0 ? Math.round((receivedLength / total) * 100) : 0
                console.log(`📊 下载进度: ${percentage}% (${receivedLength}/${total})`)
                setDownloadProgress(prev => ({
                  ...prev,
                  [formatId]: { formatId, loaded: receivedLength, total, percentage }
                }))
              }

              console.log('✅ 下载完成，创建Blob')

              // 合并所有chunks
              const blob = new Blob(chunks.map(chunk => chunk.buffer as ArrayBuffer), { type: contentType })
              const url = URL.createObjectURL(blob)

              // 下载文件
              const link = document.createElement('a')
              link.href = url
              link.download = filename
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)

              // 清除进度
              setDownloadProgress(prev => {
                const newProgress = { ...prev }
                delete newProgress[formatId]
                return newProgress
              })

              message.success('下载完成！')
            } else {
              throw new Error('无法读取响应流')
            }
          }
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } catch (error) {
        message.destroy()
        console.error('❌ 抖音下载错误:', error)
        message.error('下载失败，使用直接下载')

        // 清除进度
        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[formatId]
          return newProgress
        })

        // 失败时回退到直接下载
        const link = document.createElement('a')
        link.href = format.url
        link.target = '_blank'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        message.success('开始下载')
      }
    } else {
      // 非B站视频或音频文件，直接下载
      console.log('🔗 非B站MP4，使用直接下载')
      const link = document.createElement('a')
      link.href = format.url
      link.download = `${videoInfo?.title || 'video'}.${format.ext}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('开始下载')
    }
  }

  // 带进度的下载函数
  const downloadWithProgress = async (url: string, filename: string, formatId: string) => {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0

      const reader = response.body?.getReader()
      const chunks: Uint8Array[] = []
      let receivedLength = 0

      if (reader) {
        // 初始化进度
        setDownloadProgress({
          [formatId]: { formatId, loaded: 0, total, percentage: 0 }
        })

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          chunks.push(value)
          receivedLength += value.length

          // 更新进度
          const percentage = total > 0 ? Math.round((receivedLength / total) * 100) : 0
          setDownloadProgress(prev => ({
            ...prev,
            [formatId]: { formatId, loaded: receivedLength, total, percentage }
          }))
        }

        // 合并所有chunks
        const blob = new Blob(chunks.map(chunk => chunk.buffer as ArrayBuffer))
        const blobUrl = URL.createObjectURL(blob)

        // 下载文件
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)

        // 清除进度
        setDownloadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[formatId]
          return newProgress
        })

        message.success('下载完成！')
      } else {
        throw new Error('无法读取响应流')
      }
    } catch (error) {
      // 清除进度
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[formatId]
        return newProgress
      })

      throw error
    }
  }

  const getCodecInfo = (format: VideoFormat): string => {
    const parts: string[] = []
    if (format.vcodec && format.vcodec !== 'none') {
      parts.push(`视频: ${format.vcodec}`)
    }
    if (format.acodec && format.acodec !== 'none') {
      parts.push(`音频: ${format.acodec}`)
    }
    return parts.length > 0 ? parts.join(' | ') : '未知编码'
  }

  const handlePlatformClick = (platform: { name: string; url: string }) => {
    window.open(platform.url, '_blank')
  }

  return (
    <PageContainer>
      <InputCard>
        <InputHeader>
          <GradientTitle level={2}>{t('video.downloadTitle')}</GradientTitle>
          <Paragraph style={{ color: '#666', marginBottom: 0 }}>
            {t('video.downloadDescription')}
          </Paragraph>
        </InputHeader>

        <StyledTextArea
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder={t('video.downloadPlaceholder')}
          autoSize={{ minRows: 3, maxRows: 6 }}
          // @ts-ignore
          prefix={<LinkOutlined />}
          onPressEnter={handleExtract}
        />

        <ExtractButton
          icon={loading ? <LoadingOutlined /> : <DownloadOutlined />}
          onClick={handleExtract}
          loading={loading}
        >
          {loading ? t('video.extracting') : t('video.extractVideo')}
        </ExtractButton>
      </InputCard>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#999' }}>正在解析视频信息...</p>
        </div>
      )}

      {!loading && videoInfo && (
        <ResultCard>
          <VideoHeader>
            <ThumbnailWrapper>
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23f0f0f0" width="200" height="150"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E无封面%3C/text%3E%3C/svg%3E'
                }}
              />
              <PlayOverlay>
                <PlayCircleOutlined style={{ fontSize: '48px', color: '#fff' }} />
              </PlayOverlay>
            </ThumbnailWrapper>
            <VideoInfo>
              <VideoTitle level={4} ellipsis={{ rows: 2 }}>
                {videoInfo.title}
              </VideoTitle>
              <MetaInfo wrap>
                <Tag color="blue">时长: {formatDuration(videoInfo.duration)}</Tag>
                <Tag color="purple">{videoInfo._source}</Tag>
                {videoInfo._解析方式 && (
                  <Tag color="green">{videoInfo._解析方式}</Tag>
                )}
              </MetaInfo>
              {videoInfo.webpage_url && (
                <Text type="secondary" style={{ fontSize: '13px' }}>
                  来源: <a href={videoInfo.webpage_url} target="_blank" rel="noopener noreferrer">
                    {videoInfo.webpage_url}
                  </a>
                </Text>
              )}
            </VideoInfo>
          </VideoHeader>

          <Divider style={{ margin: 0 }} />

          <FormatSection>
            <FormatTitle level={4}>{t('video.downloadFormat')}</FormatTitle>
            <FormatGrid>
              {videoInfo.formats.map((format, index) => {
                // 调试日志
                const isBilibili = videoInfo._source === 'bilibili_official_api' || videoInfo.webpage_url?.includes('bilibili.com')
                const isDouyin = videoInfo._source?.includes('douyin') || videoInfo.webpage_url?.includes('douyin.com')
                console.log(`📦 格式 ${index}:`, {
                  ext: format.ext,
                  vcodec: format.vcodec,
                  acodec: format.acodec,
                  isBilibili,
                  isDouyin,
                  willUseBilibiliProgress: isBilibili && format.ext === 'mp4' && format.vcodec !== 'none',
                  willUseDouyinProgress: isDouyin && format.ext === 'mp4' && format.vcodec !== 'none'
                })

                return (
                <FormatCard key={index}>
                  <FormatHeader>
                    <FormatTag color={format.vcodec !== 'none' ? 'blue' : 'orange'}>
                      {format.vcodec !== 'none' ? '视频' : '音频'}
                    </FormatTag>
                    <FormatTag color="default">{format.ext.toUpperCase()}</FormatTag>
                  </FormatHeader>
                  <FormatDetails>
                    {format.width && format.height && (
                      <div>分辨率: {format.width} × {format.height}</div>
                    )}
                    <div>大小: {formatFileSize(format.filesize)}</div>
                    <div>编码: {getCodecInfo(format)}</div>
                  </FormatDetails>
                  <DownloadButton
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload(format, index)}
                    disabled={!!downloadProgress[`download-${index}`]}
                  >
                    {downloadProgress[`download-${index}`]
                      ? `下载中 ${downloadProgress[`download-${index}`].percentage}%`
                      : `下载 ${format.ext.toUpperCase()}`
                    }
                  </DownloadButton>
                  {downloadProgress[`download-${index}`] && (
                    <div style={{ marginTop: '12px' }}>
                      <Progress
                        percent={downloadProgress[`download-${index}`].percentage}
                        status="active"
                        size="small"
                        strokeColor={{
                          '0%': '#667eea',
                          '100%': '#764ba2',
                        }}
                      />
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px', textAlign: 'center' }}>
                        {formatFileSize(downloadProgress[`download-${index}`].loaded)} / {formatFileSize(downloadProgress[`download-${index}`].total)}
                      </div>
                    </div>
                  )}
                </FormatCard>
                )
              })}
            </FormatGrid>
          </FormatSection>
        </ResultCard>
      )}

      {!loading && !videoInfo && (
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
      )}

    </PageContainer>
  )
}

export default VideoDownload
