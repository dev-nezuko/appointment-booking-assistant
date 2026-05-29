'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { useAppSelector } from '@/hooks/useAppSelector'
import { setCredentials } from '@/state/slices/authSlice'
import { getToken, decodeToken, isTokenExpired } from '@/utils/jwt'

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (isAuthenticated) return

    const token = getToken()
    if (!token) return

    if (isTokenExpired(token)) {
      localStorage.removeItem('token')
      return
    }

    // The backend signs `id`; `userId` is accepted for tokens issued before
    // the claims were unified.
    const decoded = decodeToken(token)
    const userId = decoded?.id ?? decoded?.userId
    if (decoded && userId && decoded.email) {
      dispatch(
        setCredentials({
          token,
          user: {
            id: String(userId),
            email: String(decoded.email),
            name: String(decoded.name || decoded.email),
          },
        })
      )
    } else {
      localStorage.removeItem('token')
    }
  }, [dispatch, isAuthenticated])

  return <>{children}</>
}
