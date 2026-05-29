const jwt = require('jsonwebtoken')
const logger = require('./logger')

const DEFAULT_SECRET = 'your-secret-key-change-in-production'
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET
const ISSUER = 'chatbot-backend'

if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'development') {
  logger.warn('JWT_SECRET not set! Using default secret - SECURITY RISK!')
}

/** Sign a payload. Login tokens last 24h; pass { expiresIn } for shorter ones. */
const generateToken = (payload, options = {}) => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be an object')
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h', issuer: ISSUER, ...options })
}

/** The decoded claims, or null for a missing, forged or expired token. */
const verifyToken = (token) => {
  if (!token || typeof token !== 'string') {
    return null
  }
  try {
    return jwt.verify(token, JWT_SECRET, { issuer: ISSUER })
  } catch (error) {
    logger.debug({ action: 'token_verification_failed', reason: error.name })
    return null
  }
}

module.exports = { generateToken, verifyToken }
