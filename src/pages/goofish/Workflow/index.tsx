import React, { useEffect, useState } from 'react'
import { 
  Card, 
  Button, 
  Space, 
  message, 
  Modal, 
  Form, 
  Input, 
  Switch, 
  Tag,
  Typography,
  Row,
  Col,
  Empty,
  Divider,
} from 'antd'
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  BranchesOutlined
} from '@ant-design/icons'
import { workflowApi } from '@/services/goofish'
import type { Workflow } from '@/types/goofish'

const { TextArea } = Input
const { Text, Title } = Typography

const NODE_TYPES = [
  { value: 'trigger', label: '触发器', color: 'blue' },
  { value: 'autoreply', label: '自动回复', color: 'green' },
  { value: 'delivery', label: '发货', color: 'orange' },
  { value: 'ship', label: '确认发货', color: 'cyan' },
  { value: 'delay', label: '延迟', color: 'purple' },
  { value: 'condition', label: '条件判断', color: 'red' }
]

const Workflow: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const response = await workflowApi.getWorkflows()
      setWorkflows(response.data?.workflows || [])
    } catch (error) {
      message.error('加载工作流失败')
    }
  }

  const onCreate = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const onEdit = (workflow: Workflow) => {
    setEditingId(workflow.id)
    form.setFieldsValue({
      name: workflow.name,
      description: workflow.description,
      enabled: workflow.enabled
    })
    setModalVisible(true)
  }

  const onDelete = async (id: number) => {
    try {
      await workflowApi.deleteWorkflow(id)
      message.success('删除成功')
      loadWorkflows()
    } catch (error) {
      message.error('删除失败')
    }
  }

  const onModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await workflowApi.updateWorkflow(editingId, values)
        message.success('更新成功')
      } else {
        await workflowApi.createWorkflow({
          ...values,
          definition: { nodes: [], edges: [] }
        })
        message.success('创建成功')
      }
      setModalVisible(false)
      loadWorkflows()
    } catch (error) {
      message.error('操作失败')
    }
  }

  const renderWorkflowPreview = (workflow: Workflow) => {
    const nodeCount = workflow.definition?.nodes?.length || 0
    const edgeCount = workflow.definition?.edges?.length || 0
    
    return (
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Space wrap>
          {workflow.definition?.nodes?.map((node: any) => {
            const config = NODE_TYPES.find(t => t.value === node.type)
            return (
              <Tag key={node.id} color={config?.color}>
                {config?.label || node.type}
              </Tag>
            )
          })}
        </Space>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {nodeCount} 个节点 · {edgeCount} 条连线
        </Text>
      </Space>
    )
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <BranchesOutlined />
            工作流管理
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={onCreate}
          >
            新建工作流
          </Button>
        }
      >
        {workflows.length === 0 ? (
          <Empty
            description="暂无工作流"
            style={{ padding: '40px 0' }}
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
              创建第一个工作流
            </Button>
          </Empty>
        ) : (
          <Row gutter={16}>
            {workflows.map((workflow) => (
              <Col xs={24} sm={12} lg={8} key={workflow.id}>
                <Card
                  size="small"
                  style={{ marginBottom: 16 }}
                  bodyStyle={{ padding: '16px' }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <Space direction="vertical" size={0}>
                        <Title level={5} style={{ margin: 0 }}>
                          {workflow.name}
                        </Title>
                        {workflow.isDefault && (
                          <Tag color="blue">默认</Tag>
                        )}
                        {!workflow.enabled && (
                          <Tag color="default">已禁用</Tag>
                        )}
                      </Space>
                      <Space size="small">
                        <Button
                          type="text"
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => onEdit(workflow)}
                        />
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => onDelete(workflow.id)}
                        />
                      </Space>
                    </div>
                    
                    {workflow.description && (
                      <Text type="secondary" ellipsis>
                        {workflow.description}
                      </Text>
                    )}
                    
                    <Divider style={{ margin: '8px 0' }} />
                    
                    {renderWorkflowPreview(workflow)}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 编辑/创建工作流弹窗 */}
      <Modal
        title={editingId ? '编辑工作流' : '新建工作流'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={onModalOk}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            enabled: true,
            isDefault: false
          }}
        >
          <Form.Item
            label="工作流名称"
            name="name"
            rules={[{ required: true, message: '请输入工作流名称' }]}
          >
            <Input placeholder="例如：标准发货流程" autoComplete="off" />
          </Form.Item>

          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={2} placeholder="描述此工作流的用途" />
          </Form.Item>

          <Form.Item
            label="设为默认"
            name="isDefault"
            valuePropName="checked"
            extra="默认工作流将自动应用于新创建的自动发货规则"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="启用状态"
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Workflow
