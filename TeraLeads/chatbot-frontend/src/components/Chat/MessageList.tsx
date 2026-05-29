'use client'

import { useEffect, useRef } from 'react'
import type { Message } from '@/state/slices/chatSlice'

interface MessageListProps {
  messages: Message[]
  isWaiting?: boolean
  onSuggestion?: (text: string) => void
}

const SUGGESTIONS = [
  "I'd like a consultation tomorrow at 11am",
  'A check-up next Friday',
  'Can I book a cleaning?',
]

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageList({ messages, isWaiting = false, onSuggestion }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' })
  }, [messages.length, isWaiting])

  return (
    <div
      className="min-h-[240px] flex-1 space-y-4 overflow-y-auto px-1 pb-2"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {messages.length === 0 ? (
        <div className="mx-auto max-w-md py-10 text-center">
          <p className="font-display text-xl">No messages yet.</p>
          <p className="mt-2 text-muted">
            Tell Front Desk what you need and when. It will ask for anything that is missing.
          </p>
          {onSuggestion && (
            <ul className="mt-5 flex flex-wrap justify-center gap-2" aria-label="Example requests">
              {SUGGESTIONS.map((text) => (
                <li key={text}>
                  <button
                    type="button"
                    onClick={() => onSuggestion(text)}
                    className="min-h-touch rounded-full border border-line bg-card px-4 text-sm hover:border-spruce hover:text-spruce"
                  >
                    {text}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        messages.map((message) => {
          const mine = message.sender === 'user'
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 sm:max-w-md ${
                  mine
                    ? 'rounded-br-sm bg-spruce text-white'
                    : 'rounded-bl-sm border border-line bg-card text-ink'
                }`}
              >
                <span className="sr-only">{mine ? 'You said:' : 'Front Desk said:'}</span>
                <p>{message.text}</p>
                {message.timestamp && (
                  <time
                    dateTime={message.timestamp}
                    className={`mt-1 block text-xs ${mine ? 'text-white/80' : 'text-muted'}`}
                  >
                    {formatTime(message.timestamp)}
                  </time>
                )}
              </div>
            </div>
          )
        })
      )}
      {isWaiting && (
        <div className="flex justify-start">
          <p className="rounded-2xl rounded-bl-sm border border-dashed border-line px-4 py-2.5 text-muted">
            Checking the calendar…
          </p>
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}
