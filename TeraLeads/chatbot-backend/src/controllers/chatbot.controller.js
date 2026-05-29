const chatbotService = require('../services/chatbot.service')

const generateToken = async (req, res, next) => {
  try {
    const userId = req.user.id
    const token = await chatbotService.generateChatbotToken(userId)
    res.json({ token })
  } catch (error) {
    next(error)
  }
}

const sendMessage = async (req, res, next) => {
  try {
    const { sessionId, message } = req.body
    const userId = req.user.id
    const result = await chatbotService.sendMessage(userId, sessionId, message)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  generateToken,
  sendMessage,
}
