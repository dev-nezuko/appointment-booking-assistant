'use client'

import Link from 'next/link'
import { ChatInterface } from '@/components/Chat/ChatInterface'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { useAppSelector } from '@/hooks/useAppSelector'
import { logout } from '@/api/auth'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { logout as logoutRedux } from '@/state/slices/authSlice'

export default function ChatPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const handleLogout = () => {
    dispatch(logoutRedux())
    logout()
  }

  return (
    <ProtectedRoute>
      <div id="main-content" className="flex min-h-screen flex-col p-4 md:p-8" role="main">
        <header className="flex items-center justify-between mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Chat with AI Assistant</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:inline">{user.email}</span>
            )}
            <Link
              href="/"
              className="text-sm text-blue-500 hover:underline"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50"
              aria-label="Log out"
            >
              Logout
            </button>
          </div>
        </header>
        <ChatInterface />
      </div>
    </ProtectedRoute>
  )
}

