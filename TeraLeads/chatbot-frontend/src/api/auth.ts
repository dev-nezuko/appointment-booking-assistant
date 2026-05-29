import { AxiosError } from 'axios'
import { apiClient } from './client'
import { errorMessage } from './errors'

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

async function authenticate(
  path: string,
  body: Record<string, string>,
  fallback: string
): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>(path, body)
    // localStorage keeps the demo simple; an httpOnly cookie would keep the
    // token out of reach of injected scripts.
    if (typeof window !== 'undefined' && response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new AuthenticationError(errorMessage(error, fallback), error.response?.status)
    }
    throw error
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  if (!email || !password) {
    throw new AuthenticationError('Email and password are required')
  }
  return authenticate(
    '/api/auth/login',
    { email: email.trim().toLowerCase(), password },
    'Login failed. Please check your credentials.'
  )
}

export async function signup(
  email: string,
  password: string,
  name: string
): Promise<LoginResponse> {
  if (!email || !password || !name) {
    throw new AuthenticationError('Email, password, and name are required')
  }
  if (password.length < 6) {
    throw new AuthenticationError('Password must be at least 6 characters')
  }
  return authenticate(
    '/api/auth/signup',
    { email: email.trim().toLowerCase(), password, name: name.trim() },
    'Signup failed. Please try again.'
  )
}

/** Forget the stored token. Callers also clear the Redux session, which makes
 * ProtectedRoute send the user to /login. */
export function clearStoredToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
  }
}
