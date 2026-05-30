'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/hooks/useAppSelector'

export default function Home() {
  const router = useRouter()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/chat')
    }
  }, [isAuthenticated, router])

  if (isAuthenticated) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <p>Redirecting to chat...</p>
      </main>
    )
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24" role="main">
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        AI Chatbot - Appointment Booking
      </h1>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Login
        </Link>
        <Link
          href="/chat"
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Chat
        </Link>
      </div>
    </main>
  )
}
