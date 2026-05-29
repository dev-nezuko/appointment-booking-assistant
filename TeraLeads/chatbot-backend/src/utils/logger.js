/**
 * Logger Utility
 *
 * Centralized logging utility for consistent log formatting.
 * In production, consider using a proper logging library like Winston or Pino.
 *
 * Security considerations:
 * - Never logs passwords, tokens, or other sensitive data
 * - Sanitizes user input before logging
 */

/**
 * Sanitizes data to remove sensitive information before logging
 *
 * @param {Object} data - Data object to sanitize
 * @returns {Object} Sanitized data object
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data
  }

  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization']
  const sanitized = { ...data }

  sensitiveFields.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })

  return sanitized
}

/**
 * Logger object with info, error, and warn methods
 */
const logger = {
  /**
   * Logs informational messages
   *
   * @param {Object|string} data - Data to log
   */
  info: (data) => {
    const sanitized = typeof data === 'object' ? sanitizeLogData(data) : data
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${new Date().toISOString()}`, sanitized)
  },

  /**
   * Logs error messages
   *
   * @param {Object|string} data - Error data to log
   */
  error: (data) => {
    const sanitized = typeof data === 'object' ? sanitizeLogData(data) : data
    console.error(`[ERROR] ${new Date().toISOString()}`, sanitized)
  },

  /**
   * Logs warning messages
   *
   * @param {Object|string} data - Warning data to log
   */
  warn: (data) => {
    const sanitized = typeof data === 'object' ? sanitizeLogData(data) : data
    console.warn(`[WARN] ${new Date().toISOString()}`, sanitized)
  },

  /**
   * Logs debug messages (only in development)
   *
   * @param {Object|string} data - Debug data to log
   */
  debug: (data) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitized = typeof data === 'object' ? sanitizeLogData(data) : data
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${new Date().toISOString()}`, sanitized)
    }
  },
}

module.exports = logger
