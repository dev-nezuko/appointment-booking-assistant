const jwt = require('../utils/jwt')
const logger = require('../utils/logger')

const unauthorized = (req, res, reason, message) => {
  logger.warn({ action: 'auth_failed', reason, ip: req.ip, path: req.path })
  return res.status(401).json({ error: 'Authentication required', message })
}

/** Require `Authorization: Bearer <jwt>` and expose the caller as req.user. */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(req, res, 'no_token', 'No valid token provided')
  }

  const decoded = jwt.verifyToken(authHeader.slice(7).trim())
  if (!decoded) {
    return unauthorized(req, res, 'invalid_token', 'Invalid or expired token')
  }

  req.user = { id: decoded.id, email: decoded.email }
  return next()
}

module.exports = { verifyToken }
