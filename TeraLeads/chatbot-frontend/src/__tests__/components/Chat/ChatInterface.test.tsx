import { act, render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '@/components/Chat/ChatInterface'
import { store } from '@/state/store'
import { setCredentials } from '@/state/slices/authSlice'
import { clearChat, setLoading } from '@/state/slices/chatSlice'

type Handler = (data: unknown) => void
const handlers: Record<string, Handler> = {}

const mockSocket = {
  on: jest.fn((event: string, fn: Handler) => {
    handlers[event] = fn
  }),
  off: jest.fn(),
  emit: jest.fn(),
  connected: false,
}

jest.mock('@/utils/websocket', () => ({
  connectWebSocket: jest.fn(),
  disconnectWebSocket: jest.fn(),
  getSocket: jest.fn(() => mockSocket),
  getConnectionStatus: jest.fn(() => 'disconnected'),
}))

jest.mock('@/api/chatbot', () => ({
  sendMessage: jest.fn().mockResolvedValue({
    message: 'Bot response',
    sessionId: 'test-session',
    booking: null,
  }),
  ChatbotError: class ChatbotError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ChatbotError'
    }
  },
}))

describe('ChatInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSocket.connected = false
    store.dispatch(clearChat())
    store.dispatch(setLoading(false))
    store.dispatch(
      setCredentials({
        token: 'test-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' },
      })
    )
  })

  it('renders connection status', () => {
    render(<ChatInterface />)
    expect(screen.getByText(/disconnected|connecting|connected/i)).toBeInTheDocument()
  })

  it('renders message input', () => {
    render(<ChatInterface />)
    expect(screen.getByLabelText(/message input/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('sends message and displays bot response when using REST fallback', async () => {
    const user = userEvent.setup()
    render(<ChatInterface />)
    await user.type(screen.getByLabelText(/message input/i), 'Hello')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Bot response')).toBeInTheDocument()
    })
  })

  it('displays error message when send fails', async () => {
    const { sendMessage, ChatbotError } = await import('@/api/chatbot')
    ;(sendMessage as jest.Mock).mockRejectedValue(
      new ChatbotError('Failed to send message')
    )

    const user = userEvent.setup()
    render(<ChatInterface />)
    await user.type(screen.getByLabelText(/message input/i), 'Hello')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  describe('over the socket', () => {
    beforeEach(() => {
      mockSocket.connected = true
    })

    it('emits each message once and waits for the reply', async () => {
      const user = userEvent.setup()
      render(<ChatInterface />)
      await user.type(screen.getByLabelText(/message input/i), 'yes')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(mockSocket.emit).toHaveBeenCalledTimes(1)
      expect(mockSocket.emit).toHaveBeenCalledWith('chat:message', {
        sessionId: expect.any(String),
        message: 'yes',
      })
      expect(screen.getByLabelText(/message input/i)).toBeDisabled()

      act(() => handlers['bot:message']({ text: 'Is this correct?', booking: null }))

      expect(screen.getByText('Is this correct?')).toBeInTheDocument()
      expect(screen.getByLabelText(/message input/i)).toBeEnabled()
    })

    it('shows the summary card and confirms with one click', async () => {
      const user = userEvent.setup()
      render(<ChatInterface />)

      act(() =>
        handlers['bot:message']({
          text: 'Is this correct?',
          booking: {
            status: 'ready_to_book',
            missingFields: [],
            alternatives: [],
            appointment: { date: '2030-01-10', time: '11:00', type: 'Consultation' },
          },
        })
      )

      expect(screen.getByText('Consultation')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /confirm booking/i }))
      expect(mockSocket.emit).toHaveBeenCalledWith('chat:message', {
        sessionId: expect.any(String),
        message: 'yes',
      })
    })

    it('shows the reference once booked, without a confirm button', () => {
      render(<ChatInterface />)

      act(() =>
        handlers['bot:message']({
          text: 'You are booked.',
          booking: {
            status: 'booked',
            missingFields: [],
            alternatives: [],
            appointment: { id: 31, date: '2030-01-10', time: '11:00', type: 'Consultation' },
          },
        })
      )

      expect(screen.getByText(/#31/)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /confirm booking/i })).not.toBeInTheDocument()
    })

    it('surfaces chat:error and re-enables the input', async () => {
      const user = userEvent.setup()
      render(<ChatInterface />)
      await user.type(screen.getByLabelText(/message input/i), 'hi')
      await user.click(screen.getByRole('button', { name: /send message/i }))

      act(() => handlers['chat:error']({ message: 'The assistant is unavailable right now.' }))

      expect(screen.getByRole('alert')).toHaveTextContent(/unavailable/)
      expect(screen.getByLabelText(/message input/i)).toBeEnabled()
    })
  })
})
