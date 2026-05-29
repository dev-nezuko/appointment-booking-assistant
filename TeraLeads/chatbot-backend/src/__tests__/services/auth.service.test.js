/**
 * Authentication Service Tests
 *
 * Unit tests for authentication service functions.
 */

const bcrypt = require('bcryptjs')
const authService = require('../../services/auth.service')
const User = require('../../models/User')
const jwt = require('../../utils/jwt')

// Mock dependencies
jest.mock('../../models/User')
jest.mock('../../utils/jwt')
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
      }

      User.findByEmail.mockResolvedValue(null)
      User.create.mockResolvedValue(mockUser)
      jwt.generateToken.mockReturnValue('test-token')

      const result = await authService.signup('test@example.com', 'password123', 'Test User')

      expect(result.token).toBe('test-token')
      expect(result.user.email).toBe('test@example.com')
      expect(User.create).toHaveBeenCalled()
    })

    it('should throw error if user already exists', async () => {
      User.findByEmail.mockResolvedValue({ id: 1, email: 'test@example.com' })

      await expect(
        authService.signup('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('User already exists')
    })

    it('should validate email format', async () => {
      await expect(authService.signup('invalid-email', 'password123', 'Test User')).rejects.toThrow(
        'Invalid email format'
      )
    })

    it('should validate password length', async () => {
      await expect(authService.signup('test@example.com', 'short', 'Test User')).rejects.toThrow(
        'Password must be at least 6 characters'
      )
    })
  })

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      }

      User.findByEmail.mockResolvedValue(mockUser)
      jwt.generateToken.mockReturnValue('test-token')

      const result = await authService.login('test@example.com', 'password123')

      expect(result.token).toBe('test-token')
      expect(result.user.email).toBe('test@example.com')
    })

    it('should throw error for invalid credentials', async () => {
      User.findByEmail.mockResolvedValue(null)

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow(
        'Invalid email or password'
      )
    })
  })
})
