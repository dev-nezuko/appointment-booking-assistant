/**
 * Chatbot API Functions
 * 
 * Handles communication with the chatbot service for sending messages
 * and managing chat sessions.
 */

import { apiClient } from './client'
import { AxiosError } from 'axios'

/**
 * Structure representing a chat message
 */
export interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'bot'
  timestamp: string
}

/**
 * Response structure from chatbot message endpoint
 */
export interface ChatResponse {
  message: string
  sessionId: string
}

/**
 * Response structure for chatbot token generation
 */
export interface ChatbotTokenResponse {
  token: string
}

/**
 * Custom error class for chatbot API failures
 */
export class ChatbotError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'ChatbotError'
  }
}

/**
 * Sends a message to the chatbot and receives a response
 * 
 * @param sessionId - Unique identifier for the chat session
 * @param message - User's message text
 * @returns Promise resolving to ChatResponse with bot's response and session ID
 * @throws {ChatbotError} If message sending fails
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await sendMessage('session-123', 'I need to book an appointment')
 *   console.log('Bot response:', response.message)
 * } catch (error) {
 *   console.error('Failed to send message:', error.message)
 * }
 * ```
 */
export async function sendMessage(
  sessionId: string,
  message: string
): Promise<ChatResponse> {
  try {
    // Validate inputs
    if (!sessionId || !message) {
      throw new ChatbotError('Session ID and message are required')
    }

    if (message.trim().length === 0) {
      throw new ChatbotError('Message cannot be empty')
    }

    const response = await apiClient.post<ChatResponse>('/api/chatbot/message', {
      sessionId,
      message: message.trim(),
    })

    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status
      const message =
        error.response?.data?.error || 'Failed to send message. Please try again.'
      throw new ChatbotError(message, statusCode)
    }
    throw error
  }
}

/**
 * Generates a short-lived token for chatbot access
 * 
 * This token is required for authenticated chatbot interactions.
 * Tokens typically expire after 15 minutes for security.
 * 
 * @returns Promise resolving to ChatbotTokenResponse with the access token
 * @throws {ChatbotError} If token generation fails
 * 
 * @example
 * ```typescript
 * try {
 *   const { token } = await getChatbotToken()
 *   console.log('Chatbot token obtained')
 * } catch (error) {
 *   console.error('Failed to get chatbot token:', error.message)
 * }
 * ```
 */
export async function getChatbotToken(): Promise<ChatbotTokenResponse> {
  try {
    const response = await apiClient.post<ChatbotTokenResponse>(
      '/api/chatbot/token'
    )

    if (!response.data.token) {
      throw new ChatbotError('Invalid token response from server')
    }

    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status
      const message =
        error.response?.data?.error || 'Failed to generate chatbot token. Please try again.'
      throw new ChatbotError(message, statusCode)
    }
    throw error
  }
}

