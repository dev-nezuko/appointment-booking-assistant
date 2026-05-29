'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signup, AuthenticationError } from '@/api/auth'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setCredentials } from '@/state/slices/authSlice'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { ErrorMessage } from '@/components/UI/ErrorMessage'
import { AuthField } from './AuthField'

export function SignupForm() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const response = await signup(email, password, name)
      dispatch(setCredentials({ user: response.user, token: response.token }))
      router.push('/chat')
    } catch (err) {
      setError(
        err instanceof AuthenticationError ? err.message : 'Sign-up failed. Please try again.'
      )
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-labelledby="signup-heading"
      className="space-y-4 rounded-xl border border-line bg-card p-6 shadow-sm"
    >
      <h2 id="signup-heading" className="font-display text-2xl">
        Create an account
      </h2>
      {error && <ErrorMessage message={error} />}
      <AuthField
        id="signup-name"
        label="Full name"
        type="text"
        value={name}
        onChange={setName}
        autoComplete="name"
        invalid={!!error}
      />
      <AuthField
        id="signup-email"
        label="Email address"
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        invalid={!!error}
      />
      <AuthField
        id="signup-password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        invalid={!!error}
        hint="At least 6 characters."
      />
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="flex min-h-touch w-full items-center justify-center rounded-md border-2 border-spruce px-4 font-bold text-spruce hover:bg-spruce-soft disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? <LoadingSpinner size="sm" label="Creating account" /> : 'Create account'}
      </button>
    </form>
  )
}
