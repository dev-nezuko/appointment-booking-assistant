'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signup } from '@/api/auth'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { setCredentials } from '@/state/slices/authSlice'
import { AuthenticationError } from '@/api/auth'
import { LoadingSpinner } from '@/components/UI/LoadingSpinner'
import { ErrorMessage } from '@/components/UI/ErrorMessage'

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
      dispatch(
        setCredentials({
          user: response.user,
          token: response.token,
        })
      )
      router.push('/chat')
    } catch (err) {
      setError(
        err instanceof AuthenticationError
          ? err.message
          : 'Signup failed. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 border rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Sign Up</h2>
      {error && <ErrorMessage message={error} />}
      <div>
        <label htmlFor="signup-name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          id="signup-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          aria-label="Full name"
          aria-invalid={!!error}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="signup-email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email address"
          aria-invalid={!!error}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          aria-label="Password"
          aria-invalid={!!error}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        aria-busy={isLoading}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <LoadingSpinner size="sm" /> : 'Sign Up'}
      </button>
    </form>
  )
}

