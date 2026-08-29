import { useEffect, useState, useRef } from 'react'
import { statusApi } from '@/services/goofish'
import { GOOFISH_USES_REMOTE_BACKEND, GOOFISH_WS_URL } from '@/services/goofish/config'
import { getToken } from '@/utils/token'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  reconnectInterval?: number
}

export function useGoofishWebSocket(options: UseWebSocketOptions = {}) {
  const [connected, setConnected] = useState(false)
  const [status, setStatus] = useState<any>(null)
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(false)
  const { onMessage, onError, reconnectInterval = 5000 } = options

  // 连接 WebSocket
  const connect = () => {
    if (!mountedRef.current || wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return
    }

    const token = getToken()
    if (GOOFISH_USES_REMOTE_BACKEND && !token) {
      console.warn('Goofish WebSocket requires a site account login')
      return
    }

    const protocols = token ? [`chattyplay.jwt.${token}`] : undefined
    const ws = protocols
      ? new WebSocket(GOOFISH_WS_URL, protocols)
      : new WebSocket(GOOFISH_WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('Goofish WebSocket connected')
      setConnected(true)
      setWsInstance(ws)
    }

    ws.onclose = () => {
      console.log('Goofish WebSocket disconnected')
      setConnected(false)
      setWsInstance(null)

      // 自动重连
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
      }
      if (!mountedRef.current) return
      reconnectTimerRef.current = setTimeout(() => {
        console.log('Reconnecting to Goofish WebSocket...')
        connect()
      }, reconnectInterval)
    }

    ws.onerror = (error) => {
      console.error('Goofish WebSocket error:', error)
      onError?.(error)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage?.(data)
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }
  }

  // 断开连接
  const disconnect = () => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setConnected(false)
  }

  // 获取状态
  const fetchStatus = async () => {
    try {
      const response = await statusApi.getStatus()
      setStatus(response.data)
    } catch (error) {
      console.error('Failed to fetch status:', error)
    }
  }

  useEffect(() => {
    mountedRef.current = true
    connect()
    fetchStatus()

    return () => {
      mountedRef.current = false
      disconnect()
    }
  }, [])

  return {
    connected,
    status,
    refetchStatus: fetchStatus,
    ws: wsInstance
  }
}
