import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Table, 
  Space, 
  Popconfirm, 
  message, 
  Avatar,
  Typography,
  Row,
  Col,
  Badge,
  Tooltip
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  PlayCircleOutlined,
  StopOutlined,
  ReloadOutlined,
  UserOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons'
import { useGoofishWebSocket } from '@/hooks/goofish'
import { accountApi } from '@/services/goofish'
import type { Account } from '@/types/goofish'

const { TextArea } = Input
const { Text, Title } = Typography

const Accounts: React.FC = () => {
  const { status, refetchStatus } = useGoofishWebSocket({
    onMessage: (data) => {
      if (data.type === 'accounts') {
        loadAccounts()
      }
    }
  })
  
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [refreshingId, setRefreshingId] = useState<string | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const response = await accountApi.getAccounts()
      setAccounts(response.data?.accounts || [])
      refetchStatus()
    } catch (error) {
      message.error('加载账号列表失败')
    } finally {
      setLoading(false)
    }
  }

  const isConnected = (accountId: string): boolean => {
    return status?.clients?.some((c: any) => c.accountId === accountId && c.connected) || false
  }

  const formatTime = (time?: string): string => {
    return time ? new Date(time).toLocaleString('zh-CN') : '-'
  }

  const onFinish = async (values: any) => {
    setSubmitting(true)
    try {
      if (editingId) {
        await accountApi.saveAccount({
          id: editingId,
          remark: values.remark,
          ...(values.cookies && { cookies: values.cookies })
        })
        message.success('保存成功')
      } else {
        if (!values.cookies?.trim()) {
          message.error('请填写 Cookies')
          return
        }
        await accountApi.saveAccount({
          cookies: values.cookies.trim(),
          remark: values.remark
        })
        message.success('添加成功')
      }
      form.resetFields()
      setEditingId(null)
      loadAccounts()
    } catch (error) {
      message.error('操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const onEdit = (account: Account) => {
    setEditingId(account.id)
    form.setFieldsValue({
      remark: account.remark || ''
    })
  }

  const onCancelEdit = () => {
    setEditingId(null)
    form.resetFields()
  }

  const onRefreshInfo = async (id: string) => {
    setRefreshingId(id)
    try {
      await accountApi.saveAccount({ id }) // 刷新用户信息
      message.success('刷新成功')
      loadAccounts()
    } catch (error) {
      message.error('刷新失败')
    } finally {
      setRefreshingId(null)
    }
  }

  const onStart = async (id: string) => {
    try {
      await accountApi.startAccount(id)
      message.success('启动成功')
      loadAccounts()
    } catch (error) {
      message.error('启动失败')
    }
  }

  const onStop = async (id: string) => {
    try {
      await accountApi.stopAccount(id)
      message.success('停止成功')
      loadAccounts()
    } catch (error) {
      message.error('停止失败')
    }
  }

  const onDelete = async (id: string) => {
    try {
      await accountApi.deleteAccount(id)
      message.success('删除成功')
      loadAccounts()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const columns = [
    {
      title: '账号',
      dataIndex: 'account',
      key: 'account',
      render: (_: any, record: Account) => (
        <Space>
          <Avatar 
            size={40} 
            src={record.avatar} 
            icon={!record.avatar && <UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.nickname || '未知用户'}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.id}
            </Text>
          </div>
        </Space>
      )
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      render: (remark?: string) => remark || '-'
    },
    {
      title: '状态',
      dataIndex: 'id',
      key: 'status',
      render: (id: string) => (
        isConnected(id) ? (
          <Badge status="success" text="在线" />
        ) : (
          <Badge status="default" text="离线" />
        )
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (time?: string) => (
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {formatTime(time)}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Account) => (
        <Space size="small">
          <Tooltip title="刷新用户信息">
            <Button 
              type="text" 
              size="small"
              icon={<ReloadOutlined spin={refreshingId === record.id} />}
              onClick={() => onRefreshInfo(record.id)}
              loading={refreshingId === record.id}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button 
              type="text" 
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
            />
          </Tooltip>
          {!isConnected(record.id) ? (
            <Tooltip title="启动">
              <Button 
                type="text" 
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => onStart(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="停止">
              <Button 
                type="text" 
                size="small"
                icon={<StopOutlined />}
                onClick={() => onStop(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="确定删除该账号？"
            onConfirm={() => onDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button 
                type="text" 
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Title level={2}>账号管理</Title>

      {/* 账号列表 */}
      <Card style={{ marginBottom: 16 }}>
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* 添加/编辑表单 */}
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card
            title={editingId ? '编辑账号' : '添加账号'}
            extra={!editingId && <QuestionCircleOutlined />}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
            >
              {editingId && (
                <Form.Item label="账号ID">
                  <Input value={editingId} autoComplete="off" disabled />
                </Form.Item>
              )}

              {!editingId && (
                <Form.Item
                  label="Cookies"
                  name="cookies"
                  rules={[{ required: true, message: '请填写 Cookies' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="粘贴 Cookie 字符串，系统将自动获取用户信息"
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                  />
                </Form.Item>
              )}

              <Form.Item label="备注" name="remark">
                <Input placeholder="可选，方便识别" autoComplete="off" />
              </Form.Item>

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
                    loading={submitting}
                    icon={editingId ? <EditOutlined /> : <PlusOutlined />}
                  >
                    {editingId ? '保存' : '添加'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 帮助卡片 */}
        <Col xs={24} md={12}>
          <Card size="small">
            <Space direction="vertical" size="small">
              <Text strong><QuestionCircleOutlined /> 如何获取 Cookies？</Text>
              <ol style={{ paddingLeft: 16, margin: 0, fontSize: '12px', color: '#999' }}>
                <li>登录闲鱼网页版 (goofish.com)</li>
                <li>按 F12 打开开发者工具</li>
                <li>切换到 Network 标签</li>
                <li>刷新页面，点击任意请求</li>
                <li>在 Headers 中找到 Cookie</li>
              </ol>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Accounts
