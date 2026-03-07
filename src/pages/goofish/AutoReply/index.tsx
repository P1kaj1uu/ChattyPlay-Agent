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
  ReloadOutlined
} from '@ant-design/icons'
import { autoReplyApi } from '@/services/goofish'
import type { AutoReplyRule } from '@/types/goofish'

const { TextArea } = Input
const { Option } = Select
const { Text } = Typography

const MATCH_TYPES = [
  { value: 'exact', label: '精确匹配' },
  { value: 'contains', label: '包含关键词' },
  { value: 'regex', label: '正则表达式' }
]

const AutoReply: React.FC = () => {
  const [rules, setRules] = useState<AutoReplyRule[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadRules()
  }, [])

  const loadRules = async () => {
    setLoading(true)
    try {
      const response = await autoReplyApi.getRules()
      setRules(response.data?.rules || [])
    } catch (error) {
      message.error('加载规则失败')
    } finally {
      setLoading(false)
    }
  }

  const onFinish = async (values: any) => {
    setSaving(true)
    try {
      if (editingId) {
        await autoReplyApi.updateRule(editingId, values)
        message.success('更新成功')
      } else {
        await autoReplyApi.createRule(values)
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

  const onEdit = (record: AutoReplyRule) => {
    setEditingId(record.id)
    form.setFieldsValue(record)
  }

  const onCancelEdit = () => {
    setEditingId(null)
    form.resetFields()
  }

  const onDelete = async (id: number) => {
    try {
      await autoReplyApi.deleteRule(id)
      message.success('删除成功')
      loadRules()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const onToggleEnabled = async (id: number, enabled: boolean) => {
    try {
      await autoReplyApi.updateRule(id, { enabled })
      message.success(enabled ? '已启用' : '已禁用')
      loadRules()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AutoReplyRule) => (
        <Space>
          {name}
          {!record.enabled && <Tag color="default">已禁用</Tag>}
        </Space>
      )
    },
    {
      title: '匹配方式',
      dataIndex: 'matchType',
      key: 'matchType',
      render: (type: string) => {
        const config = MATCH_TYPES.find(t => t.value === type)
        return <Tag>{config?.label || type}</Tag>
      }
    },
    {
      title: '匹配内容',
      dataIndex: 'matchPattern',
      key: 'matchPattern',
      ellipsis: true
    },
    {
      title: '回复内容',
      dataIndex: 'replyContent',
      key: 'replyContent',
      ellipsis: true,
      render: (content: string) => (
        <Text ellipsis={{ tooltip: content }} style={{ maxWidth: 200 }}>
          {content}
        </Text>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: AutoReplyRule) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            onClick={() => onToggleEnabled(record.id, !record.enabled)}
          >
            {record.enabled ? '禁用' : '启用'}
          </Button>
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
                priority: 0,
                matchType: 'exact'
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="规则名称"
                    name="name"
                    rules={[{ required: true, message: '请输入规则名称' }]}
                  >
                    <Input placeholder="例如：问候语回复" autoComplete="off" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="匹配方式"
                    name="matchType"
                    rules={[{ required: true }]}
                  >
                    <Select>
                      {MATCH_TYPES.map(type => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="匹配内容"
                name="matchPattern"
                rules={[{ required: true, message: '请输入匹配内容' }]}
                extra="消息内容必须完全等于此内容"
              >
                <Input placeholder="输入要匹配的关键词" autoComplete="off" />
              </Form.Item>

              <Form.Item
                label="回复内容"
                name="replyContent"
                rules={[{ required: true, message: '请输入回复内容' }]}
              >
                <TextArea rows={3} placeholder="输入回复内容" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="优先级"
                    name="priority"
                    extra="数字越大优先级越高"
                  >
                    <Input type="number" placeholder="0" />
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
              <Text>自动回复规则会按照优先级从高到低依次匹配。</Text>
              <Text strong>匹配方式说明：</Text>
              <ul style={{ paddingLeft: 16, margin: 0, fontSize: '12px', color: '#666' }}>
                <li><strong>精确匹配</strong>：消息内容必须完全等于匹配内容</li>
                <li><strong>包含关键词</strong>：消息内容包含匹配内容即可触发</li>
                <li><strong>正则表达式</strong>：使用正则表达式进行高级匹配</li>
              </ul>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                提示：优先级数字越大，规则越先匹配。建议将常用规则设置较高优先级。
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AutoReply
