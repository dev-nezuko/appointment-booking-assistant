/**
 * One shared socket.io connection for the chat page. socket.io speaks http(s)
 * URLs and upgrades them itself, so a ws:// value works here as well.
 */

import { io, Socket } from 'socket.io-client'

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

let socket: Socket | null = null

export function connectWebSocket(token: string): Socket {
  if (!token) {
    throw new Error('Valid authentication token is required')
  }
  if (socket) {
    return socket
  }
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
  })
  return socket
}

export function disconnectWebSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket | null {
  return socket
}
