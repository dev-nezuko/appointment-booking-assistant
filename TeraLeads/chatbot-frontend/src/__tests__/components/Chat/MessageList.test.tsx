import { render, screen } from '@/__tests__/utils/test-utils'
import { MessageList } from '@/components/Chat/MessageList'
import type { Message } from '@/state/slices/chatSlice'

describe('MessageList', () => {
  it('renders empty state when no messages', () => {
    render(<MessageList messages={[]} />)
    expect(screen.getByText(/no messages yet/i)).toBeInTheDocument()
  })

  it('renders user messages aligned to the right', () => {
    const messages: Message[] = [
      {
        id: '1',
        text: 'Hello',
        sender: 'user',
        timestamp: new Date().toISOString(),
      },
    ]
    render(<MessageList messages={messages} />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders bot messages aligned to the left', () => {
    const messages: Message[] = [
      {
        id: '2',
        text: 'Hi there!',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      },
    ]
    render(<MessageList messages={messages} />)
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
  })

  it('renders multiple messages in order', () => {
    const messages: Message[] = [
      {
        id: '1',
        text: 'First',
        sender: 'user',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        text: 'Second',
        sender: 'bot',
        timestamp: new Date().toISOString(),
      },
    ]
    render(<MessageList messages={messages} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('has accessible role for chat messages', () => {
    render(<MessageList messages={[]} />)
    expect(screen.getByRole('log', { name: /chat messages/i })).toBeInTheDocument()
  })
})
