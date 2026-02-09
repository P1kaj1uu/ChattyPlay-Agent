import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Checkbox, message, Space } from 'antd'
import {
  UserOutlined,
  LockOutlined,
  KeyOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons'
import { useGoogleLogin } from '@react-oauth/google'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import VerifyCode from '../components/VerifyCode'
import HeartBeat from '../components/HeartBeat'
import { logoImage } from '@/utils/images'
import { setToken } from '@/utils/token'

// 创建气泡组件
const Bubble = styled.div<{ size: number; left: number; delay: number; popped: boolean }>`
  position: absolute;
  bottom: -100px;
  left: ${props => props.left}%;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3));
  border-radius: 50%;
  animation: rise ${props => 4 + props.delay}s ease-in infinite;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.1s ease-out, opacity 0.1s ease-out;
  ${props => props.popped && `
    animation: none;
    transform: scale(0);
    opacity: 0;
  `}

  @keyframes rise {
    0% {
      bottom: -100px;
      opacity: 0;
      transform: translateX(0) scale(1);
    }
    10% {
      opacity: 0.8;
    }
    90% {
      opacity: 0.8;
      transform: translateX(${props => Math.sin(props.delay * 10) * 30}px) scale(1);
    }
    100% {
      bottom: 100vh;
      opacity: 0;
      transform: translateX(${props => Math.sin(props.delay * 10) * 50}px) scale(1.2);
    }
  }

  /* 气泡光泽效果 */
  &::after {
    content: '';
    position: absolute;
    top: 15%;
    left: 20%;
    width: 30%;
    height: 30%;
    background: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    filter: blur(2px);
  }
`

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(45deg, #667eea, #764ba2, #f093fb, #f5576c, #667eea);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  position: relative;
  overflow: hidden;

  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* 动态光晕效果 */
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
    background-size: 60px 60px;
    animation: moveBackground 30s linear infinite;
  }

  @keyframes moveBackground {
    0% { transform: translate(0, 0) rotate(0deg); }
    100% { transform: translate(60px, 60px) rotate(360deg); }
  }
`

const LoginBox = styled.div`
  width: 100%;
  max-width: 400px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  position: relative;
  z-index: 1;
  padding: 32px;
  animation: boxAppear 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes boxAppear {
    from {
      opacity: 0;
      transform: translateY(30px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 24px;
  }
`

const Logo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;

  img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    margin-bottom: 12px;
    animation: logoAnimation 3s ease-in-out infinite;
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }

  @keyframes logoAnimation {
    0%, 100% {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.05);
    }
  }

  h3 {
    margin: 0;
    font-size: 1.3rem;
    font-weight: bold;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.1em;
  }
`

const OAuthDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
  color: #94a3b8;
  font-size: 0.875rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, transparent, #e2e8f0, transparent);
  }

  &::before {
    margin-right: 16px;
  }

  &::after {
    margin-left: 16px;
  }
`

const OAuthButtonContainer = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`

const OAuthButton = styled.button<{ variant: 'google' | 'github' }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  border: 1px solid ${props => props.variant === 'google' ? '#dadce0' : '#d1d5db'};
  border-radius: 8px;
  background: ${props => props.variant === 'google' ? '#fff' : '#24292e'};
  color: ${props => props.variant === 'github' ? '#fff' : '#3c4043'};
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0 16px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px ${props => props.variant === 'google' ? 'rgba(60, 64, 67, 0.3)' : 'rgba(36, 41, 46, 0.3)'};
    border-color: ${props => props.variant === 'google' ? '#d3d3d3' : '#1a202c'};
  }

  &:active {
    transform: translateY(0);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`

const Login: React.FC = () => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [verifyCode, setVerifyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [isAgreed, setIsAgreed] = useState(true)
  const [showHeartBeat, setShowHeartBeat] = useState(false)
  const navigate = useNavigate()
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: 15 }, () => ({
      size: Math.random() * 30 + 10,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      popped: false
    }))
  )

  useEffect(() => {
    generateVerifyCode()

    // 气泡破裂效果
    const popBubbles = setInterval(() => {
      setBubbles(prev => {
        const popIndex = Math.floor(Math.random() * prev.length)
        const newBubbles = [...prev]

        // 破裂动画
        newBubbles[popIndex] = { ...newBubbles[popIndex], popped: true }

        // 重新生成该气泡
        setTimeout(() => {
          setBubbles(current => {
            const reset = [...current]
            reset[popIndex] = {
              size: Math.random() * 30 + 10,
              left: Math.random() * 100,
              delay: Math.random() * 3,
              popped: false
            }
            return reset
          })
        }, 100)

        return newBubbles
      })
    }, 2000)

    return () => clearInterval(popBubbles)
  }, [])

  const generateVerifyCode = () => {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setVerifyCode(code)
  }

  const handleLogin = async (values: any) => {
    const isCodeValid = values.code?.toUpperCase() === verifyCode.toUpperCase()

    if (!isCodeValid) {
      message.error(t('login.verifyCodeError'))
      generateVerifyCode()
      form.setFieldsValue({ code: '' })
      return
    }

    if (!isAgreed) {
      message.error(t('login.agreeRequired'))
      return
    }

    setLoading(true)
    try {
      // 模拟登录过程
      await new Promise(resolve => setTimeout(resolve, 1500))

      // 保存登录状态和 token
      setToken()
      localStorage.setItem('isLoggedIn', 'true')
      localStorage.setItem('username', values.username)

      message.success(t('login.loginSuccess'))
      // 显示心跳动画
      setShowHeartBeat(true)
    } catch (error) {
      message.error(t('login.loginFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleGuestLogin = () => {
    // 游客登录也保存状态和 token
    setToken()
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', '游客')
    message.success(t('login.guestLoginSuccess'))
    // 游客访问不显示心跳动画，直接跳转到首页
    setShowHeartBeat(false)
    handleHeartBeatComplete()
  }

  const handleHeartBeatComplete = () => {
    navigate('/home')
  }

  const handleReset = () => {
    form.resetFields()
  }

  // Google OAuth
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('Google Access Token:', tokenResponse)

      // 获取用户信息
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`
          }
        })
        const userData = await response.json()
        console.log('Google User Data:', userData)

        // 保存登录状态
        setToken()
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('username', userData.name || 'Google User')
        localStorage.setItem('email', userData.email || '')
        localStorage.setItem('avatar', userData.picture || '')

        message.success(t('login.loginSuccess'))
        setShowHeartBeat(true)
      } catch (error) {
        console.error('Error fetching Google user info:', error)
        message.error(t('login.loginFailed'))
      }
    },
    onError: () => {
      console.error('Google Login Failed')
      message.error(t('login.loginFailed'))
    },
  })

  // GitHub OAuth 处理
  const handleGithubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId || clientId === 'your_github_client_id_here') {
      message.error('GitHub Client ID 未配置，请先配置')
      return
    }

    // 构建 GitHub OAuth 授权 URL，直接回调到 /home
    const redirectUri = window.location.origin + '/home'
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`

    // 跳转到 GitHub 授权页面
    window.location.href = githubAuthUrl
    setToken()
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', 'githubUser')
  }

  return (
    <>
      {showHeartBeat ? (
        <HeartBeat onComplete={handleHeartBeatComplete} />
      ) : (
        <LoginContainer>
          {bubbles.map((bubble, index) => (
            <Bubble
              key={index}
              size={bubble.size}
              left={bubble.left}
              delay={bubble.delay}
              popped={bubble.popped}
            />
          ))}

          <LoginBox>
        <Logo>
          <img src={logoImage} alt="Logo" />
          <h3>ChattyPlay</h3>
        </Logo>

        <Form
          form={form}
          onFinish={handleLogin}
          layout="vertical"
          initialValues={{
            username: 'P1Kaj1uu',
            password: 'OwaGDragon'
          }}
        >
          <Form.Item
            name="username"
            label={t('login.account')}
            rules={[{ required: true, message: t('login.accountRequired') }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('login.accountPlaceholder')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('login.password')}
            rules={[
              { required: true, message: t('login.passwordRequired') },
              { min: 6, max: 11, message: t('login.passwordLength') }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('login.passwordPlaceholder')}
              size="large"
              iconRender={(visible) => (
                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
              )}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label={t('login.verifyCode')}
            rules={[{ required: true, message: t('login.verifyCodeRequired') }]}
          >
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Input
                prefix={<KeyOutlined />}
                placeholder={t('login.verifyCodePlaceholder')}
                size="large"
                maxLength={4}
                style={{ flex: 1 }}
              />
              <div style={{ cursor: 'pointer', userSelect: 'none' }} onClick={generateVerifyCode}>
                <VerifyCode code={verifyCode} />
              </div>
            </div>
          </Form.Item>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
              >
                {t('login.agree')}
              </Checkbox>
            </div>
          </div>

          <Form.Item style={{ marginBottom: '12px' }}>
            <Space style={{ width: '100%', justifyContent: 'center' }} size={8}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                style={{
                  flex: 1,
                  height: '44px',
                  fontSize: '0.95rem',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none'
                }}
              >
                {t('login.loginBtn')}
              </Button>
              <Button
                onClick={handleGuestLogin}
                style={{ flex: 1, height: '44px', fontSize: '0.95rem' }}
              >
                {t('login.guestBtn')}
              </Button>
              <Button
                onClick={handleReset}
                style={{ flex: 1, height: '44px', fontSize: '0.95rem' }}
              >
                {t('login.resetBtn')}
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* OAuth 第三方登录 */}
        <OAuthDivider>{t('login.thirdPartyLoginTip')}</OAuthDivider>

        <OAuthButtonContainer>
          <OAuthButton variant="google" onClick={() => googleLogin()}>
            <FcGoogle />
            Google
          </OAuthButton>
          <OAuthButton variant="github" onClick={handleGithubLogin}>
            <FaGithub />
            GitHub
          </OAuthButton>
        </OAuthButtonContainer>
      </LoginBox>
      </LoginContainer>
      )}
    </>
  )
}

export default Login
