'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SignupForm } from '@/components/Auth/SignupForm'
import { useAppSelector } from '@/hooks/useAppSelector'

export default function LoginPage() {
  const router = useRouter()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/chat')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return null
  }

  return (
    <div id="main-content" className="flex min-h-screen items-center justify-center p-4 md:p-24" role="main">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-2xl md:text-3xl font-bold text-center">Authentication</h1>
        <LoginForm />
        <SignupForm />
        <p className="text-center text-sm text-gray-600">
          <Link href="/" className="text-blue-500 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}

