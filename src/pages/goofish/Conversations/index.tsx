import React, { useEffect, useState, useRef } from 'react'
import { 
  Layout, 
  List, 
  Input, 
  Button, 
  Avatar, 
  Badge, 
  Space, 
  Typography, 
  message,
  Spin,
  Empty
} from 'antd'
import { 
  SendOutlined, 
  UserOutlined,
  MessageOutlined
} from '@ant-design/icons'
import { useGoofishWebSocket } from '@/hooks/goofish'
import { conversationApi, messageApi } from '@/services/goofish'
import type { Conversation } from '@/types/goofish'

const { TextArea } = Input
const { Sider, Content } = Layout
const { Text } = Typography

interface MessageItem {
  id?: number
  senderId?: string
  senderName?: string
  content?: string
  direction?: 'in' | 'out'
  msgTime?: string
  timestamp?: number
}

export const Conversations: React.FC = () => {
  const { connected, ws } = useGoofishWebSocket({
    onMessage: (data) => {
      console.log('[Conversations] 收到 WebSocket 消息:', data)
      // 处理 WebSocket 对话更新消息
      if (data.event === 'conversations' && data.data) {
        handleConversationsUpdate(data.data)
      }
    }
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [inputText, setInputText] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const subscribedRef = useRef(false)

  useEffect(() => {
    loadConversations()
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 订阅 WebSocket 对话更新
  useEffect(() => {
    if (ws?.readyState === WebSocket.OPEN && !subscribedRef.current) {
      console.log('[Conversations] 订阅对话更新')
      ws.send(JSON.stringify({
        action: 'subscribe',
        events: ['conversations'],
        params: { limit: 50 }
      }))
      subscribedRef.current = true
    }

    return () => {
      if (ws?.readyState === WebSocket.OPEN && subscribedRef.current) {
        console.log('[Conversations] 取消订阅对话更新')
        ws.send(JSON.stringify({
          action: 'unsubscribe',
          events: ['conversations']
        }))
        subscribedRef.current = false
      }
    }
  }, [ws])

  // 处理 WebSocket 对话更新
  const handleConversationsUpdate = (data: { conversations?: Conversation[]; total?: number }) => {
    const { conversations: newConversations } = data

    console.log('[Conversations] 处理对话更新:', newConversations?.length, '个对话')

    if (!newConversations || newConversations.length === 0) {
      console.log('[Conversations] 没有新对话，跳过更新')
      return
    }

    // 更新对话列表
    setConversations(prevConversations => {
      const updatedMap = new Map()

      // 先添加新对话数据
      for (const conv of newConversations) {
        updatedMap.set(conv.chatId, conv)
      }

      // 保留旧数据中不在新数据里的对话
      for (const conv of prevConversations) {
        if (!updatedMap.has(conv.chatId)) {
          updatedMap.set(conv.chatId, conv)
        }
      }

      // 转换为数组并排序（最新的在前面）
      return Array.from(updatedMap.values()).sort((a, b) => {
        const timeA = Number(a.lastTime || 0)
        const timeB = Number(b.lastTime || 0)
        return timeB - timeA
      })
    })

    // 如果当前正在查看某个对话，检查是否有新消息
    if (selectedConversation) {
      const updatedConv = newConversations.find(c => c.chatId === selectedConversation.chatId)
      if (updatedConv && updatedConv.unread > 0) {
        // 对话有新消息，重新加载消息
        conversationApi.getConversation(selectedConversation.chatId).then(response => {
          const newMessages = response.data?.messages || []
          setMessages(newMessages)
        }).catch(error => {
          console.error('加载消息失败:', error)
        })

        // 更新当前对话的信息（未读数、最后消息等）
        setSelectedConversation(updatedConv)
      }
    }
  }

  const formatTime = (time?: string | number): string => {
    if (!time) return ''

    let date: Date

    // 处理数字时间戳（毫秒）
    if (typeof time === 'number') {
      date = new Date(time)
    } else {
      // 处理字符串时间 - 尝试多种格式
      // 尝试标准格式
      date = new Date(time)

      // 如果解析失败，尝试 "2026/2/27 20:49:11" 格式
      if (isNaN(date.getTime())) {
        const parts = time.split(' ')
        if (parts.length === 2) {
          const datePart = parts[0].replace(/\//g, '-')
          const timePart = parts[1]
          date = new Date(`${datePart} ${timePart}`)
        }
      }

      // 如果还是失败，尝试 Unix 时间戳字符串
      if (isNaN(date.getTime())) {
        const timestamp = parseInt(time)
        if (!isNaN(timestamp)) {
          date = new Date(timestamp)
        }
      }
    }

    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', time)
      return String(time)
    }

    const now = new Date()
    const diff = now.getTime() - date.getTime()

    // 如果是未来的时间，直接返回格式化的日期时间
    if (diff < 0) {
      return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`

    // 超过7天显示具体日期
    return date.toLocaleDateString('zh-CN')
  }

  const loadConversations = async () => {
    setLoading(true)
    try {
      const response = await conversationApi.getConversations({ limit: 50, offset: 0 })
      setConversations(response.data?.conversations || [])
    } catch (error) {
      message.error('加载对话列表失败')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setMessagesLoading(true)

    // 标记对话为已读
    try {
      await conversationApi.markAsRead(conversation.chatId, conversation.accountId)
      // 更新对话列表中的未读数
      setConversations(prev =>
        prev.map(c =>
          c.chatId === conversation.chatId ? { ...c, unread: 0 } : c
        )
      )
    } catch (error) {
      console.error('标记已读失败:', error)
    }

    try {
      const response = await conversationApi.getConversation(conversation.chatId)
      setMessages(response.data?.messages || [])
      if (isMobile) {
        setShowChat(true)
      }
    } catch (error) {
      message.error('加载消息失败')
    } finally {
      setMessagesLoading(false)
    }
  }

  const backToList = () => {
    setShowChat(false)
    setSelectedConversation(null)
  }

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedConversation) {
      message.warning('请输入消息内容')
      return
    }

    setSending(true)
    try {
      await messageApi.sendMessage({
        accountId: selectedConversation.accountId,
        chatId: selectedConversation.chatId,
        toUserId: selectedConversation.userId,
        text: inputText.trim()
      })
      
      // 添加消息到列表
      setMessages(prev => [...prev, {
        content: inputText.trim(),
        direction: 'out' as const,
        msgTime: new Date().toLocaleString('zh-CN'),
        timestamp: Date.now()
      }])
      
      setInputText('')
      message.success('发送成功')
    } catch (error) {
      message.error('发送失败')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 180px)' }}>
      <Layout style={{ height: '100%', background: '#fff', borderRadius: 8 }}>
        {/* 移动端：显示列表或聊天界面 */}
        {isMobile ? (
          showChat && selectedConversation ? (
            // 移动端聊天界面
            <Layout style={{ display: 'flex', flexDirection: 'column' }}>
              {/* 头部 */}
              <div style={{
                padding: isMobile ? '8px 12px' : '12px 16px',
                borderBottom: '1px solid #e8e8e8',
                background: '#fafafa',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Button
                  type="text"
                  size="small"
                  onClick={backToList}
                  style={{ flexShrink: 0 }}
                >
                  ← 返回
                </Button>
                <Avatar
                  size={32}
                  src={selectedConversation.userAvatar}
                  icon={!selectedConversation.userAvatar && <UserOutlined />}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: isMobile ? 14 : undefined }}>{selectedConversation.userName}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    {selectedConversation.userId}
                  </Text>
                </div>
              </div>

              {/* 消息列表 */}
              <Content style={{
                padding: isMobile ? '8px' : '16px',
                overflowY: 'auto',
                background: '#f5f5f5',
                flex: 1
              }}>
                <Spin spinning={messagesLoading}>
                  {messages.length === 0 ? (
                    <Empty
                      description="暂无消息"
                      style={{ marginTop: 100 }}
                    />
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                            gap: 8
                          }}
                        >
                          {msg.direction === 'in' && (
                            <Avatar
                              size={32}
                              src={selectedConversation.userAvatar}
                              icon={<UserOutlined />}
                              style={{ flexShrink: 0 }}
                            />
                          )}
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                            maxWidth: isMobile ? 250 : 400
                          }}>
                            <div style={{
                              padding: '10px 14px',
                              borderRadius: 12,
                              background: msg.direction === 'out' ? '#1890ff' : '#fff',
                              color: msg.direction === 'out' ? '#fff' : '#000',
                              wordBreak: 'break-word',
                              fontSize: isMobile ? 13 : 14,
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}>
                              {msg.content}
                            </div>
                            <Text
                              type="secondary"
                              style={{ fontSize: '11px', marginTop: 4, display: 'block' }}
                            >
                              {formatTime(msg.msgTime || msg.timestamp)}
                            </Text>
                          </div>
                          {msg.direction === 'out' && (
                            <Avatar
                              size={32}
                              icon={<UserOutlined />}
                              style={{ flexShrink: 0, backgroundColor: '#1890ff' }}
                            />
                          )}
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </Space>
                  )}
                </Spin>
              </Content>

              {/* 输入框 */}
              <div style={{
                padding: isMobile ? '8px 12px' : '12px 16px',
                borderTop: '1px solid #e8e8e8',
                background: '#fff'
              }}>
                <Space.Compact style={{ width: '100%' }}>
                  <TextArea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入消息..."
                    autoSize={{ minRows: 1, maxRows: 4 }}
                    onPressEnter={(e) => {
                      if (!e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    loading={sending}
                    onClick={sendMessage}
                  >
                    发送
                  </Button>
                </Space.Compact>
              </div>
            </Layout>
          ) : (
            // 移动端对话列表
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: isMobile ? '12px' : '16px', borderBottom: '1px solid #e8e8e8' }}>
                <Space>
                  <MessageOutlined />
                  <Text strong>对话列表</Text>
                  {connected ? (
                    <Badge status="success" text="已连接" />
                  ) : (
                    <Badge status="error" text="未连接" />
                  )}
                </Space>
              </div>

              <Spin spinning={loading} style={{ flex: 1, overflow: 'auto' }}>
                <List
                  dataSource={conversations}
                  renderItem={(item) => (
                    <List.Item
                      key={item.chatId}
                      style={{
                        padding: isMobile ? '10px 12px' : '12px 16px',
                        cursor: 'pointer',
                        background: selectedConversation?.chatId === item.chatId ? '#e6f7ff' : 'transparent'
                      }}
                      onClick={() => selectConversation(item)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={isMobile ? 36 : 40}
                            src={item.userAvatar}
                            icon={!item.userAvatar && <UserOutlined />}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong style={{ fontSize: isMobile ? 14 : undefined }}>{item.userName}</Text>
                            {item.unread > 0 && (
                              <Badge count={item.unread} size="small" />
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <Text
                              ellipsis={{ tooltip: item.lastMessage }}
                              style={{ fontSize: '12px' }}
                            >
                              {item.lastMessage || '暂无消息'}
                            </Text>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                              {formatTime(item.lastTime ? String(item.lastTime) : undefined)}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Spin>
            </div>
          )
        ) : (
          // 桌面端：左右分栏布局
          <>
            <Sider width={300} style={{ background: '#f5f5f5', borderRight: '1px solid #e8e8e8' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
                <Space>
                  <MessageOutlined />
                  <Text strong>对话列表</Text>
                  {connected ? (
                    <Badge status="success" text="已连接" />
                  ) : (
                    <Badge status="error" text="未连接" />
                  )}
                </Space>
              </div>

              <Spin spinning={loading}>
                <List
                  dataSource={conversations}
                  renderItem={(item) => (
                    <List.Item
                      key={item.chatId}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        background: selectedConversation?.chatId === item.chatId ? '#e6f7ff' : 'transparent'
                      }}
                      onClick={() => selectConversation(item)}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            size={40}
                            src={item.userAvatar}
                            icon={!item.userAvatar && <UserOutlined />}
                          />
                        }
                        title={
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{item.userName}</Text>
                            {item.unread > 0 && (
                              <Badge count={item.unread} size="small" />
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <Text
                              ellipsis={{ tooltip: item.lastMessage }}
                              style={{ fontSize: '12px' }}
                            >
                              {item.lastMessage || '暂无消息'}
                            </Text>
                            <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                              {formatTime(item.lastTime ? String(item.lastTime) : undefined)}
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Spin>
            </Sider>

            {/* 右侧消息区域 */}
            <Layout>
              {selectedConversation ? (
                <>
                  {/* 头部 */}
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e8e8e8',
                    background: '#fafafa'
                  }}>
                    <Space>
                      <Avatar
                        size={32}
                        src={selectedConversation.userAvatar}
                        icon={!selectedConversation.userAvatar && <UserOutlined />}
                      />
                      <div>
                        <Text strong>{selectedConversation.userName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {selectedConversation.userId}
                        </Text>
                      </div>
                    </Space>
                  </div>

                  {/* 消息列表 */}
                  <Content style={{
                    padding: '16px',
                    overflowY: 'auto',
                    background: '#f5f5f5'
                  }}>
                    <Spin spinning={messagesLoading}>
                      {messages.length === 0 ? (
                        <Empty
                          description="暂无消息"
                          style={{ marginTop: 100 }}
                        />
                      ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                          {messages.map((msg, index) => (
                            <div
                              key={index}
                              style={{
                                display: 'flex',
                                justifyContent: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                                gap: 8
                              }}
                            >
                              {msg.direction === 'in' && (
                                <Avatar
                                  size={32}
                                  src={selectedConversation.userAvatar}
                                  icon={<UserOutlined />}
                                  style={{ flexShrink: 0 }}
                                />
                              )}
                              <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.direction === 'out' ? 'flex-end' : 'flex-start',
                                maxWidth: 400
                              }}>
                                <div style={{
                                  padding: '10px 14px',
                                  borderRadius: 12,
                                  background: msg.direction === 'out' ? '#1890ff' : '#fff',
                                  color: msg.direction === 'out' ? '#fff' : '#000',
                                  wordBreak: 'break-word',
                                  fontSize: 14,
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                  {msg.content}
                                </div>
                                <Text
                                  type="secondary"
                                  style={{ fontSize: '11px', marginTop: 4, display: 'block' }}
                                >
                                  {formatTime(msg.msgTime || msg.timestamp)}
                                </Text>
                              </div>
                              {msg.direction === 'out' && (
                                <Avatar
                                  size={32}
                                  icon={<UserOutlined />}
                                  style={{ flexShrink: 0, backgroundColor: '#1890ff' }}
                                />
                              )}
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </Space>
                      )}
                    </Spin>
                  </Content>

                  {/* 输入框 */}
                  <div style={{
                    padding: '12px 16px',
                    borderTop: '1px solid #e8e8e8',
                    background: '#fff'
                  }}>
                    <Space.Compact style={{ width: '100%' }}>
                      <TextArea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="输入消息..."
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        onPressEnter={(e) => {
                          if (!e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                      />
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={sending}
                        onClick={sendMessage}
                      >
                        发送
                      </Button>
                    </Space.Compact>
                  </div>
                </>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  background: '#f5f5f5'
                }}>
                  <Empty description="选择一个对话开始聊天" />
                </div>
              )}
            </Layout>
          </>
        )}
      </Layout>
    </div>
  )
}
