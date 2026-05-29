/**
 * Unit tests for the chat turn handler.
 *
 * The existing integration test mocks this service wholesale, so none of its
 * behaviour was covered. Two things are pinned here, both of which were broken:
 * that a turn is actually forwarded to the AI service (it used to return a
 * hardcoded placeholder), and that the browser's string session key does not
 * reach an integer primary key (it used to, and every message 500'd).
 */

jest.mock('../../models/ChatSession')
jest.mock('../../services/aiClient')
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

const ChatSession = require('../../models/ChatSession')
const aiClient = require('../../services/aiClient')
const chatbotService = require('../../services/chatbot.service')

const SESSION_KEY = 'session-1788185187684-o6q91ysip'

beforeEach(() => {
  jest.clearAllMocks()
  aiClient.sendMessage.mockResolvedValue({
    message: 'I have a Consultation. Could you tell me a date and a time?',
    appointmentData: { service_type: 'Consultation' },
  })
  ChatSession.addMessage.mockResolvedValue({})
})

describe('sendMessage', () => {
  it('forwards the turn to the AI service instead of returning a placeholder', async () => {
    ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })

    const result = await chatbotService.sendMessage(1, SESSION_KEY, 'I want a consultation')

    expect(aiClient.sendMessage).toHaveBeenCalledWith({
      sessionId: SESSION_KEY,
      message: 'I want a consultation',
      userId: 1,
    })
    expect(result.message).toContain('Consultation')
    expect(result.message).not.toMatch(/placeholder/i)
  })

  it('looks the session up by the client key, never by the integer id', async () => {
    ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })

    await chatbotService.sendMessage(1, SESSION_KEY, 'hello')

    expect(ChatSession.findBySessionKey).toHaveBeenCalledWith(1, SESSION_KEY)
    // The old code called findById(sessionKey), which made Postgres raise
    // `invalid input syntax for type integer`.
    expect(ChatSession.findById).not.toHaveBeenCalled()
  })

  it('opens a new session when the key is unknown, carrying the key', async () => {
    ChatSession.findBySessionKey.mockResolvedValue(null)
    ChatSession.create.mockResolvedValue({ id: 9, user_id: 1 })

    await chatbotService.sendMessage(1, SESSION_KEY, 'hello')

    expect(ChatSession.create).toHaveBeenCalledWith({
      user_id: 1,
      session_key: SESSION_KEY,
    })
  })

  it('scopes the lookup to the requesting user', async () => {
    // Session keys are guessable; without the user predicate one person could
    // resume another person's conversation.
    ChatSession.findBySessionKey.mockResolvedValue(null)
    ChatSession.create.mockResolvedValue({ id: 9, user_id: 42 })

    await chatbotService.sendMessage(42, SESSION_KEY, 'hello')

    expect(ChatSession.findBySessionKey).toHaveBeenCalledWith(42, SESSION_KEY)
  })

  it('persists both sides of the exchange', async () => {
    ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })

    await chatbotService.sendMessage(1, SESSION_KEY, 'I want a consultation')

    expect(ChatSession.addMessage).toHaveBeenCalledWith(
      7,
      expect.objectContaining({
        user_message: 'I want a consultation',
        bot_response: expect.stringContaining('Consultation'),
      })
    )
  })

  it('returns the client session key so the browser can keep its thread', async () => {
    ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })

    const result = await chatbotService.sendMessage(1, SESSION_KEY, 'hi')

    expect(result.sessionId).toBe(SESSION_KEY)
  })

  it('propagates an AI service failure rather than inventing a reply', async () => {
    // A booking assistant that silently stops understanding, while still
    // replying, is worse than one that reports being unavailable.
    ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })
    const failure = new Error('AI service returned 502')
    failure.statusCode = 502
    aiClient.sendMessage.mockRejectedValue(failure)

    await expect(chatbotService.sendMessage(1, SESSION_KEY, 'hi')).rejects.toThrow('502')
    expect(ChatSession.addMessage).not.toHaveBeenCalled()
  })
})
