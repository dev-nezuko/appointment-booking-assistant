/**
 * Socket.IO server for live chat. The HTTP endpoint stays as the fallback the
 * client uses when the socket cannot connect.
 *
 * Protocol: the client emits `chat:message` with { sessionId, message }; the
 * server answers with `bot:message` or, when the turn fails, `chat:error`.
 */

const { Server } = require('socket.io')
const jwt = require('./utils/jwt')
const chatbotService = require('./services/chatbot.service')
const logger = require('./utils/logger')

const authenticate = (socket, next) => {
  const payload = jwt.verifyToken(socket.handshake.auth?.token)
  if (!payload) {
    return next(new Error('Invalid authentication token'))
  }
  socket.userId = payload.id ?? payload.userId
  if (!socket.userId) {
    return next(new Error('Token carries no user id'))
  }
  return next()
}

const createMessageHandler =
  (socket) =>
  async (payload = {}) => {
    const { sessionId, message } = payload
    if (!message || typeof message !== 'string' || !message.trim()) {
      socket.emit('chat:error', { message: 'A non-empty message is required' })
      return
    }

    try {
      const result = await chatbotService.sendMessage(socket.userId, sessionId, message.trim())
      socket.emit('bot:message', {
        id: `${Date.now()}`,
        text: result.message,
        sender: 'bot',
        timestamp: new Date().toISOString(),
        sessionId: result.sessionId,
        booking: result.booking,
      })
    } catch (err) {
      logger.error({ action: 'ws_message_failed', error: err.message })
      socket.emit('chat:error', {
        message: 'The assistant is unavailable right now. Please try again.',
      })
    }
  }

const attachRealtime = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
    // The client asks for websocket only; polling stays allowed so clients
    // behind proxies that block upgrades can still connect.
    transports: ['websocket', 'polling'],
  })

  io.use(authenticate)

  io.on('connection', (socket) => {
    logger.info({ action: 'ws_connected', userId: socket.userId })
    socket.on('chat:message', createMessageHandler(socket))
    socket.on('disconnect', () => {
      logger.info({ action: 'ws_disconnected', userId: socket.userId })
    })
  })

  return io
}

module.exports = { attachRealtime, authenticate, createMessageHandler }
