const request = require('supertest')
const jwt = require('../../utils/jwt')
const chatbotService = require('../../services/chatbot.service')

jest.mock('../../services/chatbot.service')
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const app = require('../../app')

describe('Chatbot API Integration', () => {
  let authToken

  beforeAll(() => {
    authToken = jwt.generateToken({ id: 1, email: 'test@example.com' })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/chatbot/token', () => {
    it('should require authentication', async () => {
      const res = await request(app).post('/api/chatbot/token')
      expect(res.status).toBe(401)
    })

    it('should return chatbot token when authenticated', async () => {
      chatbotService.generateChatbotToken.mockResolvedValue('chatbot-short-token')

      const res = await request(app)
        .post('/api/chatbot/token')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.token).toBe('chatbot-short-token')
    })
  })
})
