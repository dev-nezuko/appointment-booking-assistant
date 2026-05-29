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
  const isDisabled = isLoading || disabled

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isDisabled) {
      onSend(input.trim())
      setInput('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-shrink-0 gap-2 border-t border-line pt-3">
      <label htmlFor="chat-message" className="sr-only">
        Your message
      </label>
      <input
        id="chat-message"
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. a consultation next Wednesday at 11am"
        disabled={isDisabled}
        maxLength={1000}
        autoComplete="off"
        className="min-h-touch min-w-0 flex-1 rounded-md border border-line bg-white px-4 text-ink placeholder:text-muted focus:border-spruce focus:outline-none focus:ring-2 focus:ring-spruce disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-label="Send message"
        className="flex min-h-touch min-w-[88px] items-center justify-center rounded-md bg-spruce px-5 font-bold text-white hover:bg-spruce-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <LoadingSpinner size="sm" label="Waiting for reply" /> : 'Send'}
      </button>
    </form>
  )
}
