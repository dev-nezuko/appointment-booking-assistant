const rateLimit = require('express-rate-limit')

// General API rate limit (100 requests per minute)
const generalApiLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limit for chatbot token generation (5 requests per 15 minutes)
const chatbotTokenLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many token requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limit for chat messages (30 requests per minute)
const chatMessageLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many messages, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
})

// Rate limit for appointment creation (10 per minute)
const appointmentCreateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many appointment requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

// Auth rate limit (prevent brute force - 10 per 15 min)
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
})

module.exports = {
  generalApiLimit,
  chatbotTokenLimit,
  chatMessageLimit,
  appointmentCreateLimit,
  authLimit,
}
