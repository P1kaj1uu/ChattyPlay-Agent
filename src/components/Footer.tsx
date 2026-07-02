import React from 'react'
import { Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import logoImg from '@/assets/images/logo.png'

const { Text } = Typography

const FooterContainer = styled.footer`
  background: linear-gradient(180deg, #0a0a0f 0%, #000 100%);
  color: #fff;
  padding: 40px 24px 24px;
  margin-top: auto;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
`

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 32px;

  @media (min-width: 768px) {
    grid-template-columns: 1.4fr 1fr 1.1fr;
    gap: 48px;
  }
`

const BrandBlock = styled.div``

const LogoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
`

const LogoImg = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  object-fit: cover;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.35);
`

const BrandName = styled.span`
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #b06ab3 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.5px;
`

const Slogan = styled(Text)`
  display: block;
  color: rgba(255, 255, 255, 0.55) !important;
  font-size: 13px;
  line-height: 1.7;
  max-width: 320px;
`

const ColumnTitle = styled.h4`
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px;
  position: relative;
  padding-bottom: 10px;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: 28px;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, #667eea, #b06ab3);
  }
`

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
`

const NavItem = styled.li`
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;

  &:hover {
    color: #fff;
    transform: translateX(3px);
  }
`

const ContactRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  color: rgba(255, 255, 255, 0.75);
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
`

const BottomBar = styled.div`
  max-width: 1200px;
  margin: 32px auto 0;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
`

const Footer: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const navLinks = [
    { path: '/cartoon', label: t('nav.cartoon') },
    { path: '/papers', label: t('nav.paper') },
    { path: '/goofish', label: t('nav.goofish') },
    { path: '/video', label: t('nav.video') },
    { path: '/music', label: t('nav.music') },
    { path: '/gold', label: t('nav.gold') },
    { path: '/gpt', label: t('nav.chatgpt') },
    { path: '/markmap', label: t('nav.aimarkmap') },
  ]

  return (
    <FooterContainer>
      <FooterInner>
        {/* 左：Logo + ChattyPlay */}
        <BrandBlock>
          <LogoRow>
            <LogoImg src={logoImg} alt="ChattyPlay" />
            <BrandName>ChattyPlay</BrandName>
          </LogoRow>
          <Slogan>{t('home.footer.description')}</Slogan>
          <br />
          <Slogan>{t('home.footer.welcome')}</Slogan>
        </BrandBlock>

        {/* 中：快捷导航 */}
        <div>
          <ColumnTitle>{t('home.footer.quickNav')}</ColumnTitle>
          <NavList>
            {navLinks.map((item) => (
              <NavItem key={item.path} onClick={() => navigate(item.path)}>
                {item.label}
              </NavItem>
            ))}
          </NavList>
        </div>

        {/* 右：联系我 */}
        <div>
          <ColumnTitle>{t('home.footer.contact')}</ColumnTitle>
          <ContactRow>
            <span>{t('home.footer.wechat')}</span>
          </ContactRow>
          <ContactRow>
            <span>{t('home.footer.email')}</span>
          </ContactRow>
          <ContactRow>
            <span>{t('home.footer.github')}</span>
          </ContactRow>
        </div>
      </FooterInner>

      <BottomBar>
        <span>{t('common.copyright')}</span>
      </BottomBar>
    </FooterContainer>
  )
}

export default Footer
