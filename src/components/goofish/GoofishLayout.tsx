import React, { useState, useEffect } from 'react'
import { Layout, Menu, theme, Button, Typography, Space } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  MessageOutlined,
  ShoppingOutlined,
  RobotOutlined,
  FileTextOutlined,
  BranchesOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined
} from '@ant-design/icons'

const { Sider, Content, Header } = Layout
const { Title } = Typography

const GoofishLayout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken()

  // 检测屏幕尺寸
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        setCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const menuItems = [
    { key: '/goofish', icon: <DashboardOutlined />, label: '闲鱼数据' },
    { key: '/goofish/accounts', icon: <UserOutlined />, label: '账号管理' },
    { key: '/goofish/conversations', icon: <MessageOutlined />, label: '对话管理' },
    { key: '/goofish/orders', icon: <ShoppingOutlined />, label: '订单管理' },
    { key: '/goofish/goods', icon: <ShoppingOutlined />, label: '商品管理' },
    { key: '/goofish/autoreply', icon: <RobotOutlined />, label: '自动回复' },
    { key: '/goofish/autosell', icon: <ShoppingOutlined />, label: '自动发货' },
    { key: '/goofish/workflow', icon: <BranchesOutlined />, label: '工作流图' },
    { key: '/goofish/logs', icon: <FileTextOutlined />, label: '系统日志' }
  ]

  const getPageTitle = () => {
    const item = menuItems.find(m => m.key === location.pathname)
    return item?.label || '闲鱼管理'
  }

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key)
    // 移动端点击菜单后自动收起侧边栏
    if (isMobile) {
      setCollapsed(true)
    }
  }

  return (
    <>
      {/* 移动端菜单优化 */}
      <style>{`
        @media (max-width: 767px) {
          .ant-menu-item {
            height: 36px !important;
            line-height: 36px !important;
            padding: 0 12px !important;
            margin: 2px 0 !important;
          }
          .ant-menu-item .anticon {
            font-size: 14px !important;
            margin-inline-end: 8px !important;
          }
          /* 移动端表格优化 */
          .ant-table {
            font-size: 12px !important;
          }
          .ant-table-thead > tr > th,
          .ant-table-tbody > tr > td {
            padding: 8px 8px !important;
          }
          /* 移动端卡片内边距优化 */
          .ant-card {
            margin-bottom: 12px !important;
          }
          .ant-card-body {
            padding: 12px !important;
          }
          /* 移动端按钮尺寸优化 */
          .ant-btn {
            font-size: 13px !important;
            height: 32px !important;
            padding: 4px 12px !important;
          }
          .ant-btn-sm {
            font-size: 12px !important;
            height: 28px !important;
            padding: 0 8px !important;
          }
          /* 移动端输入框优化 */
          .ant-input,
          .ant-select {
            font-size: 13px !important;
          }
          /* 移动端统计卡片优化 */
          .ant-statistic-title {
            font-size: 13px !important;
          }
          .ant-statistic-content {
            font-size: 20px !important;
          }
          /* 移动端标签优化 */
          .ant-tag {
            font-size: 11px !important;
            padding: 0 4px !important;
          }
        }
        @media (max-width: 575px) {
          /* 超小屏幕优化 */
          .goofish-content {
            margin: 8px !important;
            padding: 12px !important;
          }
        }
      `}</style>
      <Layout style={{ minHeight: '100vh', position: 'relative' }}>
      {/* 移动端遮罩层 */}
      {isMobile && !collapsed && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            zIndex: 99,
            transition: 'all 0.3s'
          }}
          onClick={() => setCollapsed(true)}
        />
      )}

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="light"
        style={{
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: isMobile && !collapsed ? 1000 : 100,
          transition: 'all 0.2s',
          [isMobile && collapsed ? 'transform' : '']: isMobile && collapsed ? 'translateX(-100%)' : 'translateX(0)',
          display: 'flex',
          flexDirection: 'column',
          background: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
        trigger={null}
        width={isMobile ? 240 : 220}
        collapsedWidth={isMobile ? 0 : 64}
      >
        <div style={{
          height: isMobile ? 48 : 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? 0 : '0 16px',
          background: '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          flexShrink: 0
        }}>
          {!collapsed && (
            <Space>
              <ShoppingOutlined style={{ fontSize: isMobile ? 18 : 22, color: '#1890ff' }} />
              <Title level={4} style={{ color: '#333', margin: 0, fontSize: isMobile ? 14 : 15 }}>
                闲鱼管理
              </Title>
            </Space>
          )}
          {collapsed && !isMobile && (
            <ShoppingOutlined style={{ fontSize: 22, color: '#1890ff' }} />
          )}
          {!collapsed && isMobile && (
            <Button
              type="text"
              icon={<MenuFoldOutlined />}
              onClick={() => setCollapsed(true)}
              style={{ fontSize: 14 }}
            />
          )}
        </div>
        <div style={{
          flex: 1,
          overflow: isMobile ? 'visible' : 'auto',
          overflowX: 'hidden',
          background: '#fff',
          WebkitOverflowScrolling: 'touch'
        }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{
              borderRight: 0,
              ...(isMobile && {
                fontSize: '13px'
              })
            }}
            inlineIndent={isMobile ? 12 : 16}
          />
        </div>
      </Sider>

      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? 64 : 220),
          transition: 'margin-left 0.2s',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Header
          style={{
            padding: isMobile ? '0 12px' : '0 24px',
            background: colorBgContainer,
            borderBottom: '1px solid #f0f0f0',
            display: isMobile && !collapsed ? 'none' : 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: isMobile ? 56 : 64,
            position: 'sticky',
            top: 0,
            zIndex: isMobile && !collapsed ? 1001 : 99,
            boxShadow: '0 1px 4px rgba(0,21,41,.08)'
          }}
        >
          <Space size={isMobile ? 'small' : 'middle'}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: isMobile ? 14 : 16, width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }}
            />
            <Title level={4} style={{ margin: 0, fontSize: isMobile ? 16 : 18 }}>
              {getPageTitle()}
            </Title>
          </Space>

          <Button
            type="text"
            icon={<HomeOutlined />}
            onClick={() => navigate('/home')}
            style={{ fontSize: isMobile ? 13 : 14 }}
          >
            {isMobile ? '' : '返回首页'}
          </Button>
        </Header>

        <Content
          className="goofish-content"
          style={{
            margin: isMobile ? '8px' : '16px',
            padding: isMobile ? '12px' : '24px',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            flex: 1,
            overflowY: 'hidden',
            overflowX: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
            transition: 'all 0.2s'
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
    </>
  )
}

export default GoofishLayout
