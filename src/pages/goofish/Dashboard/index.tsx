import React, { useEffect, useState } from 'react'
import { Card, Row, Col, Statistic, Badge, Space, Alert } from 'antd'
import { 
  UserOutlined, 
  MessageOutlined, 
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import { useGoofishWebSocket } from '@/hooks/goofish'
import { accountApi } from '@/services/goofish'

const Dashboard: React.FC = () => {
  const { connected, status, refetchStatus } = useGoofishWebSocket({
    onMessage: (data) => {
      if (data.type === 'status') {
        refetchStatus()
      }
    }
  })
  
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const response = await accountApi.getAccounts()
      setAccounts(response.data?.accounts || [])
    } catch (error) {
      console.error('Failed to load accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const activeAccounts = accounts.filter(a => a.enabled).length
  const connectedAccounts = status?.clients?.filter((c: any) => c.connected).length || 0

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 警告信息 */}
        {!connected && (
          <Alert
            message="服务离线"
            description="无法连接到 Goofish 服务器，请检查服务是否正常运行。"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            closable
          />
        )}

        {/* 警告信息 */}
        {!connected && (
          <Alert
            message="服务离线"
            description="无法连接到 Goofish 服务器，请检查服务是否正常运行。"
            type="warning"
            showIcon
            icon={<WarningOutlined />}
          />
        )}

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="账号总数"
                value={accounts.length}
                prefix={<UserOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="启用账号"
                value={activeAccounts}
                prefix={<CheckCircleOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="在线账号"
                value={connectedAccounts}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: connectedAccounts === activeAccounts ? '#3f8600' : '#cf1322' }}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="消息总数"
                value={status?.messageCount || 0}
                prefix={<MessageOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* 账号状态列表 */}
        <Card title="账号状态" extra={<a onClick={loadAccounts}>刷新</a>}>
          {accounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              暂无账号，请先添加账号
            </div>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {accounts.map(account => {
                const clientStatus = status?.clients?.find((c: any) => c.accountId === account.id)
                const isConnected = clientStatus?.connected || false
                
                return (
                  <div key={account.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px',
                    background: '#fafafa',
                    borderRadius: '8px'
                  }}>
                    <Space>
                      {account.avatar && (
                        <img 
                          src={account.avatar} 
                          alt="" 
                          style={{ width: 40, height: 40, borderRadius: '50%' }}
                        />
                      )}
                      <div>
                        <div style={{ fontWeight: 500 }}>
                          {account.nickname || account.userId || '未命名账号'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          ID: {account.id} {account.remark && `(${account.remark})`}
                        </div>
                      </div>
                    </Space>
                    <Space>
                      <Badge 
                        status={account.enabled ? (isConnected ? 'success' : 'warning') : 'default'} 
                        text={
                          !account.enabled ? '已禁用' : 
                          isConnected ? '已连接' : '未连接'
                        } 
                      />
                    </Space>
                  </div>
                )
              })}
            </Space>
          )}
        </Card>
      </Space>
    </div>
  )
}

export default Dashboard
