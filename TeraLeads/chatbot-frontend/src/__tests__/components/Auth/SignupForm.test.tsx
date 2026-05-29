import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { SignupForm } from '@/components/Auth/SignupForm'
import { signup } from '@/api/auth'

jest.mock('@/api/auth')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('SignupForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders signup form with name, email and password fields', () => {
    render(<SignupForm />)
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument()
  })

  it('shows error message on failed signup', async () => {
    const user = userEvent.setup()
    ;(signup as jest.Mock).mockRejectedValue(new Error('Signup failed'))

    render(<SignupForm />)
    await user.type(screen.getByLabelText(/full name/i), 'Test User')
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('disables submit button when loading', async () => {
    const user = userEvent.setup()
    let resolveSignup: (value: unknown) => void
    ;(signup as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignup = resolve
        })
    )

    render(<SignupForm />)
    await user.type(screen.getByLabelText(/full name/i), 'New User')
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign up/i }))

    expect(screen.getByRole('button', { name: /loading|sign up/i })).toBeDisabled()
    resolveSignup!({
      token: 'token',
      user: { id: '1', email: 'new@example.com', name: 'New User' },
    })
  })
})
