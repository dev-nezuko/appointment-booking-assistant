/**
 * Reading the login token from localStorage. Decoding here is for display and
 * expiry checks only; the backend verifies the signature on every request.
 */

export interface DecodedToken {
  id?: number | string
  userId?: number | string
  email?: string
  name?: string
  exp?: number
  iat?: number
  [key: string]: unknown
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem('token')
  } catch {
    // Storage can be blocked (private mode, disabled cookies); treat as signed out.
    return null
  }
}

export function decodeToken(token: string): DecodedToken | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    // atob yields Latin-1; percent-encoding each byte lets decodeURIComponent
    // reassemble UTF-8 names correctly.
    const json = decodeURIComponent(
      Array.from(atob(base64), (c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')
    )
    return JSON.parse(json) as DecodedToken
  } catch {
    return null
  }
}

/** True when the token is unreadable, has no expiry, or has expired. */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded?.exp) return true
  return decoded.exp < Date.now() / 1000
}
