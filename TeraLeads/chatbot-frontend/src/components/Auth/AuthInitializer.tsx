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

    const decoded = decodeToken(token)
    if (decoded && decoded.userId && decoded.email) {
      dispatch(
        setCredentials({
          token,
          user: {
            id: String(decoded.userId),
            email: String(decoded.email),
            name: String(decoded.name || decoded.email),
          },
        })
      )
    }
  }, [dispatch, isAuthenticated])

  return <>{children}</>
}
