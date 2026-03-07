import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Table, 
  Space, 
  Tag, 
  Button, 
  Select, 
  Input, 
  Image, 
  Modal, 
  Form, 
  message,
  Row,
  Col,
  Statistic,
  Tooltip,
  Typography
} from 'antd'
import {
  ReloadOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { orderApi, accountApi } from '@/services/goofish'
import type { Order } from '@/types/goofish'

const { Option } = Select
const { TextArea } = Input
const { Text } = Typography

enum OrderStatus {
  FETCHING = 0,
  PENDING_PAYMENT = 1,
  PENDING_SHIPMENT = 2,
  PENDING_RECEIPT = 3,
  COMPLETED = 4,
  CLOSED = 5
}

const STATUS_CONFIG: Record<number, { text: string; color: string }> = {
  [OrderStatus.FETCHING]: { text: '获取中', color: 'default' },
  [OrderStatus.PENDING_PAYMENT]: { text: '待付款', color: 'orange' },
  [OrderStatus.PENDING_SHIPMENT]: { text: '待发货', color: 'blue' },
  [OrderStatus.PENDING_RECEIPT]: { text: '待收货', color: 'cyan' },
  [OrderStatus.COMPLETED]: { text: '交易成功', color: 'green' },
  [OrderStatus.CLOSED]: { text: '已关闭', color: 'default' }
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [shippingModalVisible, setShippingModalVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null)
  const [shippingForm] = Form.useForm()
  const [isMobile, setIsMobile] = useState(false)

  // 筛选条件
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<number | ''>('')

  // 分页
  const [total, setTotal] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 加载数据
  useEffect(() => {
    loadAccounts()
    loadOrders()
  }, [selectedAccountId, selectedStatus, currentPage])

  const loadAccounts = async () => {
    try {
      const response = await accountApi.getAccounts()
      setAccounts(response.data?.accounts || [])
    } catch (error) {
      console.error('加载账号失败:', error)
    }
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      }
      if (selectedAccountId) params.accountId = selectedAccountId
      if (selectedStatus !== '') params.status = selectedStatus

      const response = await orderApi.getOrders(params)
      setOrders(response.data?.orders || [])
      setTotal(response.data?.total || 0)
    } catch (error) {
      message.error('加载订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async (orderId: string) => {
    setRefreshingId(orderId)
    try {
      await orderApi.getOrder(Number(orderId.split('-')[1]))
      message.success('刷新成功')
      loadOrders()
    } catch (error) {
      message.error('刷新失败')
    } finally {
      setRefreshingId(null)
    }
  }

  const onShip = (order: Order) => {
    setCurrentOrder(order)
    setShippingModalVisible(true)
    shippingForm.resetFields()
  }

  const onShipSubmit = async (values: any) => {
    if (!currentOrder) return

    try {
      await orderApi.confirmShipment(currentOrder.id, {
        shipmentType: values.shipmentType,
        ...values.shipmentType === 'manual' && {
          company: values.company,
          trackingNumber: values.trackingNumber
        },
        ...values.shipmentType === 'free' && {
          freeShippingReason: values.freeShippingReason
        }
      })
      message.success('发货成功')
      setShippingModalVisible(false)
      loadOrders()
    } catch (error) {
      message.error('发货失败')
    }
  }

  const getStatusText = (status: number): string => {
    return STATUS_CONFIG[status]?.text || '未知'
  }

  const getStatusColor = (status: number): string => {
    return STATUS_CONFIG[status]?.color || 'default'
  }

  const formatTime = (time?: string): string => {
    return time ? new Date(time).toLocaleString('zh-CN') : '-'
  }

  // 统计数据
  const stats = {
    total: orders.length,
    pendingShipment: orders.filter(o => o.status === OrderStatus.PENDING_SHIPMENT).length,
    totalAmount: orders.reduce((sum, o) => {
      const price = parseFloat(o.price || '0')
      return sum + price
    }, 0)
  }

  const columns = [
    {
      title: '商品',
      dataIndex: 'itemTitle',
      key: 'itemTitle',
      render: (_: any, record: Order) => (
        <Space>
          {record.itemPicUrl && (
            <Image
              width={48}
              height={48}
              src={record.itemPicUrl}
              style={{ borderRadius: 4 }}
            />
          )}
          <div>
            <div style={{ fontWeight: 500 }}>{record.itemTitle || '未知商品'}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.orderId}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '买家',
      dataIndex: 'buyerNickname',
      key: 'buyerNickname',
      render: (nickname?: string) => nickname || '-'
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      render: (price?: string) => (
        <Text strong style={{ color: '#ff4d4f' }}>
          ¥{price || '0.00'}
        </Text>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '下单时间',
      dataIndex: 'orderTime',
      key: 'orderTime',
      render: formatTime
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space size="small">
          <Tooltip title="刷新订单">
            <Button 
              type="text" 
              size="small"
              icon={<ReloadOutlined spin={refreshingId === record.orderId} />}
              onClick={() => onRefresh(record.orderId)}
              loading={refreshingId === record.orderId}
            />
          </Tooltip>
          {record.status === OrderStatus.PENDING_SHIPMENT && (
            <Button 
              type="primary" 
              size="small"
              icon={<SendOutlined />}
              onClick={() => onShip(record)}
            >
              发货
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="总订单数"
              value={total}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="待发货"
              value={stats.pendingShipment}
              prefix={<SendOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="总金额"
              value={stats.totalAmount}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选条件 */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Select
            style={{ width: isMobile ? '100%' : 150, maxWidth: 200 }}
            placeholder="选择账号"
            allowClear
            value={selectedAccountId || undefined}
            onChange={(value) => {
              setSelectedAccountId(value || '')
              setCurrentPage(1)
            }}
          >
            {accounts.map(account => (
              <Option key={account.id} value={account.id}>
                {account.nickname || account.id}
              </Option>
            ))}
          </Select>

          <Select
            style={{ width: isMobile ? '100%' : 120, maxWidth: 150 }}
            placeholder="订单状态"
            value={selectedStatus}
            onChange={(value) => {
              setSelectedStatus(value)
              setCurrentPage(1)
            }}
          >
            <Option value="">全部状态</Option>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <Option key={value} value={Number(value)}>
                {config.text}
              </Option>
            ))}
          </Select>

          <Button icon={<ReloadOutlined />} onClick={loadOrders}>
            刷新
          </Button>
        </Space>
      </Card>

      {/* 订单列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: currentPage,
            pageSize,
            total,
            onChange: (page) => setCurrentPage(page),
            showSizeChanger: false,
            simple: true
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Card size="small" style={{ margin: 0 }}>
                <Row gutter={[8, 8]}>
                  <Col xs={12} sm={12} md={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">订单编号</Text>
                      <Text copyable style={{ fontSize: 12 }}>{record.orderId}</Text>
                    </Space>
                  </Col>
                  <Col xs={12} sm={12} md={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">商品ID</Text>
                      <Text style={{ fontSize: 12 }}>{record.itemId || '-'}</Text>
                    </Space>
                  </Col>
                  <Col xs={12} sm={12} md={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">买家ID</Text>
                      <Text style={{ fontSize: 12 }}>{record.buyerUserId || '-'}</Text>
                    </Space>
                  </Col>
                  <Col xs={12} sm={12} md={12}>
                    <Space direction="vertical" size="small">
                      <Text type="secondary">付款时间</Text>
                      <Text>{formatTime(record.payTime)}</Text>
                    </Space>
                  </Col>
                </Row>
              </Card>
            )
          }}
        />
      </Card>

      {/* 发货弹窗 */}
      <Modal
        title="确认发货"
        open={shippingModalVisible}
        onCancel={() => setShippingModalVisible(false)}
        footer={null}
      >
        <Form
          form={shippingForm}
          layout="vertical"
          onFinish={onShipSubmit}
        >
          <Form.Item
            label="发货方式"
            name="shipmentType"
            rules={[{ required: true, message: '请选择发货方式' }]}
          >
            <Select placeholder="请选择">
              <Option value="free">免拼发货</Option>
              <Option value="manual">手动发货</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.shipmentType !== curr.shipmentType}>
            {({ getFieldValue }) => {
              const shipmentType = getFieldValue('shipmentType')
              
              if (shipmentType === 'manual') {
                return (
                  <>
                    <Form.Item
                      label="物流公司"
                      name="company"
                      rules={[{ required: true, message: '请输入物流公司' }]}
                    >
                      <Input placeholder="如：顺丰速运" autoComplete="off" />
                    </Form.Item>
                    <Form.Item
                      label="物流单号"
                      name="trackingNumber"
                      rules={[{ required: true, message: '请输入物流单号' }]}
                    >
                      <Input placeholder="请输入物流单号" autoComplete="off" />
                    </Form.Item>
                  </>
                )
              }
              
              if (shipmentType === 'free') {
                return (
                  <Form.Item
                    label="免拼原因"
                    name="freeShippingReason"
                    rules={[{ required: true, message: '请输入免拼原因' }]}
                  >
                    <TextArea rows={3} placeholder="请输入免拼原因" />
                  </Form.Item>
                )
              }
              
              return null
            }}
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setShippingModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                确认发货
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Orders
