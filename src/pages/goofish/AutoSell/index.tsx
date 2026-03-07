import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Table, 
  Space, 
  message, 
  Popconfirm,
  Row,
  Col,
  Tag,
  Typography
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ReloadOutlined,
  GiftOutlined
} from '@ant-design/icons'
import { autoSellApi, accountApi } from '@/services/goofish'
import type { AutoSellRule } from '@/types/goofish'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const DELIVERY_TYPES = [
  { value: 'static', label: '静态内容' },
  { value: 'api', label: 'API 接口' }
]

const AutoSell: React.FC = () => {
  const [rules, setRules] = useState<AutoSellRule[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()
  const [deliveryType, setDeliveryType] = useState<'static' | 'api'>('static')

  useEffect(() => {
    loadRules()
    loadAccounts()
  }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const response = await autoSellApi.getRules()
      setRules(response.data?.rules || [])
    } catch (error) {
      message.error('加载规则失败')
    } finally {
      setLoading(false)
    }
  }

  const loadAccounts = async () => {
    try {
      const response = await accountApi.getAccounts()
      setAccounts(response.data?.accounts || [])
    } catch (error) {
      console.error('加载账号失败:', error)
    }
  }

  const onFinish = async (values: any) => {
    setSaving(true)
    try {
      const data = {
        ...values,
        deliveryType: deliveryType,
        apiConfig: deliveryType === 'api' ? JSON.stringify({
          url: values.apiUrl,
          method: values.apiMethod || 'GET',
          headers: values.apiHeaders || '{}'
        }) : undefined
      }
      
      if (editingId) {
        await autoSellApi.updateRule(editingId, data)
        message.success('更新成功')
      } else {
        await autoSellApi.createRule(data)
        message.success('添加成功')
      }
      form.resetFields()
      setEditingId(null)
      loadRules()
    } catch (error) {
      message.error('操作失败')
    } finally {
      setSaving(false)
    }
  }

  const onEdit = (record: AutoSellRule) => {
    setEditingId(record.id)
    const type = record.deliveryType || 'static'
    setDeliveryType(type as any)
    
    const formValues: any = {
      name: record.name,
      enabled: record.enabled,
      itemId: record.itemId,
      accountId: record.accountId,
      triggerOn: record.triggerOn,
      deliveryContent: record.deliveryContent
    }
    
    if (type === 'api' && record.apiConfig) {
      try {
        const apiConfig = JSON.parse(record.apiConfig || '{}')
        Object.assign(formValues, apiConfig)
      } catch (e) {
        console.error('解析 API 配置失败', e)
      }
    }
    
    form.setFieldsValue(formValues)
  }

  const onCancelEdit = () => {
    setEditingId(null)
    form.resetFields()
    setDeliveryType('static')
  }

  const onDelete = async (id: number) => {
    try {
      await autoSellApi.deleteRule(id)
      message.success('删除成功')
      loadRules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AutoSellRule) => (
        <Space>
          <GiftOutlined />
          {name}
          {!record.enabled && <Tag color="default">已禁用</Tag>}
        </Space>
      )
    },
    {
      title: '商品ID',
      dataIndex: 'itemId',
      key: 'itemId',
      render: (itemId?: string) => itemId || <Text type="secondary">全部商品</Text>
    },
    {
      title: '发货方式',
      dataIndex: 'deliveryType',
      key: 'deliveryType',
      render: (type: string) => {
        const config = DELIVERY_TYPES.find(t => t.value === type)
        return <Tag color={type === 'api' ? 'blue' : 'green'}>{config?.label || type}</Tag>
      }
    },
    {
      title: '触发时机',
      dataIndex: 'triggerOn',
      key: 'triggerOn',
      render: (trigger: string) => (
        <Tag>{trigger === 'paid' ? '付款后' : '下单后'}</Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: AutoSellRule) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除该规则？"
            onConfirm={() => onDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      {/* 规则列表 */}
      <Card style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 添加/编辑表单 */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card
            title={editingId ? '编辑规则' : '添加规则'}
            extra={!editingId && <Button icon={<ReloadOutlined />} onClick={loadRules}>刷新</Button>}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                enabled: true,
                triggerOn: 'paid',
                apiMethod: 'GET'
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="规则名称"
                    name="name"
                    rules={[{ required: true, message: '请输入规则名称' }]}
                  >
                    <Input placeholder="例如：虚拟商品自动发货" autoComplete="off" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="触发时机"
                    name="triggerOn"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      <Option value="paid">付款后</Option>
                      <Option value="ordered">下单后</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="商品ID"
                    name="itemId"
                    extra="留空则适用于所有商品"
                  >
                    <Input placeholder="输入商品ID" autoComplete="off" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="关联账号"
                    name="accountId"
                    extra="留空则适用于所有账号"
                  >
                    <Select placeholder="选择账号" allowClear>
                      {accounts.map(account => (
                        <Option key={account.id} value={account.id}>
                          {account.nickname || account.id}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label="发货方式">
                <Select
                  value={deliveryType}
                  onChange={(value) => setDeliveryType(value as any)}
                >
                  <Option value="static">静态发货</Option>
                  <Option value="api">API 发货</Option>
                </Select>
              </Form.Item>

              {deliveryType === 'static' ? (
                <Form.Item
                  label="发货内容"
                  name="deliveryContent"
                  rules={[{ required: true, message: '请输入发货内容' }]}
                  extra="支持变量：{订单号}、{商品名}、{买家昵称}"
                >
                  <TextArea rows={4} placeholder="例如：您的卡密是：ABC123" />
                </Form.Item>
              ) : (
                <>
                  <Form.Item
                    label="API 地址"
                    name="apiUrl"
                    rules={[{ required: true, message: '请输入 API 地址' }]}
                  >
                    <Input placeholder="https://api.example.com/deliver" autoComplete="off" />
                  </Form.Item>
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="请求方法"
                        name="apiMethod"
                      >
                        <Select>
                          <Option value="GET">GET</Option>
                          <Option value="POST">POST</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        label="启用状态"
                        name="enabled"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item
                    label="请求头"
                    name="apiHeaders"
                    extra='JSON 格式，例如：{"Authorization": "Bearer xxx"}'
                  >
                    <TextArea rows={2} placeholder='{"Authorization": "Bearer xxx"}' />
                  </Form.Item>
                </>
              )}

              {deliveryType === 'static' && (
                <Form.Item
                  label="启用状态"
                  name="enabled"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              )}

              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  {editingId && (
                    <Button onClick={onCancelEdit}>
                      取消
                    </Button>
                  )}
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={saving}
                    icon={editingId ? <EditOutlined /> : <PlusOutlined />}
                  >
                    {editingId ? '保存' : '添加'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 说明卡片 */}
        <Col xs={24} md={12}>
          <Card title="使用说明" size="small">
            <Space direction="vertical" size="small">
              <Text>自动发货规则会在订单触发指定条件后自动执行发货操作。</Text>
              <Text strong>发货方式说明：</Text>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: '12px', color: '#666' }}>
                <li><strong>静态发货</strong>：直接返回预设的文本内容，支持变量</li>
                <li><strong>API 发货</strong>：调用外部 API 接口获取发货内容</li>
              </ul>
              <Text strong style={{ marginTop: 8 }}>支持的变量：</Text>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: '12px', color: '#666' }}>
                <li><code>{"{订单号}"}</code> - 订单编号</li>
                <li><code>{"{商品名}"}</code> - 商品名称</li>
                <li><code>{"{买家昵称}"}</code> - 买家昵称</li>
              </ul>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                提示：商品ID和账号ID留空时，规则将应用于所有商品和所有账号。
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AutoSell
