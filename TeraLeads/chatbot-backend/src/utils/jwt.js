/**
 * JWT Utility Functions
 *
 * Handles JWT token generation and verification.
 *
 * Security considerations:
 * - Uses environment variable for secret (must be set in production)
 * - Tokens expire after specified time (default 24 hours)
 * - Verifies token signature and expiration
 */

const jwt = require('jsonwebtoken')
const logger = require('./logger')

/**
 * JWT secret key from environment variables
 *
 * WARNING: In production, this MUST be set via environment variable.
 * Using the default value is a security risk.
 */
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Warn if using default secret in non-development environments
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'development') {
  logger.warn('JWT_SECRET not set! Using default secret - SECURITY RISK!')
}

/**
 * Generates a JWT token with the provided payload
 *
 * @param {Object} payload - Data to encode in the token (typically user ID and email)
 * @param {Object} options - Additional JWT options
 * @param {string} options.expiresIn - Token expiration time (default: '24h')
 * @returns {string} Signed JWT token
 *
 * @example
 * ```javascript
 * const token = generateToken({ id: 123, email: 'user@example.com' })
 * const shortToken = generateToken({ id: 123 }, { expiresIn: '15m' })
 * ```
 */
const generateToken = (payload, options = {}) => {
  try {
    // Validate payload
    if (!payload || typeof payload !== 'object') {
      throw new Error('Payload must be an object')
    }

    // Default expiration: 24 hours
    // For chatbot tokens, use shorter expiration (15 minutes)
    const tokenOptions = {
      expiresIn: options.expiresIn || '24h',
      issuer: 'chatbot-backend',
      ...options,
    }

    const token = jwt.sign(payload, JWT_SECRET, tokenOptions)

    logger.debug({
      action: 'token_generated',
      userId: payload.id,
      expiresIn: tokenOptions.expiresIn,
    })

    return token
  } catch (error) {
    logger.error({
      action: 'token_generation_error',
      error: error.message,
    })
    throw new Error('Failed to generate token')
  }
}

/**
 * Verifies and decodes a JWT token
 *
 * @param {string} token - JWT token string to verify
 * @returns {Object|null} Decoded token payload if valid, null otherwise
 *
 * @example
 * ```javascript
 * const decoded = verifyToken(token)
 * if (decoded) {
 *   console.log('User ID:', decoded.id)
 * } else {
 *   console.log('Invalid token')
 * }
 * ```
 */
const verifyToken = (token) => {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      return null
    }

    // Verify token signature and expiration
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'chatbot-backend',
    })

    return decoded
  } catch (error) {
    // Log different error types for debugging
    if (error.name === 'TokenExpiredError') {
      logger.debug({
        action: 'token_verification_failed',
        reason: 'expired',
      })
    } else if (error.name === 'JsonWebTokenError') {
      logger.debug({
        action: 'token_verification_failed',
        reason: 'invalid_signature',
      })
    } else {
      logger.error({
        action: 'token_verification_error',
        error: error.message,
      })
    }

    return null
  }
}

/**
 * Decodes a JWT token without verification (for debugging only)
 *
 * WARNING: This does NOT verify the signature. Use verifyToken() in production.
 *
 * @param {string} token - JWT token string to decode
 * @returns {Object|null} Decoded token payload, or null if invalid
 */
const decodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      return null
    }
    return jwt.decode(token)
  } catch (error) {
    logger.error({
      action: 'token_decode_error',
      error: error.message,
    })
    return null
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
}
