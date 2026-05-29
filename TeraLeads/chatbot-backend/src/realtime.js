/**
 * Socket.IO server for live chat.
 *
 * The frontend shipped a complete socket.io client — auth handshake,
 * reconnection, `message` / `chat:message` / `bot:message` events — and the
 * backend had no socket.io server and no socket.io dependency. Every client
 * connection 404'd on the handshake, so the UI sat permanently on
 * "Reconnecting..." and silently fell back to HTTP for each message.
 *
 * This completes the half of the feature that was missing. The HTTP path is
 * kept as the fallback it was always written to be.
 */

const { Server } = require('socket.io')
const jwt = require('./utils/jwt')
const chatbotService = require('./services/chatbot.service')
const logger = require('./utils/logger')

const attachRealtime = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    // The client connects with transports: ['websocket'], so long-polling is
    // never used; allowing it anyway keeps restrictive proxies working.
    transports: ['websocket', 'polling'],
  })

  // Authenticate on the handshake rather than per-event: an unauthenticated
  // socket should never be connected in the first place.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication token required'))
    try {
      const payload = jwt.verifyToken(token)
      socket.userId = payload.id ?? payload.userId
      if (!socket.userId) return next(new Error('Token carries no user id'))
      return next()
    } catch (err) {
      return next(new Error('Invalid authentication token'))
    }
  })

  io.on('connection', (socket) => {
    logger.info?.({ action: 'ws_connected', userId: socket.userId })

    const handleMessage = async (payload = {}) => {
      const { sessionId, message } = payload
      if (!message || typeof message !== 'string') {
        socket.emit('error', { message: 'A non-empty message is required' })
        return
      }

      try {
        const result = await chatbotService.sendMessage(
          socket.userId,
          sessionId,
          message
        )
        socket.emit('bot:message', {
          id: `${Date.now()}`,
          text: result.message,
          sender: 'bot',
          timestamp: new Date().toISOString(),
          sessionId: result.sessionId,
          appointmentData: result.appointmentData,
        })
      } catch (err) {
        logger.error?.({ action: 'ws_message_failed', error: err.message })
        socket.emit('error', {
          message: 'The assistant is unavailable right now. Please try again.',
        })
      }
    }

    // The client emits both names for the same intent; register both, and
    // guard against handling one turn twice.
    const seen = new Set()
    const once = (event) => async (payload) => {
      const key = `${payload?.sessionId}:${payload?.message}`
      if (seen.has(key)) return
      seen.add(key)
      setTimeout(() => seen.delete(key), 5000)
      await handleMessage(payload)
    }

    socket.on('message', once('message'))
    socket.on('chat:message', once('chat:message'))

    socket.on('disconnect', () => {
      logger.info?.({ action: 'ws_disconnected', userId: socket.userId })
    })
  })

  return io
}

module.exports = { attachRealtime }
