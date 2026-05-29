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
import { BookingPanel } from './BookingPanel'
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

  return (
    <div className="grid flex-1 gap-4 lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section
        aria-label="Conversation"
        className="flex min-h-[480px] flex-col rounded-xl border border-line bg-card p-4 shadow-sm lg:min-h-0"
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-xl">Chat with Front Desk</h2>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
              connectionStatus === 'connected'
                ? 'bg-spruce-soft text-spruce'
                : 'bg-paper text-muted'
            }`}
            role="status"
            aria-live="polite"
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-spruce' : 'bg-muted'
              }`}
            />
            {statusLabel}
          </span>
        </div>
        {error && (
          <ErrorMessage
            message={error}
            className="mb-3"
            onDismiss={() => dispatch(setError(null))}
          />
        )}
        <MessageList
          messages={messages}
          isWaiting={isLoading}
          onSuggestion={token ? handleSendMessage : undefined}
        />
        <MessageInput onSend={handleSendMessage} isLoading={isLoading} disabled={!token} />
      </section>
      <aside
        aria-labelledby="booking-heading"
        className="order-first rounded-xl border border-line bg-card p-4 shadow-sm lg:order-none lg:self-start"
      >
        <h2 id="booking-heading" className="mb-3 font-display text-xl">
          Your booking
        </h2>
        <BookingPanel booking={booking} busy={isLoading} onSend={handleSendMessage} />
      </aside>
    </div>
  )
}
