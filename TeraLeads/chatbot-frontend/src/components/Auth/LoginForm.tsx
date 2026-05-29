'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, AuthenticationError } from '@/api/auth'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setCredentials } from '@/state/slices/authSlice'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { ErrorMessage } from '@/components/UI/ErrorMessage'
import { AuthField } from './AuthField'

export function LoginForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await login(email, password)
      dispatch(setCredentials({ user: response.user, token: response.token }))
      router.push('/chat')
    } catch (err) {
      setError(
        err instanceof AuthenticationError
          ? err.message
          : 'Sign-in failed. Please check your credentials.'
      )
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="login-heading"
      className="space-y-4 rounded-xl border border-line bg-card p-6 shadow-sm"
    >
      <h2 id="login-heading" className="font-display text-2xl">
        Sign in
      </h2>
      {error && <ErrorMessage message={error} />}
      <AuthField
        id="email"
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        invalid={!!error}
      />
      <AuthField
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        invalid={!!error}
      />
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="flex min-h-touch w-full items-center justify-center rounded-md bg-spruce px-4 font-bold text-white hover:bg-spruce-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <LoadingSpinner size="sm" label="Signing in" /> : 'Sign in'}
      </button>
    </form>
  )
}
