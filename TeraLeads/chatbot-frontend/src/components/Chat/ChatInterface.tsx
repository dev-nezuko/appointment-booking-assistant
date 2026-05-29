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
  setBooking,
  type Booking,
  type Message,
} from '@/state/slices/chatSlice'
import { connectWebSocket, disconnectWebSocket, getSocket } from '@/utils/websocket'
import { sendMessage as sendMessageApi, ChatbotError } from '@/api/chatbot'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { AppointmentConfirmation } from './AppointmentConfirmation'
import { ErrorMessage } from '@/components/UI/ErrorMessage'

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

interface BotMessagePayload {
  text?: string
  booking?: Booking | null
}

export function ChatInterface() {
  const dispatch = useAppDispatch()
  const messages = useAppSelector((state) => state.chat.messages)
  const sessionId = useAppSelector((state) => state.chat.sessionId)
  const isLoading = useAppSelector((state) => state.chat.isLoading)
  const connectionStatus = useAppSelector((state) => state.chat.connectionStatus)
  const error = useAppSelector((state) => state.chat.error)
  const booking = useAppSelector((state) => state.chat.booking)
  const token = useAppSelector((state) => state.auth.token)

  const receiveBotMessage = useCallback(
    (text: string, nextBooking: Booking | null | undefined) => {
      dispatch(
        addMessage({
          id: `${Date.now()}-bot`,
          text,
          sender: 'bot',
          timestamp: new Date().toISOString(),
        })
      )
      dispatch(setBooking(nextBooking ?? null))
      dispatch(setLoading(false))
    },
    [dispatch]
  )

  useEffect(() => {
    if (!token) return

    if (!sessionId) {
      dispatch(setSessionId(generateSessionId()))
    }

    dispatch(setConnectionStatus('connecting'))
    connectWebSocket(token)
    const socket = getSocket()
    if (!socket) return

    const handleConnect = () => dispatch(setConnectionStatus('connected'))
    // A dropped socket mid-turn would otherwise leave the input disabled.
    const handleDisconnect = () => {
      dispatch(setConnectionStatus('disconnected'))
      dispatch(setLoading(false))
    }
    const handleConnectError = () => dispatch(setConnectionStatus('error'))
    const handleBotMessage = (data: BotMessagePayload) => {
      if (data.text) receiveBotMessage(data.text, data.booking)
    }
    const handleChatError = (data: { message?: string }) => {
      dispatch(setError(data.message || 'The assistant could not answer. Please try again.'))
      dispatch(setLoading(false))
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('bot:message', handleBotMessage)
    socket.on('chat:error', handleChatError)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('bot:message', handleBotMessage)
      socket.off('chat:error', handleChatError)
      disconnectWebSocket()
    }
    // sessionId is created by this effect; re-running on it would reconnect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, dispatch, receiveBotMessage])

  const handleSendMessage = useCallback(
    async (text: string) => {
      const currentSessionId = sessionId || generateSessionId()
      if (!sessionId) {
        dispatch(setSessionId(currentSessionId))
      }

      const userMessage: Message = {
        id: `${Date.now()}-user`,
        text,
        sender: 'user',
        timestamp: new Date().toISOString(),
      }
      dispatch(addMessage(userMessage))
      dispatch(setLoading(true))
      dispatch(setError(null))

      const socket = getSocket()
      if (socket?.connected) {
        // The reply arrives as `bot:message`; loading stays on until then.
        socket.emit('chat:message', { sessionId: currentSessionId, message: text })
        return
      }

      try {
        const response = await sendMessageApi(currentSessionId, text)
        receiveBotMessage(response.message, response.booking)
      } catch (err) {
        dispatch(
          setError(
            err instanceof ChatbotError ? err.message : 'Failed to send message. Please try again.'
          )
        )
        dispatch(setLoading(false))
      }
    },
    [sessionId, dispatch, receiveBotMessage]
  )

  const statusLabel =
    connectionStatus === 'connected'
      ? 'Live'
      : connectionStatus === 'connecting'
        ? 'Connecting…'
        : 'Sending over HTTP'

  const showCard =
    booking?.appointment && (booking.status === 'ready_to_book' || booking.status === 'booked')

  return (
    <div className="flex flex-col flex-1 min-h-[400px] border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs px-2 py-1 rounded ${
            connectionStatus === 'connected'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}
          role="status"
          aria-live="polite"
        >
          {statusLabel}
        </span>
      </div>
      {error && (
        <ErrorMessage message={error} className="mb-4" onDismiss={() => dispatch(setError(null))} />
      )}
      <MessageList messages={messages} />
      {showCard && booking?.appointment && (
        <AppointmentConfirmation
          appointment={booking.appointment}
          booked={booking.status === 'booked'}
          onConfirm={
            booking.status === 'ready_to_book' && !isLoading
              ? () => handleSendMessage('yes')
              : undefined
          }
        />
      )}
      <MessageInput onSend={handleSendMessage} isLoading={isLoading} disabled={!token} />
    </div>
  )
}
