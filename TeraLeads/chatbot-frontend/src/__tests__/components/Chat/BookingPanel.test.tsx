import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { BookingPanel } from '@/components/Chat/BookingPanel'
import { MessageList } from '@/components/Chat/MessageList'

describe('BookingPanel', () => {
  it('explains what it will show before the conversation starts', () => {
    render(<BookingPanel booking={null} busy={false} onSend={jest.fn()} />)
    expect(screen.getByText(/details appear here/i)).toBeInTheDocument()
  })

  it('lists the fields the assistant still needs', () => {
    render(
      <BookingPanel
        booking={{
          status: 'collecting_info',
          missingFields: ['date', 'time'],
          alternatives: [],
          appointment: null,
        }}
        busy={false}
        onSend={jest.fn()}
      />
    )
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Time')).toBeInTheDocument()
  })

  it('turns offered slots into one-click replies', async () => {
    const onSend = jest.fn()
    const user = userEvent.setup()
    render(
      <BookingPanel
        booking={{
          status: 'unavailable',
          missingFields: ['time'],
          alternatives: ['09:00', '09:30'],
          appointment: null,
        }}
        busy={false}
        onSend={onSend}
      />
    )
    await user.click(screen.getByRole('button', { name: '09:30' }))
    expect(onSend).toHaveBeenCalledWith('at 09:30')
  })
})

describe('MessageList empty state', () => {
  it('offers example requests that send on click', async () => {
    const onSuggestion = jest.fn()
    const user = userEvent.setup()
    render(<MessageList messages={[]} onSuggestion={onSuggestion} />)

    await user.click(screen.getByRole('button', { name: /consultation tomorrow/i }))
    expect(onSuggestion).toHaveBeenCalledWith("I'd like a consultation tomorrow at 11am")
  })

  it('shows a waiting line while a reply is pending', () => {
    render(<MessageList messages={[]} isWaiting />)
    expect(screen.getByText(/checking the calendar/i)).toBeInTheDocument()
  })
})
