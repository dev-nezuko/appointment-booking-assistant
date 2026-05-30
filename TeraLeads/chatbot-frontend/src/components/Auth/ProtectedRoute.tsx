'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/hooks/useAppSelector'
import { getToken, isTokenExpired } from '@/utils/jwt'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const token = useAppSelector((state) => state.auth.token)

  useEffect(() => {
    const storedToken = getToken()
    if (isAuthenticated || token) return
    if (storedToken && !isTokenExpired(storedToken)) return
    router.replace('/login')
  }, [isAuthenticated, token, router])

  if (isAuthenticated || token) {
    return <>{children}</>
  }

  const storedToken = getToken()
  if (storedToken && !isTokenExpired(storedToken)) {
    return (
      <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <p>Redirecting to login...</p>
    </div>
  )
}
