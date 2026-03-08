import React, { useState, useEffect } from 'react'
import { Card, Input, Button, Radio, RadioChangeEvent, Avatar, Tag, Skeleton, Tooltip, Badge, Dropdown, Image, Modal } from 'antd'
import { 
  SearchOutlined, 
  GithubOutlined, 
  LinkOutlined, 
  CalendarOutlined, 
  MessageOutlined,
  FireOutlined,
  DatabaseOutlined,
  CodeOutlined,
  DownOutlined,
  DownloadOutlined,
  ProjectOutlined,
  PaperClipOutlined,
  FilePdfOutlined
} from '@ant-design/icons'
import { 
  getAuthorNames, 
  getAuthorDataName, 
  getOrganizationName, 
  formatNumber, 
  formatParamCount, 
  getTaskTag, 
  getHardwareTag 
} from '@/utils/paper'
import { useTranslation } from 'react-i18next'
import { isMobileDevice } from '@/utils/isMobile'
import axios from 'axios'
interface AuthorData {
  _id: string;
  avatarUrl?: string;
  fullname: string;
  name: string;
  type: string;
  isPro?: boolean;
  isHf?: boolean;
  isHfAdmin?: boolean;
  isMod?: boolean;
  plan?: string;
  followerCount: number;
  isUserFollowing: boolean;
}

interface InferenceProvider {
  provider: string;
  modelStatus: string;
  providerStatus: string;
  providerId: string;
  task: string;
  adapterWeightsPath?: string;
  features?: {
    structuredOutput?: boolean;
    toolCalling?: boolean;
  };
  isCheapestPricingOutput?: boolean;
  isFastestThroughput?: boolean;
  isModelAuthor?: boolean;
  tokensPerSecond?: number;
  pricingOutput?: number;
}

interface ModelData {
  author: string;
  authorData?: AuthorData;
  downloads: number;
  gated: boolean;
  id: string;
  availableInferenceProviders?: InferenceProvider[];
  isLikedByUser: boolean;
  lastModified: string;
  likes: number;
  pipeline_tag?: string;
  private: boolean;
  repoType: 'model';
  widgetOutputUrls?: any[];
  numParameters?: number;
}

interface DatasetData {
  author: string;
  downloads: number;
  gated: boolean;
  id: string;
  isLikedByUser: boolean;
  lastModified: string;
  likes: number;
  private: boolean;
  repoType: 'dataset';
  datasetsServerInfo?: {
    viewer: string;
    numRows: number;
    libraries: string[];
    formats: string[];
    modalities: string[];
  };
  isBenchmark?: boolean;
}

interface SpaceData {
  author: string;
  authorData?: AuthorData;
  colorFrom: string;
  colorTo: string;
  createdAt: string;
  emoji: string;
  id: string;
  isLikedByUser: boolean;
  lastModified: string;
  likes: number;
  pinned: boolean;
  private: boolean;
  repoType: 'space';
  runtime?: {
    stage: string;
    hardware: {
      current: string;
      requested: string;
    };
    storage: string | null;
    gcTimeout: number;
    replicas: {
      current: number;
      requested: number | string;
    };
    devMode: boolean;
    domains: Array<{
      domain: string;
      stage: string;
    }>;
    sha: string;
  };
  shortDescription?: string;
  title: string;
  ai_short_description?: string;
  ai_category?: string;
  tags?: string[];
  featured?: boolean;
  originRepo?: {
    name: string;
    author: {
      _id: string;
      avatarUrl: string;
      fullname: string;
      name: string;
      type: string;
    };
  };
}

interface RepoData {
  recentlyTrending: Array<{
    repoData: ModelData | DatasetData | SpaceData;
    repoType: 'model' | 'dataset' | 'space';
  }>;
}

interface PaperDetail {
  id: string;
  authors: Array<{ name: string; _id: string }>;
  publishedAt: string;
  title: string;
  summary: string;
  upvotes: number;
  discussionId: string;
  ai_summary?: string;
  ai_keywords?: string[];
  githubRepo?: string;
  githubStars?: number;
  projectPage?: string;
  mediaUrls?: string[];
  thumbnail?: string;
  authorData?: AuthorData;
  pipeline_tag?: string;
  downloads?: number;
  numParameters?: number;
  lastModified: string;
  repoType: 'model' | 'dataset' | 'space' | 'paper';
  shortDescription?: string;
  ai_category?: string;
  datasetsServerInfo?: {
    numRows: number;
    modalities: string[];
  };
  runtime?: SpaceData['runtime'];
  isSpace?: boolean;
  numComments?: number;
  submittedBy?: AuthorData;
  organization?: {
    _id: string;
    name: string;
    fullname: string;
    avatar?: string;
  };
}

