import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ChatInterface } from '@/components/Chat/ChatInterface'
import { store } from '@/state/store'
import { setCredentials } from '@/state/slices/authSlice'

const mockSocket = {
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  connected: false,
  connecting: false,
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
})
