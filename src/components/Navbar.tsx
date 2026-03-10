import React, { useState, useEffect } from 'react'
import { Menu, Button, Drawer, message, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  HomeOutlined,
  MessageOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  BookOutlined,
  PictureOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  ReadOutlined,
  GlobalOutlined,
  GoldOutlined,
  AndroidOutlined,
  RobotOutlined,
  NodeIndexOutlined
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { logoImage } from '@/utils/images'
import { isAuthenticated, removeToken } from '@/utils/token'

const NavbarContainer = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  .ant-menu {
    border-bottom: none;
    background: transparent;
  }

  .ant-menu-item {
    transition: all 0.3s ease;
  }

  .ant-menu-item:hover {
    background: rgba(102, 126, 234, 0.1) !important;
  }

  .ant-menu-item-selected {
    background: rgba(102, 126, 234, 0.15) !important;
    color: #667eea !important;
  }

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.2rem;
  font-weight: bold;
  color: #667eea;
  padding: 0 24px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  img {
    width: 40px;
    height: 40px;
    border-radius: 8px;
  }

  @media (max-width: 768px) {
    padding: 0;
    font-size: 1rem;

    img {
      width: 32px;
      height: 32px;
    }
  }
`

const NavbarContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;

  @media (max-width: 768px) {
    padding: 0 16px;
  }
`

const LogoutButton = styled(Button)`
  border-radius: 20px;
  height: 36px;
  padding: 0 20px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }
`

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    // 检查登录状态
    setIsLoggedIn(isAuthenticated())
  }, [])

  useEffect(() => {
    // 检查登录状态
    const checkLoginStatus = () => {
      const loginStatus = localStorage.getItem('isLoggedIn')
      setIsLoggedIn(loginStatus === 'true')
    }

    checkLoginStatus()

    // 监听存储变化
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'isLoggedIn') {
        setIsLoggedIn(e.newValue === 'true')
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const menuItems = [
    { key: '/home', label: t('nav.home'), icon: <HomeOutlined /> },
    { key: '/cartoon', label: t('nav.cartoon'), icon: <ReadOutlined /> },
    { key: '/papers', label: t('nav.paper'), icon: <BookOutlined /> },
    { key: '/goofish', label: t('nav.goofish'), icon: <AndroidOutlined /> },
    { key: '/video', label: t('nav.video'), icon: <VideoCameraOutlined /> },
    { key: '/music', label: t('nav.music'), icon: <SoundOutlined /> },
    { key: '/gold', label: t('nav.gold'), icon: <GoldOutlined /> },
    { key: '/gpt', label: t('nav.chatgpt'), icon: <MessageOutlined /> },
    { key: '/markmap', label: t('nav.aimarkmap'), icon: <NodeIndexOutlined /> },
    // 如果是移动端，不显示监工菜单项
    ...(isMobile ? [] : [{ key: '/worker', label: t('nav.worker'), icon: <RobotOutlined /> }]),
    { key: '/about', label: t('nav.about'), icon: <UserOutlined /> }
  ]

  const handleMenuClick = (e: { key: string }) => {
    navigate(e.key)
    if (isMobile) {
      setDrawerVisible(false)
    }
  }

  const handleLogout = () => {
    removeToken()
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    setIsLoggedIn(false)
    message.success(t('common.logoutSuccess'))
    navigate('/')
  }

  const handleLogoClick = () => {
    navigate('/home')
  }

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const languageItems: MenuProps['items'] = [
    {
      key: 'zh',
      label: t('common.chinese'),
      onClick: () => handleLanguageChange('zh')
    },
    {
      key: 'en',
      label: t('common.english'),
      onClick: () => handleLanguageChange('en')
    }
  ]

  // 获取当前选中的菜单项
  const getSelectedKey = (pathname: string): string => {
    // 检查是否以 /cartoon 开头
    if (pathname.startsWith('/cartoon')) {
      return '/cartoon'
    }
    // 其他路径直接返回
    return pathname
  }

  const currentKey = getSelectedKey(location.pathname)

  // 移动端视图
  if (isMobile) {
    return (
      <NavbarContainer>
        <NavbarContent>
          <Logo onClick={handleLogoClick}>
            <img src={logoImage} alt="Logo" />
            <span>ChattyPlay</span>
          </Logo>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Dropdown menu={{ items: languageItems }} placement="bottomRight">
              <Button
                type="text"
                icon={<GlobalOutlined />}
                style={{ fontSize: '1.2rem' }}
              />
            </Dropdown>
            {isLoggedIn && (
              <LogoutButton
                type="default"
                icon={<LogoutOutlined />}
                onClick={handleLogout}
                size="small"
              >
                {t('nav.logout')}
              </LogoutButton>
            )}
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              style={{ fontSize: '1.5rem' }}
            />
          </div>
        </NavbarContent>

        <Drawer
          title={t('nav.navigationMenu')}
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentKey]}
            onClick={handleMenuClick}
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Drawer>
      </NavbarContainer>
    )
  }

  // PC端视图
  return (
    <NavbarContainer>
      <NavbarContent>
        <Logo onClick={handleLogoClick}>
          <img src={logoImage} alt="Logo" />
          <span>ChattyPlay</span>
        </Logo>

        <Menu
          mode="horizontal"
          selectedKeys={[currentKey]}
          onClick={handleMenuClick}
          items={menuItems}
          style={{ flex: 1, border: 'none', height: '64px', lineHeight: '64px' }}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Dropdown menu={{ items: languageItems }} placement="bottomRight">
            <Button
              type="text"
              icon={<GlobalOutlined />}
              style={{ fontSize: '1.2rem' }}
            />
          </Dropdown>

          {isLoggedIn ? (
            <LogoutButton
              type="primary"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {t('nav.logout')}
            </LogoutButton>
          ) : (
            <Button
              type="primary"
              icon={<UserOutlined />}
              onClick={() => navigate('/')}
              style={{
                borderRadius: '20px',
                height: '36px',
                padding: '0 20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: '500'
              }}
            >
              {t('nav.login')}
            </Button>
          )}
        </div>
      </NavbarContent>
    </NavbarContainer>
  )
}

export default Navbar
