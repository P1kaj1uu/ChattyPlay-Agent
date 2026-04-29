import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Modal, Spin, message, Tag, Button, Input, Badge, Divider, Tooltip, Form } from 'antd'
import {
  GithubOutlined,
  MailOutlined,
  WechatOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  RocketOutlined,
  CustomerServiceOutlined,
  FileProtectOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import styled, { keyframes } from 'styled-components'
import { meImage, payImage, wxImage } from '@/utils/images'

const { Title, Paragraph } = Typography
const { useForm } = Form

// 动画定义
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`

const PageContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 200px);
  background: linear-gradient(135deg, #f5f7fa 0%, #eef2f7 100%);
`

const SectionTitle = styled.h2`
  margin-bottom: 48px;
  text-align: center;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2);
    border-radius: 2px;
  }
`

const AboutCard = styled(Card)`
  border-radius: 20px;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  height: 100%;
  overflow: hidden;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(102, 126, 234, 0.15);
  }

  .ant-card-head {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    border-radius: 20px 20px 0 0;
    border-bottom: none;
    
    .ant-card-head-title {
      color: #fff;
    }
  }
`

const ProfileCard = styled(Card)`
  border-radius: 20px;
  border: none;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  text-align: center;
  height: 100%;
  background: linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 16px 40px rgba(102, 126, 234, 0.15);
  }

  .profile-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin: 0 auto 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    padding: 4px;
    animation: ${float} 3s ease-in-out infinite;
    
    img {
      border-radius: 50%;
      border: 3px solid #fff;
    }
  }
`

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 24px 0;

  a, span {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
    transition: all 0.3s ease;
    font-size: 1.4rem;
    cursor: pointer;

    &:hover {
      transform: translateY(-3px);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      
      a, span {
        color: #fff !important;
      }
    }
  }

  a {
    color: #667eea;
  }

  span {
    color: #667eea;
  }
`

const TechList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 16px;

  .tech-tag {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #fff;
    padding: 6px 14px;
    border-radius: 24px;
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s ease;
    cursor: default;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  }
`

const WeChatIcon = styled.span``

const ModalContent = styled.div`
  text-align: center;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`

const CarouselContainer = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 380px;
`

const CarouselSlide = styled.div<{ isVisible: boolean; slideDirection: 'left' | 'right' }>`
  display: ${props => (props.isVisible ? 'flex' : 'none')};
  width: 100%;
  flex-direction: column;
  align-items: center;
  animation: slide${props => (props.slideDirection === 'left' ? 'Left' : 'Right')} 0.4s
    cubic-bezier(0.4, 0, 0.2, 1);

  @keyframes slideLeft {
    from {
      opacity: 0;
      transform: translateX(50px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }

  @keyframes slideRight {
    from {
      opacity: 0;
      transform: translateX(-50px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(0) scale(1);
    }
  }
`

const QRImage = styled.img`
  width: 100%;
  max-width: 280px;
  border-radius: 20px;
  box-shadow: 0 12px 40px rgba(102, 126, 234, 0.25);
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 20px 48px rgba(102, 126, 234, 0.35);
  }
`

const SlideTitle = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  letter-spacing: 1px;
`

const NavigationButton = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  z-index: 10;

  &:hover {
    transform: translateY(-50%) scale(1.15);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: translateY(-50%) scale(1.05);
  }

  &.prev {
    left: -30px;
  }

  &.next {
    right: -30px;
  }
`

// 美化后的商品卡片样式
const ProductCard = styled(Card)`
  border-radius: 16px;
  border: 1px solid rgba(102, 126, 234, 0.1);
  background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%);
  transition: all 0.3s ease;
  margin-bottom: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover {
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 16px 32px rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
    
    &::before {
      transform: scaleX(1);
    }
  }

  .ant-card-body {
    padding: 18px;
  }
`

const ProductHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
`

const ProductName = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #1a1a2e;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
`

const ProductTags = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
`

const ProductPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 20px;
  font-weight: bold;
  color: #00b42a;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.06);
`

const PriceUnit = styled.span`
  font-size: 12px;
  font-weight: normal;
  color: #999;
`

const ProductDesc = styled(Paragraph)`
  font-size: 13px;
  color: #666;
  margin-bottom: 0;
  line-height: 1.5;
`

const ProductsTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
  color: #1a1a2e;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, #667eea, transparent);
    margin-left: 12px;
  }
`

const ProductsContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`

// 购买须知样式
const NoticeSection = styled.div`
  margin-top: 28px;
  padding: 18px;
  background: linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%);
  border-radius: 16px;
  border-left: 4px solid #ff9800;
  animation: ${slideUp} 0.5s ease-out;

  .notice-title {
    font-weight: 700;
    margin-bottom: 12px;
    color: #ff9800;
    font-size: 15px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .notice-list {
    margin: 0;
    padding-left: 20px;
    color: #666;
    font-size: 12px;
  }

  .notice-list li {
    margin-bottom: 8px;
    line-height: 1.5;
  }

  .notice-list li.red {
    color: #ff4d4f;
    font-weight: 500;
  }
`

// 商品详情弹窗样式
const DetailModal = styled(Modal)`
  .ant-modal-content {
    border-radius: 24px;
    overflow: hidden;
  }
  
  .ant-modal-header {
    border-bottom: 1px solid rgba(102, 126, 234, 0.1);
    padding: 20px 24px;
    background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
  }

  .ant-modal-body {
    padding: 24px;
  }

  .detail-header {
    margin-bottom: 8px;
  }

  .detail-title {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 12px;
    color: #1a1a2e;
  }

  .detail-info {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
  }

  .detail-info-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #666;
    font-size: 13px;
    background: #f5f5f5;
    padding: 4px 12px;
    border-radius: 20px;
  }

  .detail-image {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: 16px;
    margin-bottom: 20px;
  }

  .detail-price {
    font-size: 28px;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea, #764ba2);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 20px;
  }

  .detail-desc {
    color: #666;
    margin-bottom: 24px;
    line-height: 1.6;
    
    strong {
      color: #333;
      display: block;
      margin-bottom: 8px;
    }
    
    p {
      margin-bottom: 12px;
    }
  }

  .buy-section {
    margin-top: 16px;
  }
`

// 统计数字样式
const StatsRow = styled.div`
  display: flex;
  justify-content: space-around;
  margin: 20px 0 16px;
  padding: 12px;
  background: linear-gradient(135deg, #667eea08, #764ba208);
  border-radius: 16px;
`

const StatItem = styled.div`
  text-align: center;
  
  .stat-number {
    font-size: 20px;
    font-weight: 700;
    color: #667eea;
  }
  
  .stat-label {
    font-size: 12px;
    color: #999;
    margin-top: 4px;
  }
`

const About: React.FC = () => {
  const { t } = useTranslation()
  const technologies = ['Vue', 'React', 'TypeScript', 'JavaScript', 'Node.js', 'Java', 'Kotlin', 'Python', 'MySQL', 'Docker', 'Nginx']

  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right')
  
  // 商品相关状态
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [form] = useForm()

  const slides = [
    { image: payImage, title: t('about.supportMe') },
    { image: wxImage, title: t('about.addMe') }
  ]

  // 获取商品列表
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await fetch(`${import.meta.env.VITE_PAY_URL}/mapi/merchant/info`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PAY_BEARER_KEY}`,
            'X-Idr-Locale': 'zh-cn',
            'Content-Type': 'application/json',
          },
        })
        
        const data = await response.json()
        if (data.code === 0 && data.result?.projects) {
          const allProducts = data.result.projects.flatMap((project: any) => 
            (project.skus || []).map((sku: any) => ({
              id: sku.id,
              name: sku.name,
              desc: sku.desc,
              price: sku.pricing?.price,
              currency: sku.pricing?.currency || 'CNY',
              stock: sku.stock || 999999,
              autoDelivery: sku.auto_delivery || true,
              projectName: project.name,
              projectId: project.id,
              cover: project.cover,
              link: project.link,
            }))
          )
          setProducts(allProducts)
        }
      } catch (error) {
        console.error('获取商品失败:', error)
        message.error('获取商品列表失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [])

  const handlePrevSlide = () => {
    setSlideDirection('right')
    setCurrentSlide(prev => (prev === 0 ? slides.length - 1 : prev - 1))
  }

  const handleNextSlide = () => {
    setSlideDirection('left')
    setCurrentSlide(prev => (prev === slides.length - 1 ? 0 : prev + 1))
  }

  // 打开商品详情
  const handleOpenDetail = (product: any) => {
    setSelectedProduct(product)
    form.setFieldsValue({ quantity: '', contactInfo: '', coupon: '' })
    setIsDetailModalVisible(true)
  }

  // 创建订单
  const createOrder = async (values: any) => {
    const { quantity, contactInfo, coupon } = values
    const product = selectedProduct

    const quantityNumber = parseInt(quantity, 10)

    const res = await fetch(`${import.meta.env.VITE_PAY_URL}/mapi/order/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_PAY_BEARER_KEY}`,
        'X-Idr-Locale': 'zh-cn',
      },
      body: JSON.stringify({
        projectId: product.projectId,
        skuId: product.id,
        orderInfo: {
          maxQuantity: 100,
          quantity: quantityNumber,
          coupon: coupon || '',
          contactInfo: contactInfo || ''
        }
      }),
    })

    const data = await res.json()
    if (data.code !== 0) throw new Error(data.message || '创建订单失败')
    return data.result.orderId
  }

  // 获取支付链接
  const getPayUrl = async (orderId: string) => {
    const res = await fetch(`${import.meta.env.VITE_PAY_URL}/mapi/order/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_PAY_BEARER_KEY}`,
        'X-Idr-Locale': 'zh-cn',
      },
      body: JSON.stringify({
        id: orderId,
        method: 'alipay',
        redirectUrl: window.location.href,
      }),
    })

    const data = await res.json()
    if (data.code !== 0) throw new Error(data.message || '获取支付链接失败')
    return data.result.payUrl
  }

  // 下单主流程
  const handleBuy = async () => {
    try {
      setBuyLoading(true)
      const values = await form.validateFields()
      message.loading('创建订单中...', 0)

      const orderId = await createOrder(values)
      message.destroy()
      message.loading('获取支付链接...', 0)

      const payUrl = await getPayUrl(orderId)
      message.destroy()

      Modal.info({
        title: '订单创建成功',
        content: '即将跳转到支付页面，请完成付款',
        onOk: () => {
          window.open(payUrl, '_blank')
          setIsDetailModalVisible(false)
        },
      })
    } catch (err: any) {
      message.destroy()
      message.error(err.message || '下单失败')
    } finally {
      setBuyLoading(false)
    }
  }

  return (
    <PageContainer>
      <SectionTitle>
        <RocketOutlined style={{ marginRight: 12 }} />
        {t('about.title')}
      </SectionTitle>
      
      {/* 三列布局 */}
      <Row gutter={[24, 24]}>
        {/* 第一列：个人信息 */}
        <Col xs={24} md={8} lg={7}>
          <ProfileCard>
            <div className="profile-avatar">
              <img
                src={meImage}
                alt="My Logo"
                style={{ width: '112px', height: '112px', borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <Title level={4} style={{ marginBottom: 8, color: '#1a1a2e' }}>
              {t('about.name')}
            </Title>
            <Paragraph style={{ color: '#667eea', marginBottom: 8, fontWeight: 500 }}>
              {t('about.role')}
            </Paragraph>
            <Paragraph style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
              {t('about.description')}
            </Paragraph>
            
            <StatsRow>
              <StatItem>
                <div className="stat-number">10+</div>
                <div className="stat-label">{t('about.projectExperience')}</div>
              </StatItem>
              <StatItem>
                <div className="stat-number">15+</div>
                <div className="stat-label">{t('about.technologyStack')}</div>
              </StatItem>
              <StatItem>
                <div className="stat-number">100%</div>
                <div className="stat-label">{t('about.deliveryQuality')}</div>
              </StatItem>
            </StatsRow>

            <SocialLinks>
              <Tooltip title="GitHub">
                <a href="https://github.com/P1kaj1uu" target="_blank" rel="noopener noreferrer">
                  <GithubOutlined />
                </a>
              </Tooltip>
              <Tooltip title="邮箱">
                <a href="mailto:891523233@qq.com">
                  <MailOutlined />
                </a>
              </Tooltip>
              <Tooltip title="微信">
                <WeChatIcon onClick={() => setIsModalVisible(true)}>
                  <WechatOutlined />
                </WeChatIcon>
              </Tooltip>
            </SocialLinks>
            
            <Divider style={{ margin: '16px 0' }} />
            
            <TechList>
              {technologies.map((tech, index) => (
                <span key={index} className="tech-tag">
                  {tech}
                </span>
              ))}
            </TechList>
          </ProfileCard>
        </Col>
        
        {/* 第二列：详细介绍 */}
        <Col xs={24} md={16} lg={10}>
          <AboutCard>
            <Card.Meta
              title={<span style={{ fontSize: '18px' }}>📋 {t('about.contact')}</span>}
              description={
                <div>
                  <ul style={{ paddingLeft: '20px', color: '#64748b', marginBottom: 24 }}>
                    <li style={{ marginBottom: 8 }}>{t('about.wechat')}</li>
                    <li>{t('about.email')}</li>
                  </ul>
                  
                  <Divider style={{ margin: '16px 0' }} />
                  
                  <Title level={5} style={{ marginBottom: 16, color: '#667eea' }}>
                    💼 {t('about.internship')}
                  </Title>
                  <ul style={{ paddingLeft: '20px', color: '#64748b', marginBottom: 24 }}>
                    <li style={{ marginBottom: 8 }}>{t('about.internship1')}</li>
                    <li>{t('about.internship2')}</li>
                  </ul>
                  
                  <Divider style={{ margin: '16px 0' }} />
                  
                  <Title level={5} style={{ marginBottom: 16, color: '#667eea' }}>
                    🏆 {t('about.awards')}
                  </Title>
                  <ul style={{ paddingLeft: '20px', color: '#64748b' }}>
                    <li style={{ marginBottom: 8 }}>{t('about.award1')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award2')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award3')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award4')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award5')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award6')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award7')}</li>
                    <li style={{ marginBottom: 8 }}>{t('about.award8')}</li>
                    <li>{t('about.award9')}</li>
                  </ul>
                </div>
              }
            />
          </AboutCard>
        </Col>
        
        {/* 第三列：商品列表 */}
        <Col xs={24} lg={7}>
          <ProductsContainer>
            <ProductsTitle>
              <ShoppingOutlined style={{ color: '#667eea' }} /> {t('about.products')}
              <Badge count={products.length} style={{ backgroundColor: '#667eea' }} />
            </ProductsTitle>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <Spin size="large" tip={t('about.loadingProducts')} />
              </div>
            ) : products.length > 0 ? (
              <div>
                {/* @ts-ignore */}
                {products.map((product, idx) => (
                  <ProductCard key={product.id} onClick={() => handleOpenDetail(product)}>
                    <ProductHeader>
                      <ProductName>
                        <ThunderboltOutlined style={{ color: '#667eea', fontSize: 14 }} />
                        {product.name}
                      </ProductName>
                      <ProductTags>
                        {product.autoDelivery && (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ borderRadius: 12 }}>
                            {t('about.autoDelivery')}
                          </Tag>
                        )}
                        {product.stock < 100 && (
                          <Tag icon={<ClockCircleOutlined />} color="orange" style={{ borderRadius: 12 }}>
                            {t('about.stockShort')}
                          </Tag>
                        )}
                      </ProductTags>
                    </ProductHeader>
                    <ProductDesc type="secondary" ellipsis={{ rows: 2 }}>
                      {product.desc || '无限制使用网站所有功能'}
                    </ProductDesc>
                    <ProductPrice>
                      <DollarOutlined />
                      {product.price}
                      <PriceUnit>USD / 件</PriceUnit>
                    </ProductPrice>
                  </ProductCard>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999', background: '#fafafa', borderRadius: 16 }}>
                <ShoppingOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }} />
                <Paragraph style={{ color: '#999' }}>{t('about.noProducts')}</Paragraph>
              </div>
            )}

            {/* 数字商品购买须知 */}
            <NoticeSection>
              <div className="notice-title">
                <FileProtectOutlined /> {t('about.digitalGoodsNotice')}
              </div>
              <ul className="notice-list">
                <li className="red">
                  <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                  {t('about.importantNotice')}
                </li>
              </ul>
            </NoticeSection>
          </ProductsContainer>
        </Col>
      </Row>

      {/* 微信/支付宝弹窗 */}
      <Modal
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={520}
        centered
        styles={{ body: { padding: 0 } }}
      >
        <ModalContent>
          <CarouselContainer>
            <NavigationButton className="prev" onClick={handlePrevSlide}>
              ‹
            </NavigationButton>
            <NavigationButton className="next" onClick={handleNextSlide}>
              ›
            </NavigationButton>

            {slides.map((slide, index) => (
              <CarouselSlide key={index} isVisible={index === currentSlide} slideDirection={slideDirection}>
                <SlideTitle>{slide.title}</SlideTitle>
                <QRImage src={slide.image} alt={slide.title} />
              </CarouselSlide>
            ))}
          </CarouselContainer>
        </ModalContent>
      </Modal>

      {/* 商品详情弹窗 */}
      <DetailModal
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        width={580}
        centered
        title={null}
      >
        {selectedProduct && (
          <>
            <div className="detail-header">
              <div className="detail-title">{selectedProduct.name}</div>
              <div className="detail-info">
                <span className="detail-info-item">
                  <InboxOutlined /> 库存: {selectedProduct.stock}
                </span>
                {selectedProduct.autoDelivery && (
                  <span className="detail-info-item">
                    <CheckCircleOutlined style={{ color: '#00b42a' }} /> 自动发货
                  </span>
                )}
                <span className="detail-info-item">
                  <CustomerServiceOutlined /> 7x24h 售后
                </span>
              </div>
            </div>

            {selectedProduct.cover && (
              <img
                src={selectedProduct.cover}
                alt={selectedProduct.name}
                className="detail-image"
              />
            )}
            
            <div className="detail-price">
              ${selectedProduct.price} <span style={{ fontSize: 14, fontWeight: 'normal', color: '#999' }}>USD / 件</span>
            </div>
            
            <div className="detail-desc">
              <strong>📝 商品描述：</strong>
              <p>{selectedProduct.desc || '无限制使用网站所有功能'}</p>
              {selectedProduct.link && (
                <p style={{ marginTop: 8 }}>
                  <strong>🔗 文档链接：</strong>
                  <a href={selectedProduct.link} target="_blank" rel="noopener noreferrer">
                    查看详情文档 →
                  </a>
                </p>
              )}
            </div>

            <Form form={form} layout="vertical" className="buy-section">
              <Form.Item
                name="quantity"
                label="购买数量"
                rules={[{ required: true, min: 1, message: '请输入购买数量' }]}
              >
                <Input placeholder='请输入购买数量' autoComplete='off' type="number" min={1} max={selectedProduct.stock} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="contactInfo"
                label="联系方式（用于找回订单）"
                rules={[{ required: true, message: '请输入联系方式' }]}
              >
                <Input autoComplete='off' placeholder="邮箱/QQ/微信/手机号" />
              </Form.Item>

              <Form.Item name="coupon" label="优惠券（可选）">
                <Input autoComplete='off' placeholder="输入优惠码" />
              </Form.Item>

              <Button
                type="primary"
                size="large"
                block
                loading={buyLoading}
                onClick={handleBuy}
                style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  border: 'none',
                  borderRadius: 12,
                  height: 48,
                  fontSize: 16,
                }}
              >
                立即下单
              </Button>
            </Form>
          </>
        )}
      </DetailModal>
    </PageContainer>
  )
}

export default About