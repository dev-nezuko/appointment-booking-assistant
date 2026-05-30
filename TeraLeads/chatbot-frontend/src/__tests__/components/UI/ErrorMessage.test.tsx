import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ErrorMessage } from '@/components/UI/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error message', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
  })

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup()
    const onDismiss = jest.fn()
    render(<ErrorMessage message="Error" onDismiss={onDismiss} />)

    await user.click(screen.getByRole('button', { name: /dismiss error/i }))

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not render dismiss button when onDismiss is not provided', () => {
    render(<ErrorMessage message="Error" />)
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
  })
})
