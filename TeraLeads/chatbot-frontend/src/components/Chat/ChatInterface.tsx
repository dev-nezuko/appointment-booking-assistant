'use client'

import { useEffect, useCallback } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import {
  addMessage,
  setSessionId,
  setLoading,
  setConnectionStatus,
  setError,
  type Message,
} from '@/state/slices/chatSlice'
import { connectWebSocket, disconnectWebSocket, getSocket, getConnectionStatus } from '@/utils/websocket'
import { sendMessage as sendMessageApi } from '@/api/chatbot'
import { ChatbotError } from '@/api/chatbot'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ErrorMessage } from '@/components/UI/ErrorMessage'

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function ChatInterface() {
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.chat.messages)
  const sessionId = useAppSelector((state) => state.chat.sessionId)
  const isLoading = useAppSelector((state) => state.chat.isLoading)
  const connectionStatus = useAppSelector((state) => state.chat.connectionStatus)
  const error = useAppSelector((state) => state.chat.error)
  const token = useAppSelector((state) => state.auth.token)

  const updateConnectionStatus = useCallback(() => {
    dispatch(setConnectionStatus(getConnectionStatus()))
  }, [dispatch])

  useEffect(() => {
    if (!token) return

    if (!sessionId) {
      dispatch(setSessionId(generateSessionId()))
    }

    try {
      dispatch(setConnectionStatus('connecting'))
      connectWebSocket(token)

      const socket = getSocket()
      if (socket) {
        const handleConnect = () => {
          dispatch(setConnectionStatus('connected'))
          dispatch(setError(null))
        }
        const handleDisconnect = () => {
          dispatch(setConnectionStatus('disconnected'))
        }
        const handleConnectError = () => {
          dispatch(setConnectionStatus('error'))
          dispatch(setError('Connection failed. Using REST API as fallback.'))
        }
        const handleMessage = (data: { message?: string; text?: string }) => {
          const text = data.message || data.text || ''
          if (text) {
            dispatch(
              addMessage({
                id: Date.now().toString(),
                text,
                sender: 'bot',
                timestamp: new Date().toISOString(),
              })
            )
          }
        }

        socket.on('connect', handleConnect)
        socket.on('disconnect', handleDisconnect)
        socket.on('connect_error', handleConnectError)
        socket.on('message', handleMessage)
        socket.on('chat:message', handleMessage)
        socket.on('bot:message', handleMessage)

        updateConnectionStatus()

        return () => {
          socket.off('connect', handleConnect)
          socket.off('disconnect', handleDisconnect)
          socket.off('connect_error', handleConnectError)
          socket.off('message', handleMessage)
          socket.off('chat:message', handleMessage)
          socket.off('bot:message', handleMessage)
        }
      }
    } catch (err) {
      dispatch(setConnectionStatus('error'))
      dispatch(setError('WebSocket unavailable. Using REST API.'))
    }

    return () => {
      disconnectWebSocket()
      dispatch(setConnectionStatus('disconnected'))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- sessionId is set by this effect, omit to avoid re-running
  }, [token, dispatch, updateConnectionStatus])

  const handleSendMessage = useCallback(
    async (text: string) => {
      const currentSessionId = sessionId || generateSessionId()
      if (!sessionId) {
        dispatch(setSessionId(currentSessionId))
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        sender: 'user',
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(userMessage))
      dispatch(setLoading(true))
      dispatch(setError(null))

      try {
        const socket = getSocket()
        if (socket?.connected) {
          socket.emit('message', {
            sessionId: currentSessionId,
            message: text,
          })
          socket.emit('chat:message', {
            sessionId: currentSessionId,
            message: text,
          })
          dispatch(setLoading(false))
        } else {
          const response = await sendMessageApi(currentSessionId, text)
          dispatch(
            addMessage({
              id: (Date.now() + 1).toString(),
              text: response.message,
              sender: 'bot',
              timestamp: new Date().toISOString(),
            })
          )
          dispatch(setLoading(false))
        }
      } catch (err) {
        dispatch(
          setError(
            err instanceof ChatbotError ? err.message : 'Failed to send message. Please try again.'
          )
        )
        dispatch(setLoading(false))
      }
    },
    [sessionId, dispatch]
  )

  const statusLabel =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'connecting'
        ? 'Connecting...'
        : connectionStatus === 'error'
          ? 'Reconnecting...'
          : 'Disconnected'

  return (
    <div className="flex flex-col min-h-[400px] md:h-[600px] border rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs px-2 py-1 rounded ${
            connectionStatus === 'connected'
              ? 'bg-green-100 text-green-800'
              : connectionStatus === 'connecting'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
          }`}
          role="status"
          aria-live="polite"
        >
          {statusLabel}
        </span>
      </div>
      {error && (
        <ErrorMessage
          message={error}
          className="mb-4"
          onDismiss={() => dispatch(setError(null))}
        />
      )}
      <MessageList messages={messages} />
      <MessageInput onSend={handleSendMessage} isLoading={isLoading} disabled={!token} />
    </div>
  )
}
