/**
 * Authentication Middleware
 *
 * Verifies JWT tokens in request headers and attaches user information to requests.
 * Protects routes that require authentication.
 *
 * Security features:
 * - Validates Bearer token format
 * - Verifies token signature and expiration
 * - Attaches decoded user info to request object
 */

const jwt = require('../utils/jwt')
const logger = require('../utils/logger')

/**
 * Middleware to verify JWT authentication token
 *
 * Extracts Bearer token from Authorization header, verifies it,
 * and attaches decoded user information to req.user.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 *
 * @returns {void} Calls next() if authentication succeeds, sends 401 error otherwise
 *
 * @example
 * ```javascript
 * router.get('/protected', verifyToken, (req, res) => {
 *   // req.user is now available with user ID and email
 *   res.json({ userId: req.user.id })
 * })
 * ```
 */
const verifyToken = (req, res, next) => {
  try {
    // Extract Authorization header
    const authHeader = req.headers.authorization

    // Validate header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn({
        action: 'auth_failed',
        reason: 'no_token',
        ip: req.ip,
        path: req.path,
      })
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No valid token provided',
      })
    }

    // Extract token (remove 'Bearer ' prefix)
    const token = authHeader.substring(7)

    // Validate token is not empty
    if (!token || token.trim().length === 0) {
      logger.warn({
        action: 'auth_failed',
        reason: 'empty_token',
        ip: req.ip,
        path: req.path,
      })
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid token format',
      })
    }

    // Verify and decode token
    const decoded = jwt.verifyToken(token)

    if (!decoded) {
      logger.warn({
        action: 'auth_failed',
        reason: 'invalid_token',
        ip: req.ip,
        path: req.path,
      })
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Invalid or expired token',
      })
    }

    // Attach user information to request object
    // This makes user data available to subsequent middleware and route handlers
    req.user = {
      id: decoded.id,
      email: decoded.email,
    }

    // Continue to next middleware/route handler
    next()
  } catch (error) {
    // Log unexpected errors
    logger.error({
      action: 'auth_error',
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      path: req.path,
    })

    // Return generic error to prevent information leakage
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Unable to verify authentication token',
    })
  }
}

module.exports = {
  verifyToken,
}
