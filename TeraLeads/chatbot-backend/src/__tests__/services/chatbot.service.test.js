/**
 * Unit tests for the chat turn handler: forwarding to the AI service, session
 * lookup by the browser's string key, and writing confirmed bookings to
 * Postgres.
 */

jest.mock('../../models/ChatSession')
jest.mock('../../services/aiClient')
jest.mock('../../services/appointment.service')
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}))

const ChatSession = require('../../models/ChatSession')
const aiClient = require('../../services/aiClient')
const appointmentService = require('../../services/appointment.service')
const chatbotService = require('../../services/chatbot.service')

const SESSION_KEY = 'session-1788185187684-o6q91ysip'

beforeEach(() => {
  jest.clearAllMocks()
  aiClient.sendMessage.mockResolvedValue({
    message: 'I have a Consultation. Could you tell me a date and a time?',
    booking: { status: 'collecting_info', missingFields: ['date', 'time'], appointment: null },
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

  describe('when the assistant books a slot', () => {
    const booked = {
      message: 'Your appointment is booked.',
      booking: {
        status: 'booked',
        missingFields: [],
        alternatives: [],
        appointment: { date: '2030-01-10', time: '11:00', type: 'Consultation' },
      },
    }

    beforeEach(() => {
      ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })
      aiClient.sendMessage.mockResolvedValue(booked)
    })

    it('writes it to the appointments table as confirmed and links the session', async () => {
      appointmentService.createAppointment.mockResolvedValue({ id: 31 })

      const result = await chatbotService.sendMessage(1, SESSION_KEY, 'yes')

      expect(appointmentService.createAppointment).toHaveBeenCalledWith(1, {
        date: '2030-01-10',
        time: '11:00',
        service_type: 'Consultation',
        status: 'confirmed',
      })
      expect(ChatSession.linkAppointment).toHaveBeenCalledWith(7, 31)
      expect(result.booking.appointment.id).toBe(31)
      expect(result.message).toBe('Your appointment is booked.')
    })

    it('tells the user when the calendar already holds that slot', async () => {
      const conflict = new Error('Time slot is not available')
      conflict.statusCode = 409
      appointmentService.createAppointment.mockRejectedValue(conflict)

      const result = await chatbotService.sendMessage(1, SESSION_KEY, 'yes')

      expect(result.booking.status).toBe('unavailable')
      expect(result.message).toMatch(/just been taken/)
      expect(ChatSession.addMessage).toHaveBeenCalledWith(
        7,
        expect.objectContaining({ bot_response: result.message })
      )
    })

    it('does not hide a database failure behind a friendly reply', async () => {
      appointmentService.createAppointment.mockRejectedValue(new Error('connection refused'))

      await expect(chatbotService.sendMessage(1, SESSION_KEY, 'yes')).rejects.toThrow(
        'connection refused'
      )
    })
  })

  it('does not touch the appointments table while details are being collected', async () => {
    ChatSession.findBySessionKey.mockResolvedValue({ id: 7, user_id: 1 })

    await chatbotService.sendMessage(1, SESSION_KEY, 'I want a consultation')

    expect(appointmentService.createAppointment).not.toHaveBeenCalled()
  })
})
