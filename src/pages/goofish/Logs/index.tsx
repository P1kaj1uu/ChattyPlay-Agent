import React, { useEffect, useState } from 'react'
import {
  Card,
  Select,
  List,
  Tag,
  Space,
  Button,
  Typography,
  Input,
  Grid
} from 'antd'
import {
  ReloadOutlined,
  SearchOutlined,
  FileTextOutlined,
  BugOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { logApi } from '@/services/goofish'
import type { LogEntry } from '@/types/goofish'

const { Option } = Select
const { Text } = Typography
const { Search } = Input
const { useBreakpoint } = Grid

const LEVEL_CONFIG: Record<string, { color: string; icon: any }> = {
  DEBUG: { color: 'default', icon: <BugOutlined /> },
  debug: { color: 'default', icon: <BugOutlined /> },
  INFO: { color: 'blue', icon: <InfoCircleOutlined /> },
  info: { color: 'blue', icon: <InfoCircleOutlined /> },
  WARN: { color: 'orange', icon: <ExclamationCircleOutlined /> },
  warn: { color: 'orange', icon: <ExclamationCircleOutlined /> },
  ERROR: { color: 'red', icon: <ExclamationCircleOutlined /> },
  error: { color: 'red', icon: <ExclamationCircleOutlined /> }
}

const Logs: React.FC = () => {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [levelFilter, setLevelFilter] = useState<string>('ALL')
  const [searchText, setSearchText] = useState('')
  // @ts-ignore
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    loadLogs()
    if (autoRefresh) {
      const interval = setInterval(loadLogs, 5000)
      return () => clearInterval(interval)
    }
  }, [levelFilter, autoRefresh])

  const loadLogs = async () => {
    setLoading(true)
    try {
      const response = await logApi.getLogs({
        level: levelFilter === 'ALL' ? undefined : levelFilter,
        limit: 100
      })

      // 解析日志行
      const lines = response.data?.lines || []
      const parsedLogs: LogEntry[] = lines.map((line: string, index: number) => {
        // 日志格式: 2026-02-27 10:30:45 | INFO | Context | Message
        const parts = line.split(' | ')
        let timestamp: string | undefined
        let level: LogEntry['level'] = 'INFO'
        let context: string | undefined
        let message = line

        if (parts.length >= 3) {
          const [timeStr, levelStr, ...rest] = parts
          timestamp = timeStr
          level = levelStr as LogEntry['level']

          // 最后一部分是消息，中间的是上下文
          const contextAndMessage = rest.join(' | ')
          const messageParts = contextAndMessage.split('] ')

          if (messageParts.length > 1) {
            context = messageParts[0].replace('[', '').replace(']', '')
            message = messageParts.slice(1).join('] ')
          } else {
            message = contextAndMessage
          }
        }

        return {
          id: index,
          timestamp,
          level,
          context,
          message
        }
      })

      setLogs(parsedLogs)
    } catch (error) {
      console.error('加载日志失败', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchText) return true
    return log.message?.toLowerCase().includes(searchText.toLowerCase()) ||
           log.context?.toLowerCase().includes(searchText.toLowerCase())
  })

  const getLevelIcon = (level: string) => {
    return LEVEL_CONFIG[level]?.icon || <FileTextOutlined />
  }

  const getLevelColor = (level: string) => {
    return LEVEL_CONFIG[level]?.color || 'default'
  }

  const formatTime = (time?: string): string => {
    if (!time) return '-'
    return new Date(time).toLocaleTimeString('zh-CN')
  }

  return (
    <div>
      <Card
        title="系统日志"
        styles={{
          body: { padding: isMobile ? '12px' : '24px' },
          header: { padding: isMobile ? '12px 16px' : undefined }
        }}
        extra={
          !isMobile && (
            <Space>
              <Select
                value={levelFilter}
                onChange={setLevelFilter}
                style={{ width: 120 }}
              >
                <Option value="ALL">全部级别</Option>
                <Option value="ERROR">错误</Option>
                <Option value="WARN">警告</Option>
                <Option value="INFO">信息</Option>
                <Option value="DEBUG">调试</Option>
              </Select>
              <Search
                placeholder="搜索日志"
                allowClear
                style={{ width: 200 }}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={loadLogs}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          )
        }
      >
        {/* 移动端筛选区域 */}
        {isMobile && (
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }} size="small">
            <Space wrap>
              <Select
                value={levelFilter}
                onChange={setLevelFilter}
                style={{ width: 100 }}
                size="small"
              >
                <Option value="ALL">全部级别</Option>
                <Option value="ERROR">错误</Option>
                <Option value="WARN">警告</Option>
                <Option value="INFO">信息</Option>
                <Option value="DEBUG">调试</Option>
              </Select>
              <Search
                placeholder="搜索日志"
                allowClear
                style={{ width: 140 }}
                size="small"
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={loadLogs}
                loading={loading}
                size="small"
              >
                刷新
              </Button>
            </Space>
          </Space>
        )}
        <List
          dataSource={filteredLogs}
          renderItem={(log) => (
            <List.Item
              key={log.id}
              style={{
                padding: isMobile ? '6px 0' : '8px 0',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size="small">
                <Space wrap={isMobile}>
                  <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '12px', fontFamily: 'monospace' }}>
                    {formatTime(log.timestamp)}
                  </Text>
                  <Tag
                    icon={getLevelIcon(log.level)}
                    color={getLevelColor(log.level)}
                    style={{ fontSize: isMobile ? '10px' : undefined }}
                  >
                    {log.level}
                  </Tag>
                  {log.context && (
                    <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '12px' }}>
                      [{log.context}]
                    </Text>
                  )}
                </Space>
                <Text
                  style={{
                    fontFamily: 'monospace',
                    fontSize: isMobile ? '12px' : '13px',
                    wordBreak: 'break-all'
                  }}
                >
                  {log.message}
                </Text>
              </Space>
            </List.Item>
          )}
          loading={loading}
        />
      </Card>
    </div>
  )
}

export default Logs
