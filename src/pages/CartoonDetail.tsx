import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Row,
  Col,
  Card,
  Spin,
  message,
  Image,
  Tag,
  Button,
  Space,
  Divider,
  List
} from 'antd'
import {
  ArrowLeftOutlined,
  BookOutlined,
  EyeOutlined,
  StarOutlined,
  UserOutlined,
  ReadOutlined,
  LockOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { Title, Text, Paragraph } = Typography

const DetailContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 80px 24px 24px;

  @media (max-width: 768px) {
    padding: 70px 16px 16px;
  }
`

const ContentWrapper = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

const HeaderCard = styled(Card)`
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
`

const CoverImage = styled(Image)`
  width: 100%;
  max-width: 300px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    max-width: 200px;
  }
`

const InfoSection = styled.div`
  padding: 24px;

  .ant-typography {
    margin-bottom: 12px;
  }
`

const ChapterList = styled(Card)`
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);

  .ant-list-item {
    padding: 16px 24px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(102, 126, 234, 0.05);
    }
  }
`

const BackButton = styled(Button)`
  margin-bottom: 24px;
  border-radius: 20px;
  height: 40px;
  padding: 0 24px;
  font-weight: 500;

  &:hover {
    transform: translateX(-4px);
  }
`

interface TopicInfo {
  id: number;
  title: string;
  introduction: string;
  evaluate?: string;
  vertical_cover: string;
  interact_value?: string;
  is_finish: number;
  author_name: string[];
  tags: Array<{
    id: number;
    name: string;
  }>;
  ep_list: Array<{
    id: number;
    title: string;
    cover: string;
    ord: number;
    short_title: string;
    pub_time: string;
    is_locked: boolean;
    is_in_free: boolean;
  }>;
}

const CartoonDetail: React.FC = () => {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null)

  useEffect(() => {
    if (id) {
      fetchTopicDetail(Number(id))
    }
  }, [id])

  // 获取漫画详情
  const fetchTopicDetail = async (topicId: number) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/bcomic/ComicDetail?comicId=${topicId}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (data.code === 0 && data.data) {
        setTopicInfo(data.data)
      } else {
        message.error(t('cartoonDetail.fetchDetailFailed'))
      }
    } catch (error) {
      console.error('获取漫画详情失败:', error)
      message.error(t('cartoonDetail.fetchDetailFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 处理章节点击
  const handleChapterClick = (episode: TopicInfo['ep_list'][number]) => {
    if (episode.is_locked && !episode.is_in_free) {
      message.warning(t('cartoonChapter.needPurchase'))
      return
    }
    navigate(`/cartoon/chapter/${episode.id}?comicId=${topicInfo?.id}`)
  }

  // 格式化数字显示
  const formatNumber = (num: number = 0) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  if (loading) {
    return (
      <DetailContainer>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <Spin size="large" tip={t('common.loading')} />
        </div>
      </DetailContainer>
    )
  }

  if (!topicInfo) {
    return (
      <DetailContainer>
        <ContentWrapper>
          <BackButton
            type="default"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/cartoon')}
          >
            {t('cartoonDetail.backToList')}
          </BackButton>
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
            {t('cartoonDetail.notFound')}
          </div>
        </ContentWrapper>
      </DetailContainer>
    )
  }

  return (
    <DetailContainer>
      <ContentWrapper>
        <BackButton
          type="default"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/cartoon')}
        >
          {t('cartoonDetail.backToList')}
        </BackButton>

        <HeaderCard>
          <Row gutter={[32, 32]}>
            <Col xs={24} sm={8} md={6} style={{ display: 'flex', justifyContent: 'center' }}>
              <CoverImage
                src={topicInfo.vertical_cover}
                alt={topicInfo.title}
                preview={false}
                referrerPolicy="no-referrer"
              />
            </Col>
            <Col xs={24} sm={16} md={18}>
              <InfoSection>
                <Title level={2} style={{ marginBottom: 16 }}>
                  {topicInfo.title}
                  {topicInfo.is_finish === 1 && (
                    <Tag color="success" style={{ marginLeft: 12 }}>{t('cartoon.finished')}</Tag>
                  )}
                </Title>

                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {topicInfo.author_name.length > 0 && (
                    <Text>
                      <UserOutlined style={{ marginRight: 8 }} />
                      {t('cartoonDetail.author')}：{topicInfo.author_name.join(' / ')}
                    </Text>
                  )}

                  <Space size={24} wrap>
                    <Text>
                      <EyeOutlined style={{ marginRight: 8 }} />
                      {t('cartoonDetail.status')}：{topicInfo.is_finish === 1 ? t('cartoon.finished') : t('cartoon.ongoing')}
                    </Text>
                    {topicInfo.interact_value && (
                      <Text>
                        <StarOutlined style={{ marginRight: 8 }} />
                        {t('cartoonDetail.likes')}：{formatNumber(Number(topicInfo.interact_value))}
                      </Text>
                    )}
                    <Text>
                      <BookOutlined style={{ marginRight: 8 }} />
                      {t('cartoon.chapters')}：{topicInfo.ep_list?.length || 0} {t('cartoonDetail.hua')}
                    </Text>
                  </Space>

                  {topicInfo.tags && topicInfo.tags.length > 0 && (
                    <div>
                      <Text style={{ marginRight: 12 }}>{t('cartoonDetail.tags')}：</Text>
                      {topicInfo.tags.map(tag => (
                        <Tag color="blue" key={tag.id} style={{ marginBottom: 8 }}>
                          {tag.name}
                        </Tag>
                      ))}
                    </div>
                  )}

                  <Divider style={{ margin: '12px 0' }} />

                  <div>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      {t('cartoonDetail.intro')}：
                    </Text>
                    <Paragraph style={{ marginBottom: 0, color: '#666' }}>
                      {topicInfo.evaluate || topicInfo.introduction}
                    </Paragraph>
                  </div>
                </Space>
              </InfoSection>
            </Col>
          </Row>
        </HeaderCard>

        {topicInfo.ep_list && topicInfo.ep_list.length > 0 && (
          <ChapterList
            title={
              <Space>
                <ReadOutlined />
                <Text strong>{t('cartoonDetail.chapterList')}</Text>
              </Space>
            }
          >
            <List
              dataSource={[...topicInfo.ep_list].sort((a, b) => b.ord - a.ord)}
              renderItem={(episode) => (
                <List.Item
                  onClick={() => handleChapterClick(episode)}
                  aria-disabled={episode.is_locked && !episode.is_in_free}
                  style={episode.is_locked && !episode.is_in_free ? { cursor: 'not-allowed', opacity: 0.6 } : undefined}
                  extra={<Text type="secondary" style={{ whiteSpace: 'nowrap' }}>{episode.pub_time}</Text>}
                >
                  <List.Item.Meta
                    avatar={
                      <Text style={{ fontSize: 16, fontWeight: 500, minWidth: 60 }}>
                        {t('cartoonDetail.episode')} {episode.short_title} {t('cartoonDetail.hua')}
                      </Text>
                    }
                    title={
                      <Space>
                        {episode.title}
                        {episode.is_locked && !episode.is_in_free && (
                          <Tag icon={<LockOutlined />}>{t('cartoonChapter.needPurchase')}</Tag>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </ChapterList>
        )}
      </ContentWrapper>
    </DetailContainer>
  )
}

export default CartoonDetail
