/**
 * Authentication API Functions
 * 
 * Handles user authentication operations including login, signup, and logout.
 * All functions include proper error handling and token management.
 */

import { apiClient } from './client'
import { AxiosError } from 'axios'

/**
 * Response structure for authentication operations
 */
export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
  }
}

/**
 * Custom error class for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'AuthenticationError'
  }
}

/**
 * Authenticates a user with email and password
 * 
 * @param email - User's email address
 * @param password - User's password
 * @returns Promise resolving to LoginResponse with token and user data
 * @throws {AuthenticationError} If authentication fails
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await login('user@example.com', 'password123')
 *   console.log('Logged in as:', response.user.name)
 * } catch (error) {
 *   console.error('Login failed:', error.message)
 * }
 * ```
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  try {
    // Validate inputs
    if (!email || !password) {
      throw new AuthenticationError('Email and password are required')
    }

    const response = await apiClient.post<LoginResponse>('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    })

    // Store token securely (consider using httpOnly cookies in production)
    if (typeof window !== 'undefined' && response.data.token) {
      localStorage.setItem('token', response.data.token)
    }

    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status
      const message =
        error.response?.data?.error || 'Login failed. Please check your credentials.'
      throw new AuthenticationError(message, statusCode)
    }
    throw error
  }
}

/**
 * Registers a new user account
 * 
 * @param email - User's email address (must be unique)
 * @param password - User's password (minimum 6 characters)
 * @param name - User's full name
 * @returns Promise resolving to LoginResponse with token and user data
 * @throws {AuthenticationError} If registration fails
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await signup('newuser@example.com', 'password123', 'John Doe')
 *   console.log('Account created for:', response.user.name)
 * } catch (error) {
 *   console.error('Signup failed:', error.message)
 * }
 * ```
 */
export async function signup(
  email: string,
  password: string,
  name: string
): Promise<LoginResponse> {
  try {
    // Validate inputs
    if (!email || !password || !name) {
      throw new AuthenticationError('Email, password, and name are required')
    }

    if (password.length < 6) {
      throw new AuthenticationError('Password must be at least 6 characters')
    }

    const response = await apiClient.post<LoginResponse>('/api/auth/signup', {
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    })

    // Store token securely
    if (typeof window !== 'undefined' && response.data.token) {
      localStorage.setItem('token', response.data.token)
    }

    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status
      const message =
        error.response?.data?.error || 'Signup failed. Please try again.'
      throw new AuthenticationError(message, statusCode)
    }
    throw error
  }
}

/**
 * Logs out the current user by clearing the authentication token
 * 
 * Redirects to the login page after clearing the token.
 * Safe to call even if no user is logged in.
 * 
 * @example
 * ```typescript
 * logout() // Clears token and redirects to login
 * ```
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    // Redirect to login page
    window.location.href = '/login'
  }
}

