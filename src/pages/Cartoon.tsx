import React, { useState, useEffect } from 'react'
import {
  Typography,
  Row,
  Col,
  Card,
  Tabs,
  Spin,
  message,
  Skeleton,
  Tag,
  Input,
  Space
} from 'antd'
import {
  SearchOutlined,
  StarOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { Title, Text, Paragraph } = Typography
const { Search } = Input
const coverFallback = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="#f0f2f5"/><g fill="none" stroke="#bfbfbf" stroke-width="3"><rect x="72" y="112" width="56" height="48" rx="4"/><circle cx="88" cy="126" r="5"/><path d="m74 153 16-16 12 12 10-10 14 14"/></g></svg>')}`

const CartoonContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 80px 24px 24px;

  @media (max-width: 768px) {
    padding: 70px 16px 16px;
  }
`

const ContentWrapper = styled.div`
  max-width: 1400px;
  margin: 0 auto;
`

const StyledCard = styled(Card)`
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  height: 100%;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
  }

  .ant-card-cover {
    overflow: hidden;
  }

  .ant-card-cover img {
    transition: transform 0.3s ease;
  }

  &:hover .ant-card-cover img {
    transform: scale(1.05);
  }

  .ant-card-body {
    padding: 16px;
  }
`

const CoverContainer = styled.div`
  position: relative;
  width: 100%;
  height: 280px;
  background: #f0f2f5;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: opacity 0.2s ease;
  }

  .cover-loading {
    position: absolute;
    inset: 0;
    background: #f0f2f5;
    z-index: 1;
  }

  .cover-loading .ant-skeleton {
    width: 100%;
    height: 100%;
  }

  @media (max-width: 768px) {
    height: 200px;
  }
`

const CartoonImage: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const { t } = useTranslation()
  const [loaded, setLoaded] = useState(!src)
  const [failed, setFailed] = useState(false)

  return (
    <CoverContainer>
      <img
        src={failed || !src ? coverFallback : src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        style={{ opacity: loaded ? 1 : 0 }}
        onLoad={() => setLoaded(true)}
        onError={() => { setFailed(true); setLoaded(true) }}
      />
      {!loaded && (
        <div className="cover-loading" role="status" aria-label={t('common.loading')}>
          <Skeleton.Image active style={{ width: '100%', height: '100%' }} />
        </div>
      )}
    </CoverContainer>
  )
}

const DescriptionText = styled.div`
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.5;
  max-height: 36px;
  word-break: break-word;
`

const HeaderSection = styled.div`
  margin-bottom: 32px;
  text-align: center;

  h1 {
    font-size: 2.5rem;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }

  p {
    font-size: 1rem;
    color: #666;
  }
`

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 24px;
  }

  .ant-tabs-tab {
    font-size: 16px;
    font-weight: 500;
  }
`

interface RankType {
  id: number;
  name: string;
  description: string;
}

interface BComicListItem {
  id?: number;
  comic_id?: number;
  title: string;
  org_title?: string;
  comic_introduction?: string;
  vertical_cover?: string;
  author_name?: string[];
  author?: string[];
  fans?: string;
  is_finish: number;
}

interface CartoonData {
  id: number;
  title: string;
  description: string;
  cover?: string;
  views_count?: number;
  likes_count?: number;
  is_finish?: number;
}

const formatCartoon = (comic: BComicListItem): CartoonData => ({
  id: comic.comic_id ?? comic.id!,
  title: comic.org_title || comic.title,
  description: comic.comic_introduction || (comic.author_name || comic.author)?.join(' / ') || '',
  cover: comic.vertical_cover?.replace(/^http:/, 'https:'),
  views_count: Number(comic.fans) || undefined,
  is_finish: comic.is_finish
})

