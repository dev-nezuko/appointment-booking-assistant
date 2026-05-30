/**
 * JWT Token Utilities
 * 
 * Provides helper functions for managing JWT tokens in localStorage.
 * All functions are safe to call on the server side (return null/do nothing).
 */

/**
 * Decoded JWT token payload structure
 */
export interface DecodedToken {
  id?: string
  userId?: string
  email?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

/**
 * Retrieves the authentication token from localStorage
 * 
 * @returns The JWT token string, or null if not found or on server side
 * 
 * @example
 * ```typescript
 * const token = getToken()
 * if (token) {
 *   // Use token for authenticated requests
 * }
 * ```
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('token')
  } catch (error) {
    console.error('Error reading token from localStorage:', error)
    return null
  }
}

/**
 * Stores the authentication token in localStorage
 * 
 * @param token - JWT token string to store
 * 
 * @example
 * ```typescript
 * setToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
 * ```
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token provided')
    }
    localStorage.setItem('token', token)
  } catch (error) {
    console.error('Error storing token in localStorage:', error)
  }
}

/**
 * Removes the authentication token from localStorage
 * 
 * Safe to call even if no token exists. Does nothing on server side.
 * 
 * @example
 * ```typescript
 * removeToken() // Clears the stored token
 * ```
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('token')
  } catch (error) {
    console.error('Error removing token from localStorage:', error)
  }
}

/**
 * Decodes a JWT token without verification
 * 
 * Note: This function only decodes the token, it does NOT verify the signature.
 * For production use, tokens should be verified on the server side.
 * 
 * @param token - JWT token string to decode
 * @returns Decoded token payload, or null if decoding fails
 * 
 * @example
 * ```typescript
 * const decoded = decodeToken(token)
 * if (decoded && decoded.exp && decoded.exp > Date.now() / 1000) {
 *   console.log('Token is valid')
 * }
 * ```
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    if (!token || typeof token !== 'string') {
      return null
    }

    // JWT has three parts separated by dots
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (second part)
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )

    return JSON.parse(jsonPayload) as DecodedToken
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

/**
 * Checks if a token is expired
 * 
 * @param token - JWT token string to check
 * @returns True if token is expired or invalid, false otherwise
 * 
 * @example
 * ```typescript
 * if (isTokenExpired(token)) {
 *   // Token needs to be refreshed
 * }
 * ```
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded || !decoded.exp) {
    return true
  }

  // exp is in seconds, Date.now() is in milliseconds
  return decoded.exp < Date.now() / 1000
}

