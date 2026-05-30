/**
 * API Client Configuration
 * 
 * Centralized axios instance with interceptors for authentication
 * and error handling. All API requests should use this client.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

/**
 * Base URL for the backend API
 * Falls back to localhost if not set in environment variables
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Axios instance configured with base URL and default headers
 */
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
})

/**
 * Request interceptor to add authentication token to all requests
 * 
 * @param config - Axios request configuration
 * @returns Modified request configuration with auth header
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    // Log request error
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

/**
 * Response interceptor for centralized error handling
 * 
 * Handles:
 * - 401 Unauthorized: Clears token and redirects to login
 * - Network errors: Provides user-friendly error messages
 * - Server errors: Logs and propagates error details
 * 
 * @param response - Successful axios response
 * @param error - Axios error response
 * @returns Response or rejected promise with error
 */
apiClient.interceptors.response.use(
  (response) => {
    // Return successful responses as-is
    return response
  },
  (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }

    // Log error for debugging (avoid logging sensitive data)
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.message,
      })
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', 'No response from server')
    } else {
      // Error in request setup
      console.error('Request Error:', error.message)
    }

    return Promise.reject(error)
  }
)

