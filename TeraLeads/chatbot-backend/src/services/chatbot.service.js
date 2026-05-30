const jwt = require('../utils/jwt')
const ChatSession = require('../models/ChatSession')

const generateChatbotToken = async (userId) => {
  // Generate short-lived token for chatbot access (15 minutes)
  const token = jwt.generateToken({ userId, type: 'chatbot' }, { expiresIn: '15m' })
  return token
}

const sendMessage = async (userId, sessionId, message) => {
  // Get or create chat session
  let session = await ChatSession.findById(sessionId)
  if (!session || session.user_id !== userId) {
    session = await ChatSession.create({ user_id: userId })
  }

  // TODO: Forward message to AI microservice
  // For now, return a placeholder response
  const response = {
    message: 'This is a placeholder response. AI service integration pending.',
    sessionId: session.id,
  }

  // Log the interaction
  await ChatSession.addMessage(session.id, {
    user_message: message,
    bot_response: response.message,
    timestamp: new Date(),
  })

  return response
}

module.exports = {
  generateChatbotToken,
  sendMessage,
}
