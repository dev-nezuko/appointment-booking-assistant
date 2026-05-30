const request = require('supertest')
const authService = require('../../services/auth.service')

jest.mock('../../services/auth.service')
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const app = require('../../app')

describe('Auth API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/auth/signup', () => {
    it('should create user and return token', async () => {
      authService.signup.mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, email: 'new@example.com', name: 'New User' },
      })

      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'new@example.com', password: 'password123', name: 'New User' })

      expect(res.status).toBe(201)
      expect(res.body.token).toBeDefined()
      expect(res.body.user.email).toBe('new@example.com')
    })

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({ email: 'invalid', password: 'password123', name: 'User' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    it('should return token for valid credentials', async () => {
      authService.login.mockResolvedValue({
        token: 'mock-token',
        user: { id: 1, email: 'test@example.com', name: 'Test User' },
      })

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })

      expect(res.status).toBe(200)
      expect(res.body.token).toBeDefined()
    })

    it('should reject missing credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({ email: 'test@example.com' })

      expect(res.status).toBe(400)
    })
  })
})