const Cartoon: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [rankTypes, setRankTypes] = useState<RankType[]>([])
  const [cartoonList, setCartoonList] = useState<CartoonData[]>([])
  const [selectedRankId, setSelectedRankId] = useState<number | null>(null)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<CartoonData[]>([])

  // 获取排行榜类型列表
  useEffect(() => {
    fetchRankTypes()
  }, [])

  // 获取排行榜类型列表
  const fetchRankTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/bcomic/ListRank')
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (data.code === 0 && data.data?.list) {
        setRankTypes(data.data.list)
        // 默认选择第一个排行榜
        if (data.data.list.length > 0) {
          const firstRankId = data.data.list[0].id ?? data.data.default_id
          setSelectedRankId(firstRankId)
          await fetchCartoonList(firstRankId)
        }
      }
    } catch (error) {
      console.error('获取排行榜类型失败:', error)
      message.error(t('cartoon.fetchRankTypesFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 获取漫画列表
  const fetchCartoonList = async (rankId: number) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/bcomic/GetRankInfo?id=${rankId}&offset=0&subId=0`
      )
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (data.code === 0 && data.data?.list) {
        setCartoonList(data.data.list.map(formatCartoon))
      }
    } catch (error) {
      console.error('获取漫画列表失败:', error)
      message.error(t('cartoon.fetchCartoonListFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 处理排行榜切换
  const handleTabChange = (key: string) => {
    const rankId = parseInt(key)
    setSelectedRankId(rankId)
    fetchCartoonList(rankId)
  }

  // 处理漫画卡片点击
  const handleCardClick = (cartoon: CartoonData) => {
    navigate(`/cartoon/${cartoon.id}`)
  }

  // 格式化数字显示
  const formatNumber = (num: number = 0) => {
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万'
    }
    return num.toString()
  }

  // 搜索漫画
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      message.warning(t('cartoon.enterKeyword'))
      return
    }

    try {
      setLoading(true)
      setIsSearching(true)
      const response = await fetch(`/api/bcomic/Search?styleId=-1&areaId=-1&isFinish=-1&order=-1&pageNum=1&pageSize=20&isFree=-1&keyWord=${encodeURIComponent(keyword)}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()

      if (data.code === 0 && data.data?.list) {
        const formattedData: CartoonData[] = data.data.list.map(formatCartoon)
        setSearchResults(formattedData)
        message.success(t('cartoon.foundResults').replace('X', formattedData.length.toString()))
      } else {
        setSearchResults([])
        message.info(t('cartoon.noResults'))
      }
    } catch (error) {
      console.error('搜索失败:', error)
      message.error(t('cartoon.searchFailed'))
    } finally {
      setLoading(false)
    }
  }

  // 清除搜索
  const handleClearSearch = () => {
    setIsSearching(false)
    setSearchResults([])
    setSearchKeyword('')
  }

  const tabItems = rankTypes.map(rankType => ({
    key: rankType.id.toString(),
    label: rankType.name
  }))

  return (
    <CartoonContainer>
      <ContentWrapper>
        <HeaderSection>
          <Title>{t('cartoon.subTitle')}</Title>
          <Paragraph>{t('cartoon.description')}</Paragraph>
          <Search
            placeholder={t('cartoon.searchPlaceholder')}
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            style={{ maxWidth: 500, marginTop: 16 }}
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onSearch={value => {
              if (value) {
                handleSearch(value)
              } else {
                handleClearSearch()
              }
            }}
            onClear={handleClearSearch}
          />
        </HeaderSection>

        <Spin spinning={loading} tip={t('common.loading')}>
          {isSearching ? (
            <>
              {searchResults.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Text type="secondary">
                      {t('cartoon.searchResults')} <Text strong>{searchResults.length}</Text> {t('cartoon.relatedCartoons')}
                    </Text>
                  </Space>
                </div>
              )}

              <Row gutter={[24, 24]}>
                {searchResults.map(cartoon => (
                  <Col xs={12} sm={8} md={6} lg={4} xl={4} key={cartoon.id}>
                    <StyledCard
                      hoverable
                      cover={
                        <div
                          style={{ overflow: 'hidden', position: 'relative' }}
                          onClick={() => handleCardClick(cartoon)}
                        >
                          <CartoonImage
                            key={cartoon.cover}
                            src={cartoon.cover}
                            alt={cartoon.title}
                          />
                          {cartoon.is_finish === 1 && (
                            <Tag color="success" style={{ position: 'absolute', top: 8, right: 8 }}>
                              {t('cartoon.finished')}
                            </Tag>
                          )}
                          {cartoon.views_count && (
                            <Text style={{ position: 'absolute', left: 8, bottom: 8, padding: '2px 8px', borderRadius: 10, color: '#fff', background: 'rgba(0, 0, 0, 0.55)', fontSize: 12 }}>
                              <EyeOutlined /> {formatNumber(cartoon.views_count)}
                            </Text>
                          )}
                        </div>
                      }
                      onClick={() => handleCardClick(cartoon)}
                    >
                      <Card.Meta
                        title={
                          <Text ellipsis={{ tooltip: cartoon.title }} strong>
                            {cartoon.title}
                          </Text>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <DescriptionText title={cartoon.description}>
                              {cartoon.description}
                            </DescriptionText>
                            {cartoon.likes_count && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <StarOutlined /> {formatNumber(cartoon.likes_count)}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </StyledCard>
                  </Col>
                ))}
              </Row>

              {searchResults.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  {t('cartoon.noResults')}
                </div>
              )}
            </>
          ) : (
            <>
              <StyledTabs
                activeKey={selectedRankId?.toString() || ''}
                items={tabItems}
                onChange={handleTabChange}
                type="card"
              />

              <Row gutter={[24, 24]}>
                {cartoonList.map(cartoon => (
                  <Col xs={12} sm={8} md={6} lg={4} xl={4} key={cartoon.id}>
                    <StyledCard
                      hoverable
                      cover={
                        <div
                          style={{ overflow: 'hidden', position: 'relative' }}
                          onClick={() => handleCardClick(cartoon)}
                        >
                          <CartoonImage
                            key={cartoon.cover}
                            src={cartoon.cover}
                            alt={cartoon.title}
                          />
                          {cartoon.is_finish === 1 && (
                            <Tag color="success" style={{ position: 'absolute', top: 8, right: 8 }}>
                              {t('cartoon.finished')}
                            </Tag>
                          )}
                          {cartoon.views_count && (
                            <Text style={{ position: 'absolute', left: 8, bottom: 8, padding: '2px 8px', borderRadius: 10, color: '#fff', background: 'rgba(0, 0, 0, 0.55)', fontSize: 12 }}>
                              <EyeOutlined /> {formatNumber(cartoon.views_count)}
                            </Text>
                          )}
                        </div>
                      }
                      onClick={() => handleCardClick(cartoon)}
                    >
                      <Card.Meta
                        title={
                          <Text ellipsis={{ tooltip: cartoon.title }} strong>
                            {cartoon.title}
                          </Text>
                        }
                        description={
                          <Space direction="vertical" size={4}>
                            <DescriptionText title={cartoon.description}>
                              {cartoon.description}
                            </DescriptionText>
                            {cartoon.likes_count && (
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                <StarOutlined /> {formatNumber(cartoon.likes_count)}
                              </Text>
                            )}
                          </Space>
                        }
                      />
                    </StyledCard>
                  </Col>
                ))}
              </Row>

              {cartoonList.length === 0 && !loading && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                  {t('cartoon.noData')}
                </div>
              )}
            </>
          )}
        </Spin>
      </ContentWrapper>
    </CartoonContainer>
  )
}

export default Cartoon
