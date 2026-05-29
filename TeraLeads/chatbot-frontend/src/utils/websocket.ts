/**
 * WebSocket Client Utilities
 * 
 * Manages WebSocket connections for real-time chat functionality.
 * Provides connection management with authentication and error handling.
 */

import { io, Socket } from 'socket.io-client'

/**
 * WebSocket server URL (Socket.io uses http/https, not ws)
 * Falls back to API URL or localhost if not set in environment variables
 */
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:3001'

/**
 * Global socket instance (singleton pattern)
 * Only one WebSocket connection should exist at a time
 */
let socket: Socket | null = null

/**
 * Connection status type
 */
export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error'

/**
 * Establishes a WebSocket connection with authentication
 * 
 * If a connection already exists and is connected, returns the existing socket.
 * Otherwise, creates a new connection with the provided authentication token.
 * 
 * @param token - JWT authentication token for WebSocket authentication
 * @returns Socket instance
 * @throws {Error} If token is invalid or connection fails
 * 
 * @example
 * ```typescript
 * try {
 *   const socket = connectWebSocket(token)
 *   socket.on('message', (data) => {
 *     console.log('Received:', data)
 *   })
 * } catch (error) {
 *   console.error('WebSocket connection failed:', error)
 * }
 * ```
 */
export function connectWebSocket(token: string): Socket {
  // Validate token
  if (!token || typeof token !== 'string') {
    throw new Error('Valid authentication token is required')
  }

  // Return existing connection if already connected
  if (socket?.connected) {
    return socket
  }

  // Create new connection
  socket = io(WS_URL, {
    auth: {
      token,
    },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
  })

  // Connection event handlers
  socket.on('connect', () => {
    // WebSocket connected
  })

  socket.on('disconnect', (_reason) => {
    // WebSocket disconnected
  })

  socket.on('connect_error', (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('WebSocket connection error:', error.message)
    }
  })

  socket.on('error', (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('WebSocket error:', error)
    }
  })

  return socket
}

/**
 * Disconnects the WebSocket connection and cleans up resources
 * 
 * Safe to call even if no connection exists. Clears the global socket instance.
 * 
 * @example
 * ```typescript
 * disconnectWebSocket() // Clean disconnect
 * ```
 */
export function disconnectWebSocket(): void {
  if (socket) {
    socket.disconnect()
    socket.removeAllListeners()
    socket = null
  }
}

/**
 * Gets the current WebSocket socket instance
 * 
 * @returns Socket instance if connected, null otherwise
 * 
 * @example
 * ```typescript
 * const socket = getSocket()
 * if (socket?.connected) {
 *   socket.emit('message', 'Hello')
 * }
 * ```
 */
export function getSocket(): Socket | null {
  return socket
}

/**
 * Gets the current connection status
 * 
 * @returns ConnectionStatus indicating the current state
 * 
 * @example
 * ```typescript
 * const status = getConnectionStatus()
 * if (status === 'connected') {
 *   // Send message
 * }
 * ```
 */
export function getConnectionStatus(): ConnectionStatus {
  if (!socket) {
    return 'disconnected'
  }
  if (socket.connected) {
    return 'connected'
  }
  if ((socket as Socket & { connecting?: boolean }).connecting) {
    return 'connecting'
  }
  return 'error'
}

