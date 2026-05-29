jest.mock('../services/chatbot.service')
jest.mock('../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const jwt = require('../utils/jwt')
const chatbotService = require('../services/chatbot.service')
const { authenticate, createMessageHandler } = require('../realtime')

const fakeSocket = (token) => ({
  handshake: { auth: { token } },
  emit: jest.fn(),
})

beforeEach(() => {
  jest.clearAllMocks()
})

describe('socket authentication', () => {
  it('accepts a login token and records the user id', () => {
    const socket = fakeSocket(jwt.generateToken({ id: 5, email: 'a@example.com' }))
    const next = jest.fn()

    authenticate(socket, next)

    expect(next).toHaveBeenCalledWith()
    expect(socket.userId).toBe(5)
  })

  it('rejects a missing or forged token', () => {
    const next = jest.fn()
    authenticate(fakeSocket(undefined), next)
    authenticate(fakeSocket('not-a-jwt'), next)

    expect(next).toHaveBeenCalledTimes(2)
    next.mock.calls.forEach(([err]) => expect(err).toBeInstanceOf(Error))
  })
})

describe('chat:message handler', () => {
  it('answers each message, including an identical repeat', async () => {
    chatbotService.sendMessage.mockResolvedValue({
      message: 'Is this correct?',
      sessionId: 's1',
      booking: { status: 'ready_to_book' },
    })
    const socket = { userId: 3, emit: jest.fn() }
    const handle = createMessageHandler(socket)

    await handle({ sessionId: 's1', message: 'yes' })
    await handle({ sessionId: 's1', message: 'yes' })

    expect(chatbotService.sendMessage).toHaveBeenCalledTimes(2)
    expect(socket.emit).toHaveBeenLastCalledWith(
      'bot:message',
      expect.objectContaining({ text: 'Is this correct?', booking: { status: 'ready_to_book' } })
    )
  })

  it('rejects a blank message without calling the assistant', async () => {
    const socket = { userId: 3, emit: jest.fn() }

    await createMessageHandler(socket)({ sessionId: 's1', message: '   ' })

    expect(chatbotService.sendMessage).not.toHaveBeenCalled()
    expect(socket.emit).toHaveBeenCalledWith('chat:error', expect.any(Object))
  })

  it('reports a failed turn on chat:error', async () => {
    chatbotService.sendMessage.mockRejectedValue(new Error('AI service returned 502'))
    const socket = { userId: 3, emit: jest.fn() }

    await createMessageHandler(socket)({ sessionId: 's1', message: 'hi' })

    expect(socket.emit).toHaveBeenCalledWith('chat:error', {
      message: 'The assistant is unavailable right now. Please try again.',
    })
  })
})
