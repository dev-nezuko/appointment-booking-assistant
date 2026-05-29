const bcrypt = require('bcryptjs')
const jwt = require('../utils/jwt')
const User = require('../models/User')
const logger = require('../utils/logger')

class AuthenticationError extends Error {
  constructor(message, statusCode = 401) {
    super(message)
    this.name = 'AuthenticationError'
    this.statusCode = statusCode
  }
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Compared against when the email is unknown, so a miss costs the same bcrypt
// work as a wrong password and response times do not reveal which accounts
// exist. It must be a well-formed hash: bcryptjs returns false instantly for
// a malformed one, which would defeat the point.
const TIMING_GUARD_HASH = bcrypt.hashSync('no-such-user', 10)

const issueSession = (user) => ({
  token: jwt.generateToken({ id: user.id, email: user.email, name: user.name }),
  user: { id: user.id, email: user.email, name: user.name },
})

/** Wrap anything unexpected (a database outage) so its details stay server-side. */
const withAuthErrors =
  (action, fallbackMessage, fn) =>
  async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }
      logger.error({ action, error: error.message })
      throw new AuthenticationError(fallbackMessage, 500)
    }
  }

const signup = withAuthErrors(
  'user_signup_error',
  'Registration failed. Please try again.',
  async (email, password, name) => {
    if (!email || !password || !name) {
      throw new AuthenticationError('Email, password, and name are required', 400)
    }
    if (!EMAIL_PATTERN.test(email)) {
      throw new AuthenticationError('Invalid email format', 400)
    }
    if (password.length < 6) {
      throw new AuthenticationError('Password must be at least 6 characters', 400)
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (await User.findByEmail(normalizedEmail)) {
      throw new AuthenticationError('User already exists', 409)
    }

    const user = await User.create({
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      name: name.trim(),
    })
    logger.info({ action: 'user_signup', userId: user.id })
    return issueSession(user)
  }
)

const login = withAuthErrors(
  'login_error',
  'Login failed. Please try again.',
  async (email, password) => {
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required', 400)
    }

    const user = await User.findByEmail(email.toLowerCase().trim())
    const isValid = await bcrypt.compare(password, user?.password || TIMING_GUARD_HASH)
    if (!user || !isValid) {
      logger.warn({ action: 'login_failed', reason: 'invalid_credentials' })
      throw new AuthenticationError('Invalid email or password', 401)
    }

    logger.info({ action: 'user_login', userId: user.id })
    return issueSession(user)
  }
)

module.exports = { signup, login, AuthenticationError }
