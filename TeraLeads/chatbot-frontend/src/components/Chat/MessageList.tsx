'use client'

import type { Message } from '@/state/slices/chatSlice'

interface MessageListProps {
  messages: Message[]
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div
      className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[200px]"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No messages yet. Start a conversation!</p>
      ) : (
        messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              <p>{message.text}</p>
              {message.timestamp && (
                <time
                  dateTime={message.timestamp}
                  className={`text-xs mt-1 block ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </time>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

