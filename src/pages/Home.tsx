import React from 'react'
import { Typography, Row, Col, Card } from 'antd'
import {
  SoundOutlined,
  VideoCameraOutlined,
  TranslationOutlined,
  MessageOutlined,
  PictureOutlined,
  QuestionCircleOutlined,
  ReadOutlined,
  BookOutlined,
  GoldOutlined,
  AndroidOutlined,
  RobotOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import { logoImage } from '@/utils/images'

const { Title, Paragraph } = Typography

const HomeContainer = styled.div`
  width: 100%;
  min-height: calc(100vh - 64px);
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  position: relative;
  overflow: hidden;

  /* 背景动画效果 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.05) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(118, 75, 162, 0.05) 0%, transparent 50%);
    animation: backgroundPulse 15s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes backgroundPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.05);
    }
  }
`

const ContentWrapper = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 24px 16px;
  }
`

const WelcomeSection = styled.div`
  text-align: center;
  padding: 40px 20px;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;

  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .logo {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    margin-bottom: 20px;
    animation: logoFloat 3s ease-in-out infinite;
  }

  @keyframes logoFloat {
    0%, 100% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-10px) rotate(5deg);
    }
  }

  @media (max-width: 768px) {
    padding: 24px 16px;
  }

  h1 {
    font-size: clamp(1.8rem, 5vw, 2.5rem) !important;
  }

  p {
    font-size: clamp(1rem, 2vw, 1.2rem) !important;
  }
`

const ContentCard = styled(Card)`
  border-radius: 16px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  height: 100%;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  width: 100%;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }

  &:hover::before {
    transform: scaleX(1);
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
  }

  .ant-card-body {
    padding: 24px;

    @media (max-width: 768px) {
      padding: 20px;
    }
  }
`

const FeatureIcon = styled.div`
  font-size: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  transition: transform 0.3s ease;

  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

const Home: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const features = [
    {
      title: t('home.features.music.title'),
      description: t('home.features.music.description'),
      icon: <SoundOutlined />,
      path: '/music'
    },
    {
      title: t('home.features.video.title'),
      description: t('home.features.video.description'),
      icon: <VideoCameraOutlined />,
      path: '/video'
    },
    {
      title: t('home.features.papers.title'),
      description: t('home.features.papers.description'),
      icon: <BookOutlined />,
      path: '/papers'
    },
    {
      title: t('home.features.goofish.title'),
      description: t('home.features.goofish.description'),
      icon: <AndroidOutlined />,
      path: '/goofish'
    },
    {
      title: t('home.features.chatgpt.title'),
      description: t('home.features.chatgpt.description'),
      icon: <MessageOutlined />,
      path: '/gpt'
    },
    {
      title: t('home.features.gold.title'),
      description: t('home.features.gold.description'),
      icon: <GoldOutlined />,
      path: '/gold'
    },
    {
      title: t('home.features.cartoon.title'),
      description: t('home.features.cartoon.description'),
      icon: <ReadOutlined />,
      path: '/cartoon'
    },
    {
      title: t('home.features.worker.title'),
      description: t('home.features.worker.description'),
      icon: <RobotOutlined />,
      path: '/worker'
    },
    {
      title: t('home.features.textToPhoto.title'),
      description: t('home.features.textToPhoto.description'),
      icon: <PictureOutlined />,
      path: '/text-to-photo'
    },
    {
      title: t('home.features.trans.title'),
      description: t('home.features.trans.description'),
      icon: <TranslationOutlined />,
      path: '/trans'
    },
    {
      title: t('home.features.help.title'),
      description: t('home.features.help.description'),
      icon: <QuestionCircleOutlined />,
      path: '/help'
    }
  ]

  return (
    <HomeContainer>
      <ContentWrapper>
        <WelcomeSection>
          <img
            src={logoImage}
            alt="Logo"
            className="logo"
            style={{ width: '80px', height: '80px', borderRadius: '50%', 'display': 'inline-block', textAlign: 'center' }}
          />
          <Title level={1} style={{
            marginBottom: '16px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {t('home.welcome')}
          </Title>
          <Paragraph style={{
            color: '#64748b',
            marginBottom: '0',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('home.description')}
          </Paragraph>
        </WelcomeSection>

        <Row gutter={[16, 16]}>
          {features.map((feature, index) => (
            <Col
              xs={24}
              sm={12}
              md={8}
              key={index}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              <ContentCard
                hoverable
                onClick={() => navigate(feature.path)}
                style={{ animation: 'fadeInUp 0.6s ease-out forwards', opacity: 0 }}
              >
                <FeatureIcon>{feature.icon}</FeatureIcon>
                <Title level={4} style={{ marginBottom: '12px', fontSize: '1.1rem' }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: '#64748b', marginBottom: 0, minHeight: '48px', fontSize: '0.95rem' }}>
                  {feature.description}
                </Paragraph>
              </ContentCard>
            </Col>
          ))}
        </Row>

        <div style={{
          marginTop: '40px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
        }}>
          <Paragraph style={{
            fontSize: '1rem',
            color: '#64748b',
            marginBottom: '12px'
          }}>
            {t('home.footer.slogan')}
          </Paragraph>
          <Paragraph style={{ color: '#94a3b8', marginBottom: 0, fontSize: '0.9rem' }}>
            {t('home.footer.thanks')}
          </Paragraph>
        </div>
      </ContentWrapper>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </HomeContainer>
  )
}

export default Home
