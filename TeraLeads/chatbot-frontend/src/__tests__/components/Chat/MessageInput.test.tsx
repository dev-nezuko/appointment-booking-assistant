import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MessageInput } from '@/components/Chat/MessageInput'

describe('MessageInput', () => {
  it('renders input and send button', () => {
    const onSend = jest.fn()
    render(<MessageInput onSend={onSend} />)
    expect(screen.getByLabelText(/message input/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
  })

  it('calls onSend when form is submitted with text', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()
    render(<MessageInput onSend={onSend} />)

    await user.type(screen.getByLabelText(/message input/i), 'Hello')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(onSend).toHaveBeenCalledWith('Hello')
  })

  it('clears input after sending', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()
    render(<MessageInput onSend={onSend} />)

    const input = screen.getByLabelText(/message input/i)
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(input).toHaveValue('')
  })

  it('does not call onSend when input is empty', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()
    render(<MessageInput onSend={onSend} />)

    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(onSend).not.toHaveBeenCalled()
  })

  it('does not call onSend when disabled', async () => {
    const user = userEvent.setup()
    const onSend = jest.fn()
    render(<MessageInput onSend={onSend} disabled />)

    const input = screen.getByLabelText(/message input/i)
    await user.type(input, 'Hello')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect(onSend).not.toHaveBeenCalled()
  })

  it('disables input and button when isLoading', () => {
    const onSend = jest.fn()
    render(<MessageInput onSend={onSend} isLoading />)

    expect(screen.getByLabelText(/message input/i)).toBeDisabled()
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })
})
