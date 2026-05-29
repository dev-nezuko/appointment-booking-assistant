import authReducer, { setCredentials, logout } from '@/state/slices/authSlice'

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
  }

  it('should return initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle setCredentials', () => {
    const user = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
    }
    const token = 'jwt-token-123'
    const actual = authReducer(initialState, setCredentials({ user, token }))

    expect(actual.user).toEqual(user)
    expect(actual.token).toBe(token)
    expect(actual.isAuthenticated).toBe(true)
  })

  it('should handle logout', () => {
    const stateWithAuth = {
      user: { id: '1', email: 'test@example.com', name: 'Test' },
      token: 'token',
      isAuthenticated: true,
    }
    const actual = authReducer(stateWithAuth, logout())

    expect(actual.user).toBeNull()
    expect(actual.token).toBeNull()
    expect(actual.isAuthenticated).toBe(false)
  })
})