const PaperListPage: React.FC = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<string>('daily');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [papers, setPapers] = useState<PaperDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [repoTypeFilter, setRepoTypeFilter] = useState<string>('all');
  
  // 添加PDF弹窗相关的状态
  const [pdfModalVisible, setPdfModalVisible] = useState<boolean>(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string>('');
  const [currentPaperTitle, setCurrentPaperTitle] = useState<string>('');

  const API_PAPERS_URL = import.meta.env.VITE_PAPERS_API_URL || 'https://hf-mirror.com/api'

  // 获取每日论文数据
  const fetchDailyPapers = async () => {
    try {
      const response = await axios.get(`${API_PAPERS_URL}/daily_papers`)
      
      if (response.data && Array.isArray(response.data)) {
        const formattedPapers: PaperDetail[] = response.data.map((item: any) => ({
          id: item.paper?.id || item.id || Math.random().toString(),
          authors: item.paper?.authors || [],
          publishedAt: item.paper?.publishedAt || item.publishedAt,
          title: item.paper?.title || item.title,
          summary: item.paper?.summary || item.summary,
          upvotes: item.paper?.upvotes || 0,
          discussionId: item.paper?.discussionId || '',
          ai_summary: item.paper?.ai_summary,
          ai_keywords: item.paper?.ai_keywords,
          githubRepo: item.paper?.githubRepo,
          githubStars: item.paper?.githubStars,
          projectPage: item.paper?.projectPage,
          thumbnail: item.thumbnail,
          authorData: item.submittedBy || item.paper?.submittedOnDailyBy,
          lastModified: item.paper?.publishedAt || item.publishedAt,
          repoType: 'model',
          numComments: item.numComments,
          submittedBy: item.submittedBy,
          organization: item.organization,
        }))
        
        const processedPapers = formattedPapers.sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
        setPapers(processedPapers)
      } else {
        setFetchError(t('paper.apiError'))
        setPapers([])
      }
    } catch (error) {
      console.error('获取每日论文数据失败:', error)
      setFetchError(t('paper.loadError'))
      setPapers([])
    }
  }

  // 获取热门数据
  const fetchTrendingPapers = async () => {
    try {
      const response = await axios.get<RepoData>(`${API_PAPERS_URL}/trending`)
      
      if (response.data?.recentlyTrending && Array.isArray(response.data.recentlyTrending)) {
        const formattedPapers: PaperDetail[] = response.data.recentlyTrending.map((item) => {
          const repoData = item.repoData
          
          // 缩略图URL
          const generateThumbnail = (id: string) => {
            const parts = id.split('/')
            if (parts.length >= 2) {
              return `https://hf-mirror.com/front/thumbnails/${parts[0]}/${parts[1]}.png`
            }
            return undefined
          }
          
          // 根据不同类型处理数据
          if (item.repoType === 'model') {
            const modelData = repoData as ModelData
            return {
              id: modelData.id,
              authors: modelData.authorData ? [{ name: modelData.authorData.fullname, _id: modelData.authorData._id }] : [],
              publishedAt: modelData.lastModified,
              title: modelData.id,
              summary: modelData.pipeline_tag || 'AI模型',
              upvotes: modelData.likes,
              discussionId: modelData.id,
              thumbnail: generateThumbnail(modelData.id),
              authorData: modelData.authorData,
              pipeline_tag: modelData.pipeline_tag,
              downloads: modelData.downloads,
              numParameters: modelData.numParameters,
              lastModified: modelData.lastModified,
              repoType: 'model',
            }
          } else if (item.repoType === 'dataset') {
            const datasetData = repoData as DatasetData;
            return {
              id: datasetData.id,
              authors: [],
              publishedAt: datasetData.lastModified,
              title: datasetData.id,
              summary: t('paper.dataset'),
              upvotes: datasetData.likes,
              discussionId: datasetData.id,
              thumbnail: generateThumbnail(datasetData.id),
              downloads: datasetData.downloads,
              lastModified: datasetData.lastModified,
              repoType: 'dataset',
              datasetsServerInfo: datasetData.datasetsServerInfo,
            }
          } else if (item.repoType === 'space') {
            const spaceData = repoData as SpaceData
            return {
              id: spaceData.id,
              authors: spaceData.authorData ? [{ name: spaceData.authorData.fullname, _id: spaceData.authorData._id }] : [],
              publishedAt: spaceData.lastModified,
              title: spaceData.title,
              summary: spaceData.ai_short_description || spaceData.shortDescription || 'AI应用',
              upvotes: spaceData.likes,
              discussionId: spaceData.id,
              thumbnail: generateThumbnail(spaceData.id),
              authorData: spaceData.authorData,
              lastModified: spaceData.lastModified,
              repoType: 'space',
              shortDescription: spaceData.shortDescription,
              ai_category: spaceData.ai_category,
              runtime: spaceData.runtime,
              isSpace: true,
              projectPage: `https://huggingface.co/spaces/${spaceData.id}`,
            }
          }
          
          return {
            id: repoData.id,
            authors: [],
            publishedAt: repoData.lastModified,
            title: repoData.id,
            summary: '未知类型',
            upvotes: repoData.likes || 0,
            discussionId: repoData.id,
            thumbnail: generateThumbnail(repoData.id),
            lastModified: repoData.lastModified,
            repoType: item.repoType,
          } as PaperDetail
        })
        
        const processedPapers = formattedPapers.sort((a, b) => b.upvotes - a.upvotes)
        setPapers(processedPapers)
      } else {
        setFetchError(t('paper.hotApiError'))
        setPapers([])
      }
    } catch (error) {
      console.error('获取热门数据失败:', error)
      setFetchError(t('paper.hotLoadError'))
      setPapers([])
    }
  }

  // 获取数据
  const fetchPapers = async () => {
    setLoading(true)
    setFetchError(null)
    
    if (activeTab === 'daily') {
      await fetchDailyPapers()
    } else if (activeTab === 'trending') {
      await fetchTrendingPapers()
    }
    
    setLoading(false)
  }

  useEffect(() => {
    fetchPapers()
  }, [activeTab])

  const handleTabChange = (e: RadioChangeEvent) => {
    setActiveTab(e.target.value)
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // 根据类型获取标签颜色
  const getTypeTag = (repoType: string) => {
    switch (repoType) {
      case 'model':
        return { icon: <DatabaseOutlined />, color: 'blue', text: t('paper.model') }
      case 'dataset':
        return { icon: <DatabaseOutlined />, color: 'green', text: t('paper.dataset') }
      case 'space':
        return { icon: <CodeOutlined />, color: 'purple', text: t('paper.application') }
      case 'paper':
        return { icon: <FilePdfOutlined />, color: 'orange', text: t('paper.paper') }
      default:
        return { icon: null, color: 'default', text: t('paper.unknown') }
    }
  }

  // 处理PDF预览
  const handlePdfPreview = (pdfUrl: string, paperTitle: string) => {
    if (isMobileDevice()) {
      let viewerUrl = ''
      try {
        viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`
      } catch (error) {
        viewerUrl = `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`
      }
      setCurrentPdfUrl(viewerUrl)
      setCurrentPaperTitle(paperTitle)
      setPdfModalVisible(true)
    } else {
      setCurrentPdfUrl(pdfUrl)
      setCurrentPaperTitle(paperTitle)
      setPdfModalVisible(true)
    }
  }

  // 关闭PDF弹窗
  const handlePdfModalClose = () => {
    setPdfModalVisible(false)
    setCurrentPdfUrl('')
    setCurrentPaperTitle('')
  }

  // 获取所有可用链接
  const getAllLinks = (paper: PaperDetail) => {
    const links = []

    // 论文链接（如果是arXiv ID）
    if (paper.id && paper.id.match(/^\d{4}\.\d{5}$/)) {
      links.push({
        key: 'arxiv',
        icon: <PaperClipOutlined />,
        href: `https://arxiv.org/pdf/${paper.id}`,
        tooltip: '查看论文',
        type: 'default' as const,
        flag: true
      })
    }
    
    // HuggingFace详情链接
    if (paper.id) {
      links.push({
        key: 'hf-detail',
        icon: <LinkOutlined />,
        // 如果是daily paper，https://huggingface.co/papers/${paper.id}
        // 如果是trending paper，如果是数据集：https://huggingface.co/datasets/${paper.id}，如果是应用：https://huggingface.co/spaces/${paper.id}，如果是模型：https://huggingface.co/${paper.id}
        href: activeTab === 'daily' ? `https://hf-mirror.com/papers/${paper.id}` : (paper.repoType === 'dataset' ? `https://hf-mirror.com/datasets/${paper.id}` : (paper.repoType === 'space' ? `https://huggingface.co/spaces/${paper.id}` : `https://hf-mirror.com/${paper.id}`)),
        tooltip: t('paper.showDetail'),
        type: 'primary' as const
      })
    }
    
    // GitHub链接
    if (paper.githubRepo) {
      links.push({
        key: 'github',
        icon: <GithubOutlined />,
        href: paper.githubRepo,
        tooltip: t('paper.github'),
        type: 'default' as const
      })
    }
    
    // 项目主页链接
    if (paper.projectPage) {
      links.push({
        key: 'project',
        icon: <ProjectOutlined />,
        href: paper.projectPage,
        tooltip: t('paper.project'),
        type: 'default' as const
      })
    }
    
    // 论文链接（如果是arXiv ID）- 这里是摘要链接
    if (paper.id && paper.id.match(/^\d{4}\.\d{5}$/)) {
      links.push({
        key: 'arxiv-abs',
        icon: <PaperClipOutlined />,
        href: `https://arxiv.org/abs/${paper.id}`,
        tooltip: t('paper.arXiv'),
        type: 'default' as const
      })
    }
    
    return links
  }

  // 筛选论文
  const filteredPapers = papers.filter(paper => {
    // 先按类型过滤
    if (repoTypeFilter !== 'all' && paper.repoType !== repoTypeFilter) {
      return false
    }
    
    if (!searchQuery.trim()) return true
    
    const searchLower = searchQuery.toLowerCase()
    return (
      paper.title.toLowerCase().includes(searchLower) ||
      paper.summary.toLowerCase().includes(searchLower) ||
      getAuthorNames(paper.authors).toLowerCase().includes(searchLower) ||
      getAuthorDataName(paper.authorData).toLowerCase().includes(searchLower) ||
      (paper.pipeline_tag && paper.pipeline_tag.toLowerCase().includes(searchLower)) ||
      (paper.ai_category && paper.ai_category.toLowerCase().includes(searchLower)) ||
      (paper.organization && getOrganizationName(paper.organization).toLowerCase().includes(searchLower))
    )
  })

  // 类型筛选菜单
  const repoTypeMenuItems = [
    { key: 'all', label: t('paper.all') },
    { key: 'model', label: t('paper.model') },
    { key: 'dataset', label: t('paper.dataset') },
    { key: 'space', label: t('paper.application') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('paper.title')}</h1>
              <p className="text-gray-600 text-sm mt-1">{t('paper.content')}</p>
              <p className="text-black-400 text-xs mt-1">{t('paper.dataSource')}</p>
              <span className="text-red-400 text-xs mt-1">{t('paper.tip')}</span>
            </div>
            
            <div className="mt-3 sm:mt-0">
              <Radio.Group 
                value={activeTab} 
                onChange={handleTabChange}
                optionType="button"
                buttonStyle="solid"
                size="small"
                className="bg-white rounded-lg flex"
              >
                <Radio.Button value="daily" className="px-3 py-1 text-sm">{t('paper.today')}</Radio.Button>
                <Radio.Button value="trending" className="px-3 py-1 text-sm flex items-center">
                  <FireOutlined className="mr-1" /> {t('paper.hot')}
                </Radio.Button>
              </Radio.Group>
            </div>
          </div>

          {/* 搜索和筛选区域 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex-1">
              <Input
                size="middle"
                placeholder={t('paper.search')}
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
                className="rounded-lg"
              />
            </div>
            
            {activeTab === 'trending' && (
              <Dropdown
                menu={{
                  items: repoTypeMenuItems,
                  selectedKeys: [repoTypeFilter],
                  onClick: (e) => setRepoTypeFilter(e.key)
                }}
                placement="bottomRight"
              >
                <Button className="rounded-lg">
                  {repoTypeFilter === 'all' ? t('paper.all') : 
                   repoTypeFilter === 'model' ? t('paper.model') :
                   repoTypeFilter === 'dataset' ? t('paper.dataset') : t('paper.application')}
                  <DownOutlined />
                </Button>
              </Dropdown>
            )}
          </div>
          
          {searchQuery && (
            <div className="text-xs text-gray-500 mt-2">
              <span>{t('paper.found')} {filteredPapers.length} {t('paper.relatedResults')}</span>
            </div>
          )}
        </header>

        {/* 主要内容区域 */}
        <main>
          {fetchError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="flex items-center justify-between">
                <span>{fetchError}</span>
                <Button type="link" size="small" onClick={fetchPapers} className="p-0">
                  {t('paper.retry')}
                </Button>
              </div>
            </div>
          )}

          {loading ? (
            // 先加载骨架屏
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="bg-white rounded-lg border p-3">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </div>
              ))}
            </div>
          ) : filteredPapers.length > 0 ? (
            <div className="space-y-3">
              {filteredPapers.map((paper, index) => {
                if (activeTab === 'daily') {
                  paper.repoType = 'paper'
                }
                const typeTag = getTypeTag(paper.repoType);
                const isTrending = activeTab === 'trending';
                const allLinks = getAllLinks(paper);
                const taskTag = getTaskTag(paper.pipeline_tag);
                const hardwareTag = getHardwareTag(paper.runtime);
                
                return (
                  <Card
                    key={`${paper.id}-${index}`}
                    className="rounded-lg border hover:border-blue-300 hover:shadow-sm transition-all duration-200 bg-white"
                    bodyStyle={{ padding: '12px' }}
                  >
                    <div className="flex">
                      {/* 左侧：封面图 */}
                      {paper.thumbnail && activeTab === 'daily' && (
                        <div className="flex-shrink-0 w-[30%] h-full mr-4">
                          <Image
                            src={paper.thumbnail}
                            alt={paper.title}
                            className="w-full h-full object-cover rounded border border-gray-200"
                          />
                        </div>
                      )}

                      {/* 中间：内容区域 */}
                      <div className="flex-1 min-w-0">
                        {/* 标题和标签行 */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center flex-1 mr-2">
                            {isTrending && index < 3 && (
                              <Badge
                                count={`🔥 Top ${index + 1}`}
                                style={{ 
                                  backgroundColor: '#dc2626',
                                  fontSize: '10px',
                                  padding: '0 4px',
                                  height: '18px',
                                  lineHeight: '18px',
                                  marginRight: '8px'
                                }}
                              />
                            )}
                            <h3 className="text-base font-semibold text-gray-900 line-clamp-1 flex-1">
                              {paper.title}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* 类型标签 */}
                            <Tag 
                              color={typeTag.color} 
                              icon={typeTag.icon}
                              className="text-xs"
                            >
                              {activeTab === 'daily' ? t('paper.paper') : typeTag.text}
                            </Tag>
                            
                            {/* 点赞数 */}
                            {paper.upvotes >= 20 && (
                              <Badge
                                count={`🔥 ${formatNumber(paper.upvotes)}`}
                                style={{ 
                                  backgroundColor: '#f97316',
                                  fontSize: '11px',
                                  padding: '0 6px',
                                  height: '20px',
                                  lineHeight: '20px'
                                }}
                              />
                            )}
                          </div>
                        </div>

                        {/* 关键词 */}
                          {paper.ai_keywords && paper.ai_keywords.length > 0 && !isMobileDevice() && (
                            <div className="flex items-center overflow-auto mb-2" style={{ scrollbarWidth: 'none' }}>
                              {
                                paper.ai_keywords.map((keyword, index) => (
                                  <Tag key={index} color="cyan" className="text-xs">
                                    {keyword}
                                  </Tag>
                                ))
                              }
                            </div>
                          )}
                          {paper.ai_keywords && paper.ai_keywords.length > 0 && isMobileDevice() && (
                            <div className="flex items-center overflow-auto mb-2" style={{ scrollbarWidth: 'none' }}>
                              {/* 随机展示一个paper.ai_keywords的tag标签 */}
                              <Tag key={0} color="cyan" className="text-xs">
                                {paper.ai_keywords[Math.floor(Math.random() * paper.ai_keywords.length)]}
                              </Tag>
                            </div>
                          )}

                        {/* 摘要/描述 */}
                        <p className="text-gray-600 text-sm mb-2 line-clamp-2 leading-relaxed">
                          {paper.summary || paper.ai_summary}
                        </p>

                        {/* 元信息行 */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-2">
                          {/* 作者/机构信息 */}
                          {(paper.authorData || paper.authors.length > 0 || paper.organization) && (
                            <div className="flex items-center">
                              <Avatar 
                                size={16}
                                src={paper.authorData?.avatarUrl || paper.organization?.avatar}
                                className="mr-1"
                              />
                              <span className="font-medium text-gray-700">
                                {getAuthorNames(paper.authors) || 
                                 getAuthorDataName(paper.authorData) || 
                                 getOrganizationName(paper.organization)}
                              </span>
                            </div>
                          )}

                          {/* 任务类型标签 */}
                          {taskTag && (
                            <div className="flex items-center">
                              <Tag color="cyan" className="text-xs">
                                {taskTag}
                              </Tag>
                            </div>
                          )}

                          {/* 时间信息 */}
                          {paper.publishedAt && (
                            <div className="flex items-center">
                              <CalendarOutlined className="mr-1" />
                              <span>{new Date(paper.publishedAt).toLocaleString()}</span>
                            </div>
                          )}
                        </div>

                        {/* 统计信息行 */}
                        <div className="flex flex-wrap gap-3 mb-3 text-xs text-gray-600">
                          {/* 下载量 */}
                          {paper.downloads !== undefined && paper.downloads > 0 && (
                            <div className="flex items-center">
                              <DownloadOutlined className="mr-1" />
                              <span>{formatNumber(paper.downloads)}</span>
                            </div>
                          )}
                          
                          {/* 评论数 */}
                          {paper.numComments !== undefined && paper.numComments > 0 && (
                            <div className="flex items-center">
                              <MessageOutlined className="mr-1" />
                              <span>{paper.numComments}</span>
                            </div>
                          )}
                          
                          {/* 参数量 */}
                          {paper.numParameters && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">{t('paper.parameterCount')}</span>
                              <span>{formatParamCount(paper.numParameters)}</span>
                            </div>
                          )}
                          
                          {/* 数据集大小 */}
                          {paper.datasetsServerInfo && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">{t('paper.dataSize')}</span>
                              <span>{formatNumber(paper.datasetsServerInfo.numRows)}</span>
                            </div>
                          )}
                          
                          {/* 应用硬件 */}
                          {hardwareTag && (
                            <div className="flex items-center">
                              <span className="font-medium mr-1">{t('paper.hardware')}</span>
                              <span>{hardwareTag}</span>
                            </div>
                          )}
                        </div>

                        {/* 链接按钮行 */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          {/* 左侧：分类信息 */}
                          <div className="flex items-center">
                            {paper.ai_category && (
                              <span className="text-xs text-gray-600 px-2 py-1 bg-gray-100 rounded">
                                {paper.ai_category}
                              </span>
                            )}
                          </div>

                          {/* 右侧：所有链接按钮 */}
                          <div className="flex items-center space-x-2">
                            {allLinks.map((link) => {
                              // 如果是flag为true的链接，显示PDF预览按钮
                              if (link.flag) {
                                return (
                                  <Button
                                    type="default"
                                    key={link.key}
                                    size="small"
                                    icon={<FilePdfOutlined />}
                                    onClick={() => handlePdfPreview(link.href, paper.title)}
                                    className="p-1 text-xs bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                                  >
                                    PDF
                                  </Button>
                                );
                              }
                              
                              // 普通链接按钮
                              return (
                                <Tooltip key={link.key} title={link.tooltip}>
                                  <Button
                                    type={link.type}
                                    size="small"
                                    icon={link.icon}
                                    href={link.href}
                                    target="_blank"
                                    className="p-1 text-xs"
                                  >
                                    {link.type === 'primary' && t('paper.detail')}
                                  </Button>
                                </Tooltip>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            // 无结果状态
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
                <SearchOutlined className="text-xl text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? t('paper.noResult') : t('paper.noData')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {searchQuery 
                  ? t('paper.tryDifferentKeywords') 
                  : t('paper.networkError')}
              </p>
              {searchQuery && (
                <Button 
                  type="link" 
                  onClick={() => setSearchQuery('')}
                  className="text-sm"
                >
                  {t('paper.clearSearch')}
                </Button>
              )}
            </div>
          )}
        </main>

        {/* PDF预览弹窗 */}
        <Modal
          title={
            <div className="flex items-center">
              <FilePdfOutlined className="text-red-500 mr-2" />
              <span className="font-medium">{currentPaperTitle}</span>
            </div>
          }
          open={pdfModalVisible}
          onCancel={handlePdfModalClose}
          footer={null}
          width="80%"
          style={{ top: 20 }}
          styles={{ body: { height: '80vh', padding: 0 } }}
        >
          {currentPdfUrl && (
            <iframe
              src={`${currentPdfUrl}#view=FitH`}
              title={`PDF - ${currentPaperTitle}`}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
              className="w-full h-full"
            />
          )}
        </Modal>
      </div>
    </div>
  )
}

export default PaperListPage