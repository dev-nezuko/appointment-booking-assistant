import { render, screen } from '@/__tests__/utils/test-utils'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders with aria-label', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
  })

  it('applies size classes', () => {
    const { container } = render(<LoadingSpinner size="sm" />)
    expect(container.firstChild).toHaveClass('w-4', 'h-4')
  })

  it('renders screen reader text', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
