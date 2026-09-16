import { useState } from 'react'
import { Modal } from 'antd'
import { FaWeixin } from 'react-icons/fa'
import styled from 'styled-components'
import { payImage, wxImage } from '@/utils/images'

const hintMessages = [
  '点这里，联系我或支持一下 🌷',
  '商务合作？来微信聊聊 💬',
  '工作内推？快联系我 🤝',
  '觉得好用？请作者喝杯咖啡 ☕',
  '发现小问题？欢迎告诉我 🐾',
  '喜欢我的项目？点这里支持一下 ❤️'
]

function nextHint(current: number) {
  return (current + 1 + Math.floor(Math.random() * (hintMessages.length - 1))) % hintMessages.length
}

const SupportButton = styled.button`
  position: fixed;
  right: max(24px, env(safe-area-inset-right));
  bottom: max(24px, env(safe-area-inset-bottom));
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  padding: 0;
  border: 2px solid white;
  border-radius: 22px;
  background: #167a42;
  color: white;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(22, 122, 66, 0.28);
  svg { width: 30px; height: 30px; flex-shrink: 0; }
  cursor: pointer;
  animation: wechatSupportPulse 3s ease-in-out infinite;

  &:hover { animation-play-state: paused; background: #126536; }
  &:focus-visible { outline: 3px solid #167a42; outline-offset: 4px; }

  @keyframes wechatSupportPulse {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const HintBubble = styled.span`
  position: absolute;
  bottom: calc(100% + 12px);
  right: -2px;
  width: max-content;
  max-width: calc(100vw - 48px);
  padding: 10px 14px;
  border: 1px solid #dcecdf;
  border-radius: 16px 16px 4px 16px;
  background: #f3fff5;
  color: #245c38;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: 0 4px 16px rgba(22, 122, 66, 0.12);
  pointer-events: none;
  opacity: 0;
  animation: wechatSupportHint 14s ease-in-out infinite;

  &::after {
    content: '';
    position: absolute;
    right: 20px;
    bottom: -5px;
    width: 8px;
    height: 8px;
    background: #f3fff5;
    border-right: 1px solid #dcecdf;
    border-bottom: 1px solid #dcecdf;
    transform: rotate(45deg);
  }

  @keyframes wechatSupportHint {
    0%, 18%, 55%, 100% { opacity: 0; transform: translateY(4px); }
    22%, 50% { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const Codes = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  padding-top: 12px;

  figure {
    margin: 0;
    padding: 16px;
    text-align: center;
    background: #f8f7ff;
    border: 1px solid #eeeafb;
    border-radius: 16px;
  }
  figcaption { margin-bottom: 12px; font-weight: 600; color: #594b85; }
  img { display: block; width: 100%; height: auto; border-radius: 8px; }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

export default function WechatSupport() {
  const [open, setOpen] = useState(false)
  const [hintIndex, setHintIndex] = useState(() => Math.floor(Math.random() * hintMessages.length))

  return (
    <>
      <SupportButton
        type="button"
        aria-label="支持作者 / 联系微信"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="支持作者 / 联系微信"
        onClick={() => setOpen(true)}
      >
        <FaWeixin aria-hidden="true" />
        {!open && (
          <HintBubble
            aria-hidden="true"
            onAnimationIteration={() => setHintIndex(nextHint)}
          >
            {hintMessages[hintIndex]}
          </HintBubble>
        )}
      </SupportButton>
      <Modal
        title="支持作者 · 联系微信"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={600}
        zIndex={10001}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Codes>
          <figure>
            <figcaption>微信赞赏</figcaption>
            <img src={payImage} alt="微信收款二维码" />
          </figure>
          <figure>
            <figcaption>添加微信</figcaption>
            <img src={wxImage} alt="联系作者的微信二维码" />
          </figure>
        </Codes>
      </Modal>
    </>
  )
}
