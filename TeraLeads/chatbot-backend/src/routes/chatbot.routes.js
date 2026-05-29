const express = require('express')
const chatbotController = require('../controllers/chatbot.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware')

const router = express.Router()

// Generate chatbot token endpoint
router.post(
  '/token',
  authMiddleware.verifyToken,
  rateLimitMiddleware.chatbotTokenLimit,
  chatbotController.generateToken
)

// Chat message endpoint
router.post(
  '/message',
  authMiddleware.verifyToken,
  rateLimitMiddleware.chatMessageLimit,
  chatbotController.sendMessage
)

module.exports = router
