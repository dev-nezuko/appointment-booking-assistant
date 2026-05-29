/**
 * Console logger with a timestamp and level prefix. Objects are shallow-copied
 * with credential-like fields replaced, so a careless log call cannot leak a
 * password or token.
 */

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey', 'authorization']

const redact = (data) => {
  if (!data || typeof data !== 'object') {
    return data
  }
  const copy = { ...data }
  SENSITIVE_FIELDS.forEach((field) => {
    if (copy[field]) {
      copy[field] = '[REDACTED]'
    }
  })
  return copy
}

const stamp = (level) => `[${level}] ${new Date().toISOString()}`

const logger = {
  // eslint-disable-next-line no-console
  info: (data) => console.log(stamp('INFO'), redact(data)),
  error: (data) => console.error(stamp('ERROR'), redact(data)),
  warn: (data) => console.warn(stamp('WARN'), redact(data)),
  debug: (data) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug(stamp('DEBUG'), redact(data))
    }
  },
}

module.exports = logger
