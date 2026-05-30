/**
 * Authentication API Tests
 *
 * Tests for authentication functions including login and signup.
 */

import { login, signup, logout, AuthenticationError } from '@/api/auth'
import { apiClient } from '@/api/client'
import { AxiosError } from 'axios'

// Mock the API client
jest.mock('@/api/client')

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
          },
        },
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await login('test@example.com', 'password123')

      expect(result.token).toBe('test-token')
      expect(result.user.email).toBe('test@example.com')
      expect(result.user.name).toBe('Test User')
    })

    it('should throw AuthenticationError on invalid credentials', async () => {
      const mockError = new AxiosError(
        'Request failed',
        '401',
        undefined,
        undefined,
        {
          status: 401,
          data: { error: 'Invalid credentials' },
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        }
      )

      ;(apiClient.post as jest.Mock).mockRejectedValue(mockError)

      await expect(login('test@example.com', 'wrong')).rejects.toThrow(
        AuthenticationError
      )
    })

    it('should validate email and password are provided', async () => {
      await expect(login('', 'password')).rejects.toThrow(
        'Email and password are required'
      )
      await expect(login('email@example.com', '')).rejects.toThrow(
        'Email and password are required'
      )
    })
  })

  describe('signup', () => {
    it('should successfully signup with valid data', async () => {
      const mockResponse = {
        data: {
          token: 'test-token',
          user: {
            id: '1',
            email: 'new@example.com',
            name: 'New User',
          },
        },
      }

      ;(apiClient.post as jest.Mock).mockResolvedValue(mockResponse)

      const result = await signup('new@example.com', 'password123', 'New User')

      expect(result.token).toBe('test-token')
    })

    it('should validate password length', async () => {
      await expect(
        signup('test@example.com', 'short', 'Test User')
      ).rejects.toThrow('Password must be at least 6 characters')
    })
  })

  describe('logout', () => {
    it('should redirect to login', () => {
      logout()
      expect(window.location.href).toBe('/login')
    })
  })
})
