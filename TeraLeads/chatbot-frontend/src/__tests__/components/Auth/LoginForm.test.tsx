import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/Auth/LoginForm'
import { login } from '@/api/auth'

jest.mock('@/api/auth', () => {
  const actual = jest.requireActual<typeof import('@/api/auth')>('@/api/auth')
  return {
    ...actual,
    login: jest.fn(),
  }
})
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form with email and password fields', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error message on failed login', async () => {
    const user = userEvent.setup()
    ;(login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  it('disables submit button when loading', async () => {
    const user = userEvent.setup()
    let resolveLogin: (value: unknown) => void
    ;(login as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve
        })
    )

    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByRole('button', { name: /loading|login/i })).toBeDisabled()
    resolveLogin!({
      token: 'token',
      user: { id: '1', email: 'test@example.com', name: 'Test' },
    })
  })

  it('displays AuthenticationError message when thrown', async () => {
    const user = userEvent.setup()
    const { AuthenticationError } = await import('@/api/auth')
    ;(login as jest.Mock).mockRejectedValue(new AuthenticationError('Invalid credentials'))

    render(<LoginForm />)
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'wrong')
    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
    })
  })
})
