'use client'

import { useState } from 'react'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'

interface MessageInputProps {
  onSend: (text: string) => void
  isLoading?: boolean
  disabled?: boolean
}

export function MessageInput({ onSend, isLoading = false, disabled = false }: MessageInputProps) {
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading && !disabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  const isDisabled = isLoading || disabled

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 flex-shrink-0">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message..."
        disabled={isDisabled}
        aria-label="Message input"
        aria-disabled={isDisabled}
        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-0"
      />
      <button
        type="submit"
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-label="Send message"
        className="px-6 py-3 min-h-[44px] bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] touch-manipulation"
      >
        {isLoading ? <LoadingSpinner size="sm" /> : 'Send'}
      </button>
    </form>
  )
}

