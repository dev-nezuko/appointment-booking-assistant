const logger = require('../utils/logger')

/**
 * Turn any error passed to next() into a JSON response. 5xx messages are
 * replaced in production so database or upstream details never reach a client.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || err.status || 500

  let message = err.message || 'Internal server error'
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error'
  }

  logger.error({
    action: 'error_handler',
    error: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  })

  const body = { error: message, statusCode }
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack
  }
  res.status(statusCode).json(body)
}

module.exports = errorHandler
