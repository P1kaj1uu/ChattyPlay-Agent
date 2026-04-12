import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Input, Button, Avatar, message, Modal, Tooltip, Badge } from 'antd'
import {
  SendOutlined,
  CopyOutlined,
  DeleteOutlined,
  UserOutlined,
  RobotOutlined,
  SoundOutlined,
  StopOutlined,
  DownloadOutlined,
  LikeOutlined,
  DislikeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import OpenAI from 'openai'
import { marked } from 'marked'
import HCaptcha from '@hcaptcha/react-hcaptcha'
import 'highlight.js/styles/github-dark.css'
import '@/assets/css/ai.scss'

const { TextArea } = Input

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true
})

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  rating?: 'like' | 'dislike'
}

interface CaptchaPromise {
  resolve: (token: string) => void
  reject: (reason?: any) => void
  timeoutId?: NodeJS.Timeout
}

const GPT: React.FC = () => {
  const { t } = useTranslation()
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: t('gpt.welcomeMessage'),
      timestamp: Date.now() - 1000
    }
  ])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const autoSendTriggerRef = useRef<string | null>(null)
  const hcaptchaRef = useRef<any>(null)
  const captchaPromiseRef = useRef<CaptchaPromise | null>(null)

  // 初始化 OpenAI 客户端（从环境变量读取配置）
  const openai = new OpenAI({
    baseURL: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    dangerouslyAllowBrowser: true
  })

  // 加载本地存储的消息
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chat_messages')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed)
        }
      }
    } catch (err) {
      console.error('加载消息失败:', err)
    }
  }, [])

  // 保存消息到本地存储
  const saveMessagesToLocalStorage = useCallback((msgs: ChatMessage[]) => {
    try {
      localStorage.setItem('chat_messages', JSON.stringify(msgs))
    } catch (err) {
      console.error('保存消息失败:', err)
    }
  }, [])

  // 滚动到底部
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 100)
  }, [])

  // 聚焦输入框
  const focusInput = useCallback(() => {
    inputRef.current?.focus()
  }, [])

  // 初始化代码复制按钮
  const initCodeCopyButtons = useCallback(() => {
    setTimeout(() => {
      const copyButtons = document.querySelectorAll('.copy-btn')
      copyButtons.forEach((button) => {
        const newButton = button.cloneNode(true)
        button.parentNode?.replaceChild(newButton, button)
      })

      document.querySelectorAll('.copy-btn').forEach((button) => {
        button.addEventListener('click', async (e: Event) => {
          e.preventDefault()
          e.stopPropagation()
          const target = e.currentTarget as HTMLElement
          const code = target.getAttribute('data-code')
          if (code) {
            try {
              const decodedCode = decodeURIComponent(code)
              await navigator.clipboard.writeText(decodedCode)
              message.success(t('gpt.copySuccess'))
            } catch (err) {
              const textArea = document.createElement('textarea')
              textArea.value = decodeURIComponent(code)
              document.body.appendChild(textArea)
              textArea.select()
              document.execCommand('copy')
              document.body.removeChild(textArea)
              message.success(t('gpt.copySuccess'))
            }
          }
        })
      })
    }, 100)
  }, [])

  // 监听消息变化
  useEffect(() => {
    scrollToBottom()
    initCodeCopyButtons()
    saveMessagesToLocalStorage(messages)
  }, [messages, scrollToBottom, initCodeCopyButtons, saveMessagesToLocalStorage])

  // 监听自动发送触发器
  useEffect(() => {
    if (autoSendTriggerRef.current && inputMessage === autoSendTriggerRef.current) {
      autoSendTriggerRef.current = null

      // 延迟一下确保状态已更新
      setTimeout(() => {
        if (inputMessage.trim() && !isStreaming) {
          sendMessage()
        }
      }, 100)
    }
  }, [inputMessage, isStreaming])

  // 监听流式内容变化
  useEffect(() => {
    if (streamingContent) {
      scrollToBottom()
    }
  }, [streamingContent, scrollToBottom])

  // 初始化语音合成
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    }

    return () => {
      if (speechSynthesisRef.current) {
        speechSynthesisRef.current.cancel()
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Markdown 渲染函数
  const renderMarkdown = useCallback((text: string): string => {
    if (!text) return ''
    const rendered = marked.parse(text) as string

    // 为代码块添加复制按钮
    return rendered.replace(
      /<pre><code class="hljs language-(\w+)">([\s\S]*?)<\/code><\/pre>/g,
      (_match: string, lang: string, code: string) => {
        const escapedCode = code.replace(/"/g, '&quot;')
        return `<div class="code-container">
          <div class="code-header">
            <span class="language-label">${lang}</span>
            <button class="copy-btn" data-code="${encodeURIComponent(escapedCode)}">
              <svg class="copy-icon" viewBox="0 0 24 24" width="14" height="14">
                <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              {t('common.copy')}
            </button>
          </div>
          <pre><code class="hljs language-${lang}">${code}</code></pre>
        </div>`
      }
    )
  }, [])

  // 格式化时间
  const formatTime = useCallback((timestamp: number) => {
    const date = new Date(timestamp)
    return date
      .toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
      .replace(/\//g, '-')
      .replace(/,/g, '')
  }, [])

  // 发送消息 - 流式处理
  const sendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) {
      return
    }
    
    try {
      const token = await new Promise<string>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          if (captchaPromiseRef.current) {
            reject(new Error('验证超时，请重试'))
            captchaPromiseRef.current = null
          }
        }, 120000)
        
        captchaPromiseRef.current = { resolve, reject, timeoutId }
        
        if (hcaptchaRef.current) {
          hcaptchaRef.current.execute()
        } else {
          reject(new Error('HCaptcha 组件未初始化'))
        }
      })
      
      console.log('验证通过，token:', token)
      const userMessage = inputMessage.trim()
    const newMessages = [
      ...messages,
      {
        role: 'user' as const,
        content: userMessage,
        timestamp: Date.now()
      }
    ]

    setMessages(newMessages)
    setInputMessage('')
    scrollToBottom()
    focusInput()

    setIsStreaming(true)
    setStreamingContent('')

    // 创建中止控制器
    abortControllerRef.current = new AbortController()

    try {
      // 准备对话历史
      const conversationHistory = newMessages
        .filter((msg) => msg.role === 'user' || msg.role === 'assistant')
        .map((msg) => ({
          role: msg.role,
          content: msg.content
        }))

      // 调用流式 API
      const stream = await openai.chat.completions.create(
        {
          model: 'deepseek-v3-2-251201',
          messages: [
            {
              role: 'system',
              content: `You are a ChattyPlay AI assistant, focused on helping users learn, answer questions, and provide study advice. Please answer in a friendly, professional tone, and try to use Markdown format to organize your content, including:
- Use headings (#, ##, ###) to organize content structure
- Use lists (-, 1.) to enumerate key points
- Use code blocks (\`\`\`) to display code examples
- Use bold (**) to emphasize important concepts
- Use tables to compare information

Please ensure your answers are accurate, detailed, and easy to understand.`
            },
            ...conversationHistory
          ],
          stream: true,
          max_tokens: 2000
        },
        {
          signal: abortControllerRef.current.signal
        }
      )

      // 处理流式响应
      let accumulatedContent = ''
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          accumulatedContent += content
          setStreamingContent(accumulatedContent)
        }
      }

      // 流式完成，将内容添加到消息列表
      if (accumulatedContent) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: accumulatedContent,
            timestamp: Date.now()
          }
        ])
        message.success(t('gpt.replyComplete'))
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('请求被用户中止')
        if (streamingContent) {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: streamingContent,
              timestamp: Date.now()
            }
          ])
          message.info(t('gpt.replyInterrupted'))
        }
      } else {
        console.error('API调用错误:', error)
        // 备用回复
        const fallbackResponse = `${t('gpt.fallbackResponse')}

## Learning Suggestions
1. **Understand Core Concepts**: Master the basics first
2. **Practice**: Deepen understanding through practice
3. **Seek Help**: Ask teachers or classmates for assistance

## Recommended Resources
- Relevant textbooks and reference materials
- Online learning platforms
- Educational video resources

If you need more detailed answers, please try again later or contact technical support.`
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: fallbackResponse,
            timestamp: Date.now()
          }
        ])
        message.error(t('gpt.networkError'))
      }
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      abortControllerRef.current = null
      // 清除url参数
      window.history.replaceState({}, document.title, window.location.pathname)
      scrollToBottom()
    }

    } catch (error) {}

  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paperTitle = urlParams.get('paper')
    const pdfUrl = urlParams.get('pdf')
    // 判断是否url上有paper和pdf参数
    if (paperTitle && pdfUrl) {
      let content = `
        论文解读分析，论文链接是：${pdfUrl}，论文标题是：${paperTitle}。

        你是一名AI领域的研究生，目标是深入理解论文的方法部分，包括方法动机、设计逻辑、流程细节、优势与不足，以便学习和在研究中借鉴。你的角色是高效、深入的论文分析师。
        
        任务：
          请在阅读论文（用户提供的论文链接和论文标题）后，围绕以下要点进行总结和分析：
          0. 翻译摘要原文
          1. 方法动机
            a) 作者为什么提出这个方法？阐述其背后的驱动力。
            b) 现有方法的痛点/不足是什么？具体指出局限性。
            c) 论文的研究假设或直觉是什么？用简洁语言概括。
          2. 方法设计
            a) 给出清晰的方法流程总结（pipeline），逐步解释输入→处理→输出。必须讲清楚每一步的具体操作和技术细节。这一步必须非常细致，这是用户的主要阅读目标。
            b) 如果涉及模型结构，请描述每个模块的功能与作用，以及它们如何协同工作。
            c) 如果有公式/算法，请用通俗语言解释它们的意义和在方法中的角色。
          3. 与其他方法对比
            a) 本方法和现有主流方法相比，有什么本质不同？
            b) 创新点在哪里？明确指出贡献度。
            c) 在什么场景下更适用？分析其适用范围。
            d) 用表格总结 方法对比（优点/缺点/改进点），确保对比项清晰。
          4. 实验表现与优势
            a) 作者如何验证该方法的有效性？描述实验设计和设置。
            b) 实验结果在哪些指标上超越了对比方法？列出几个最具代表性的关键数据和结论。
            c) 哪些场景/数据集下优势最明显？提供具体证据。
            d) 是否有局限性（比如泛化能力、计算开销、对特定数据的依赖）？指出论文中承认或隐含的不足。
          5. 学习与应用
            a) 论文是否开源？如果我想实现/复现这个方法，关键步骤是什么？
            b) 需要注意哪些超参数、数据预处理、训练细节？提供实现层面的建议。
            c) 该方法能否迁移到其他任务？如果能，如何迁移？
          6. 总结
            a) 用一句话概括这个方法的核心思想（不超过50字）。
            b) 给出一个“速记版pipeline”（使用3-5个关键步骤），方便记忆。这个pipeline不要使用论文使用的专业词汇，而是应当具有自明性，让读者只看pipeline即可大体理解论文内容。不要用比喻，直白的讲出内容。
        
        行为和规则：
          - 语言风格：专业、严谨、逻辑性强，完全采用中文进行回复。
          - 回复结构：严格按照上述六个大点和其子点进行分析和总结，使用清晰的分段和编号。
          - 数据来源：所有分析必须基于用户提供的论文内容信息。如果用户没有提供足够信息，可以基于常识进行合理推测，但必须明确指出是推测。
          - 聚焦核心：重点解析方法（Methodology）部分，避免过度讨论引言和结论。
          - 输出要求：用户可能不再阅读论文具体内容，而是只阅读你提供的信息，因此请确保你的分析详尽且准确。
      `
      setIsStreaming(false)
      autoSendTriggerRef.current = content
      setInputMessage(content)
    }
  }, [])

  // 停止生成
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
    }
  }

  // 复制消息
  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      message.success(t('gpt.copySuccess'))
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      message.success(t('gpt.copySuccess'))
    }
  }

  // 语音播报
  const speakMessage = (content: string) => {
    if (!('speechSynthesis' in window)) {
      message.warning(t('gpt.browserNotSupportSpeech'))
      return
    }

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel()
    }

    // 移除Markdown标记，只播报纯文本
    const plainText = content
      .replace(/#{1,6}\s?/g, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体
      .replace(/`(.*?)`/g, '$1') // 移除行内代码
      .replace(/```[\s\S]*?```/g, '') // 移除代码块
      .replace(/\[([^\[]+)\]\(([^\)]+)\)/g, '$1') // 移除链接标记

    const utterance = new SpeechSynthesisUtterance(plainText)
    utterance.lang = 'zh-CN'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onstart = () => {
      message.info(t('gpt.speakStart'))
    }
    utterance.onend = () => {
      message.success(t('gpt.speakComplete'))
    }
    utterance.onerror = () => {
      message.error(t('gpt.speakError'))
    }

    speechSynthesisRef.current?.speak(utterance)
  }

  // 评分消息
  const rateMessage = (index: number, rating: 'like' | 'dislike') => {
    if (messages[index].role === 'assistant') {
      const newMessages = [...messages]
      newMessages[index].rating = rating
      setMessages(newMessages)
      message.success(rating === 'like' ? t('gpt.feedbackLike') : t('gpt.feedbackDislike'))
    }
  }

  // 清空消息
  const clearMessages = () => {
    Modal.confirm({
      title: t('gpt.clearConfirmTitle'),
      content: t('gpt.clearConfirmContent'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      onOk: () => {
        setMessages([
          {
            role: 'assistant',
            content: t('gpt.welcomeMessage'),
            timestamp: Date.now()
          }
        ])
        localStorage.removeItem('chat_messages')
        message.success(t('gpt.cleared'))
        scrollToBottom()
      }
    })
  }

  // 导出聊天记录
  const exportChat = () => {
    const chatText = messages
      .map((msg) => {
        const role = msg.role === 'user' ? t('gpt.userRole') : t('gpt.aiRole')
        const time = formatTime(msg.timestamp)
        return `[${role} ${time}]\n${msg.content}\n`
      })
      .join('\n' + '='.repeat(50) + '\n\n')

    const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t('gpt.exportFilename')}_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    message.success(t('gpt.exportSuccess'))
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleVerify = (token: string) => {
    console.log('hcaptcha验证成功', token)
    if (captchaPromiseRef.current) {
      if ((captchaPromiseRef.current as any).timeoutId) {
        clearTimeout((captchaPromiseRef.current as any).timeoutId)
      }
      captchaPromiseRef.current.resolve(token)
      captchaPromiseRef.current = null
    }
  }

  const handleError = (err: any) => {
    console.error('hcaptcha验证失败', err)
    if (captchaPromiseRef.current) {
      if ((captchaPromiseRef.current as any).timeoutId) {
        clearTimeout((captchaPromiseRef.current as any).timeoutId)
      }
      captchaPromiseRef.current.reject(new Error('验证失败，请重试'))
      captchaPromiseRef.current = null
    }
    message.error('验证失败，请重试')
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-2 md:p-4">
      {/* 主聊天区域 */}
      <div className="mx-auto max-w-5xl bg-white rounded-xl md:rounded-2xl shadow-xl overflow-hidden h-[calc(100vh-16px)] md:h-auto flex flex-col">
        {/* 头部 */}
        <div className="p-3 md:p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-500 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-3">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-white">{t('gpt.title')}</h1>
                <p className="text-blue-100 text-xs md:text-sm hidden sm:block">{t('gpt.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2">
              <Badge status="success" text={<span className="text-white text-xs hidden md:inline-block">{t('gpt.modelName')}</span>} />
              {isStreaming && (
                <Button
                  size="small"
                  danger
                  onClick={stopGeneration}
                  icon={<StopOutlined />}
                  className="text-xs px-2"
                >
                  <span className="hidden sm:inline">{t('gpt.stopGenerate')}</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* 消息区域 */}
        <div
          ref={messagesContainerRef}
          className={`overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 custom-scrollbar flex-1 min-h-[160px] md:min-h-[calc(100vh-200px)] ${
            messages.length > 0 ? '' : 'flex items-center justify-center'
          }`}
        >
          {/* 欢迎消息 */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 welcome-animate">
              <Avatar
                size={64}
                className="mb-3 md:mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 shadow-lg"
                icon={<RobotOutlined />}
              />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2 text-center">{t('gpt.title')}</h2>
              <p className="text-gray-600 text-center max-w-md text-sm md:text-base">
                {t('gpt.welcomeMessage')}
              </p>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-2 md:gap-3 message-animate ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* 头像 */}
              <Avatar
                size={32}
                className={`flex-shrink-0 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                }`}
                icon={msg.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
              />

              {/* 消息内容 */}
              <div
                className={`max-w-[85%] sm:max-w-[80%] md:max-w-[70%] rounded-xl md:rounded-2xl p-3 md:p-4 relative group ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 rounded-br-none border border-emerald-100'
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 rounded-bl-none border border-blue-100'
                }`}
              >
                {/* 操作按钮 */}
                <div
                  className={`absolute -top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    msg.role === 'user' ? '-left-2' : '-right-2'
                  }`}
                >
                  <Tooltip title={t('gpt.copy')}>
                    <Button
                      size="small"
                      shape="circle"
                      icon={<CopyOutlined />}
                      onClick={() => copyMessage(msg.content)}
                    />
                  </Tooltip>
                  {msg.role === 'assistant' && (
                    <>
                      <Tooltip title={t('gpt.readAloud')}>
                        <Button
                          size="small"
                          shape="circle"
                          icon={<SoundOutlined />}
                          onClick={() => speakMessage(msg.content)}
                        />
                      </Tooltip>
                      <Tooltip title={t('gpt.helpful')}>
                        <Button
                          size="small"
                          shape="circle"
                          icon={<LikeOutlined />}
                          type={msg.rating === 'like' ? 'primary' : 'default'}
                          onClick={() => rateMessage(index, 'like')}
                        />
                      </Tooltip>
                    </>
                  )}
                </div>

                {/* 消息内容 */}
                <div className={msg.role === 'user' ? 'text-gray-800' : ''}>
                  {msg.role === 'assistant' ? (
                    <div
                      className="markdown-content"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                    />
                  ) : (
                    msg.content
                  )}
                </div>

                {/* 消息时间和评分 */}
                <div
                  className={`flex items-center justify-between mt-3 pt-3 border-t ${
                    msg.role === 'user' ? 'border-emerald-100 ml-auto' : 'border-blue-100'
                  }`}
                >
                  <div className={`text-xs ${msg.role === 'user' ? 'text-gray-500 ml-auto' : 'text-gray-500'}`}>
                    {formatTime(msg.timestamp)}
                  </div>
                  {msg.role === 'assistant' && msg.rating && (
                    <div className="flex items-center text-xs text-gray-500">
                      {msg.rating === 'like' ? (
                        <LikeOutlined className="text-green-500 mr-1" />
                      ) : (
                        <DislikeOutlined className="text-red-500 mr-1" />
                      )}
                      <span>{msg.rating === 'like' ? t('gpt.helpful') : t('gpt.needsImprovement')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* 流式输出显示 */}
          {isStreaming && (
            <div className="flex gap-2 md:gap-3 message-animate">
              <Avatar size={32} className="bg-gradient-to-r from-blue-500 to-indigo-500" icon={<RobotOutlined />} />
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl md:rounded-2xl rounded-bl-none p-3 md:p-4 w-full border border-blue-100">
                <div className="flex items-center space-x-2 mb-2 md:mb-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-400 rounded-full pulse" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full pulse" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-400 rounded-full pulse" style={{ animationDelay: '300ms' }}></div>
                  </div>
                  <span className="text-xs md:text-sm text-gray-500">{t('gpt.typing')}</span>
                </div>
                <div className="markdown-content streaming-content">
                  <div
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(streamingContent) }}
                    className="min-h-[20px]"
                  />
                  <span className="cursor-blink">|</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="border-t p-3 md:p-4 bg-gray-50 flex-shrink-0">
          {/* 快捷操作栏 */}
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="flex items-center space-x-1 md:space-x-2">
              <Tooltip title={t('gpt.clearTooltip')}>
                <Button size="small" icon={<DeleteOutlined />} onClick={clearMessages} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">{t('gpt.clearBtn')}</span>
                </Button>
              </Tooltip>
              <Tooltip title={t('gpt.exportTooltip')}>
                <Button size="small" icon={<DownloadOutlined />} onClick={exportChat} className="text-xs md:text-sm">
                  <span className="hidden sm:inline">{t('common.download')}</span>
                </Button>
              </Tooltip>
            </div>
            <div className="text-xs text-gray-500 flex items-center sm:flex">
              <InfoCircleOutlined className="mr-1" />
              {t('gpt.enterToSend')}
            </div>
          </div>

          <div className="flex gap-2 md:gap-3">
            <div className="flex-1">
              <TextArea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('gpt.placeholder')}
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={isStreaming}
                className="bg-white text-sm md:text-base"
              />
            </div>
            <Button
              type="primary"
              size="large"
              loading={isStreaming}
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isStreaming}
              icon={<SendOutlined />}
              className="h-10 md:h-12 px-3 md:px-6 bg-gradient-to-r from-blue-500 to-indigo-500 border-0 shadow-md hover:shadow-lg"
            >
              <span className="hidden md:inline">{isStreaming ? t('common.generating') : t('gpt.sendBtn')}</span>
            </Button>
          </div>

          <HCaptcha
            ref={hcaptchaRef}
            sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
            onVerify={handleVerify}
            onError={handleError}
            onExpire={() => {
              console.log('验证码过期')
              message.warning('验证已过期，请重新验证')
            }}
            size="invisible"
          />
        </div>
      </div>
    </div>
  )
}

export default GPT
