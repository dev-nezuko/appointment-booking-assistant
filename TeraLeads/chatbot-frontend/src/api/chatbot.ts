import { AxiosError } from 'axios'
import { apiClient } from './client'
import { errorMessage } from './errors'
import type { Booking } from '@/state/slices/chatSlice'

export interface ChatResponse {
  message: string
  sessionId: string
  booking: Booking | null
}

export class ChatbotError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ChatbotError'
  }
}

/** HTTP fallback for a chat turn, used when the socket is not connected. */
export async function sendMessage(sessionId: string, message: string): Promise<ChatResponse> {
  if (!sessionId || !message.trim()) {
    throw new ChatbotError('Session ID and message are required')
  }
  try {
    const response = await apiClient.post<ChatResponse>('/api/chatbot/message', {
      sessionId,
      message: message.trim(),
    })
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new ChatbotError(
        errorMessage(error, 'Failed to send message. Please try again.'),
        error.response?.status
      )
    }
    throw error
  }
}
