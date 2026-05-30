/**
 * Error Handler Middleware
 *
 * Centralized error handling for all routes and middleware.
 * Catches all errors and returns appropriate HTTP responses.
 *
 * Security considerations:
 * - Hides stack traces in production
 * - Sanitizes error messages to prevent information leakage
 * - Logs all errors for debugging
 */

const logger = require('../utils/logger')

/**
 * Global error handler middleware
 *
 * Must be the last middleware in the Express app.
 * Catches all errors from routes and middleware, logs them,
 * and returns appropriate HTTP responses.
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (unused, required for error middleware)
 *
 * @returns {void} Sends error response
 */
const errorHandler = (err, req, res, _next) => {
  // Determine status code (default to 500 for server errors)
  const statusCode = err.statusCode || err.status || 500

  // Determine error message
  // In production, use generic messages for 5xx errors to prevent information leakage
  let message = err.message || 'Internal server error'
  if (statusCode >= 500 && process.env.NODE_ENV === 'production') {
    message = 'Internal server error'
  }

  // Log error with context
  logger.error({
    action: 'error_handler',
    error: err.message,
    statusCode: statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  })

  // Prepare error response
  const errorResponse = {
    error: message,
    statusCode: statusCode,
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack
    errorResponse.details = err
  }

  // Send error response
  res.status(statusCode).json(errorResponse)
}

module.exports = errorHandler
