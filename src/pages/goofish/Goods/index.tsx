import React, { useEffect, useState } from 'react'
import {
  Card,
  Row,
  Col,
  Image,
  Tag,
  Button,
  Select,
  Space,
  Typography,
  Badge,
  Tooltip,
  Spin,
  Empty,
  message
} from 'antd'
import {
  ReloadOutlined,
  ShoppingOutlined,
} from '@ant-design/icons'
import { accountApi } from '@/services/goofish'

const { Option } = Select
const { Text } = Typography

interface GoodsItem {
  id: string
  title: string
  price?: string
  picUrl?: string
  picWidth?: number
  picHeight?: number
  categoryId?: number
  itemStatus: number
  hasVideo?: boolean
  soldPrice?: string
  postInfo?: string
  accountId?: string
}

const Goods: React.FC = () => {
  const [goods, setGoods] = useState<GoodsItem[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    localStorage.getItem('goofish_goods_filter_account') || ''
  )
  const [selectedStatus, setSelectedStatus] = useState<string>(
    localStorage.getItem('goofish_goods_filter_status') || ''
  )

  useEffect(() => {
    loadAccounts()
    loadGoods()
  }, [selectedAccountId, selectedStatus])

  const loadAccounts = async () => {
    try {
      const response = await accountApi.getAccounts()
      const accountsData = response.data?.accounts || []
      setAccounts(accountsData)

      // 如果没有选中的账号且有账号数据，默认选中第一个
      if (!selectedAccountId && accountsData.length > 0) {
        const firstAccountId = accountsData[0].id
        setSelectedAccountId(firstAccountId)
        localStorage.setItem('goofish_goods_filter_account', firstAccountId)
      } else {
        localStorage.setItem('goofish_goods_filter_account', '选择账号')
      }
    } catch (error) {
      console.error('加载账号列表失败', error)
    }
  }

  const loadGoods = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (selectedAccountId) params.accountId = selectedAccountId
      if (selectedStatus) params.status = selectedStatus

      // 使用 fetch 调用商品接口
      const queryString = new URLSearchParams(params).toString()
      const response = await fetch(`/api/goods${queryString ? '?' + queryString : ''}`)
      const data = await response.json()
      setGoods(data.items || [])
    } catch (error) {
      message.error('加载商品列表失败')
    } finally {
      setLoading(false)
    }
  }

  const onAccountChange = (value: string) => {
    setSelectedAccountId(value)
    localStorage.setItem('goofish_goods_filter_account', value)
  }

  const onStatusChange = (value: string) => {
    setSelectedStatus(value)
    localStorage.setItem('goofish_goods_filter_status', value)
  }

  const getStatusText = (status: number): string => {
    switch (status) {
      case 0: return '在售'
      case 1: return '已下架'
      default: return '未知'
    }
  }

  const getStatusColor = (status: number): string => {
    switch (status) {
      case 0: return 'success'
      case 1: return 'warning'
      default: return 'default'
    }
  }

  const filteredGoods = goods.filter(item => {
    if (selectedStatus === '') return true
    return item.itemStatus === Number(selectedStatus)
  })

  const stats = {
    total: goods.length,
    onSale: goods.filter(g => g.itemStatus === 0).length,
    offSale: goods.filter(g => g.itemStatus === 1).length
  }

  const getAccountNickname = (accountId: string): string => {
    const account = accounts.find(a => a.id === accountId)
    return account?.nickname || account?.userId || accountId
  }

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ShoppingOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{stats.total}</div>
              <div style={{ color: '#999' }}>商品总数</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Badge status="success" />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{stats.onSale}</div>
              <div style={{ color: '#999' }}>在售</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Badge status="warning" />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{stats.offSale}</div>
              <div style={{ color: '#999' }}>已下架</div>
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Badge status="processing" />
              <div style={{ fontSize: 24, fontWeight: 'bold', marginTop: 8 }}>{goods.filter(g => g.hasVideo).length}</div>
              <div style={{ color: '#999' }}>含视频</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Select
            style={{ width: '100%', maxWidth: 200 }}
            placeholder="选择账号"
            allowClear
            value={selectedAccountId}
            onChange={onAccountChange}
          >
            {accounts.map(account => (
              <Option key={account.id} value={account.id}>
                {account.nickname || account.id}
              </Option>
            ))}
          </Select>

          <Select
            style={{ width: '100%', maxWidth: 150 }}
            placeholder="商品状态"
            value={selectedStatus}
            onChange={onStatusChange}
          >
            <Option value="">全部状态</Option>
            <Option value="0">在售</Option>
            <Option value="1">已下架</Option>
          </Select>

          <Button icon={<ReloadOutlined />} onClick={loadGoods} loading={loading}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 商品列表 */}
      <Spin spinning={loading}>
        {filteredGoods.length === 0 ? (
          <Empty
            description="暂无商品"
            style={{ padding: '100px 0' }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredGoods.map(item => (
              <Col xs={24} sm={12} md={8} lg={6} key={item.id}>
                <Card
                  hoverable
                  style={{ height: 'auto', minHeight: 380 }}
                  bodyStyle={{ padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' }}
                  cover={
                    item.picUrl ? (
                      <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                        <Image
                          src={item.picUrl}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          preview={false}
                        />
                        <div style={{ position: 'absolute', top: 8, right: 8 }}>
                          <Tag color={getStatusColor(item.itemStatus)}>
                            {getStatusText(item.itemStatus)}
                          </Tag>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        height: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#f5f5f5'
                      }}>
                        <ShoppingOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                      </div>
                    )
                  }
                >
                  <Space direction="vertical" size="small" style={{ width: '100%', flex: 1 }}>
                    <Tooltip title={item.title}>
                      <Text strong ellipsis={{ tooltip: item.title }} style={{ display: 'block' }}>
                        {item.title}
                      </Text>
                    </Tooltip>

                    {item.price && (
                      <Text type="danger" strong style={{ fontSize: 18 }}>
                        ¥{item.price}
                      </Text>
                    )}

                    <div style={{ flex: 1 }} />

                    <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <Row gutter={8} style={{ fontSize: 12, color: '#999' }}>
                          <Col span={12}>
                            {item.hasVideo ? '有视频' : '无视频'}
                          </Col>
                          {item.postInfo && (
                            <Col span={12} style={{ textAlign: 'right' }}>
                              <Tag color="blue" style={{ fontSize: 11 }}>{item.postInfo}</Tag>
                            </Col>
                          )}
                        </Row>

                        {item.accountId && (
                          <Text type="secondary" style={{ fontSize: 12, display: 'flex', alignItems: 'center' }}>
                            {getAccountNickname(item.accountId)}
                          </Text>
                        )}
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  )
}

export default Goods
