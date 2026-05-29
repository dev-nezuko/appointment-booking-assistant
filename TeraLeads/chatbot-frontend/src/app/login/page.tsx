'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LoginForm } from '@/components/Auth/LoginForm'
import { SignupForm } from '@/components/Auth/SignupForm'
import { useAppSelector } from '@/hooks/useAppSelector'
import { Brand } from '@/components/UI/Brand'

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
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center px-4 py-5 sm:px-6">
        <Brand />
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <h1 className="font-display text-3xl sm:text-4xl">Sign in to book</h1>
        <p className="mt-2 text-muted">
          Use an existing account, or create one. Your bookings are kept under your account.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <LoginForm />
          <SignupForm />
        </div>
        <p className="mt-8 text-sm">
          <Link href="/" className="text-spruce underline underline-offset-2">
            Back to home
          </Link>
        </p>
      </main>
    </div>
  )
}
