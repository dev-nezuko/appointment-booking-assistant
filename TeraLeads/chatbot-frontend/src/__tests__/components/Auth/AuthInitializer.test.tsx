import { render } from '@/__tests__/utils/test-utils'
import { AuthInitializer } from '@/components/Auth/AuthInitializer'
import { store } from '@/state/store'
import { logout } from '@/state/slices/authSlice'

const encode = (part: object) =>
  btoa(JSON.stringify(part)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

const tokenWith = (claims: object) =>
  `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}.signature`

const inAnHour = () => Math.floor(Date.now() / 1000) + 3600

describe('AuthInitializer', () => {
  beforeEach(() => {
    localStorage.clear()
    store.dispatch(logout())
  })

  it('restores the session from a stored login token after a reload', () => {
    const token = tokenWith({ id: 12, email: 'sam@example.com', name: 'Sam', exp: inAnHour() })
    localStorage.setItem('token', token)

    render(<AuthInitializer>child</AuthInitializer>)

    const { auth } = store.getState()
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.user).toEqual({ id: '12', email: 'sam@example.com', name: 'Sam' })
  })

  it('drops an expired token instead of restoring it', () => {
    const token = tokenWith({ id: 12, email: 'sam@example.com', exp: 1 })
    localStorage.setItem('token', token)

    render(<AuthInitializer>child</AuthInitializer>)

    expect(store.getState().auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('drops a token that carries no user', () => {
    localStorage.setItem('token', tokenWith({ exp: inAnHour() }))

    render(<AuthInitializer>child</AuthInitializer>)

    expect(store.getState().auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })
})
