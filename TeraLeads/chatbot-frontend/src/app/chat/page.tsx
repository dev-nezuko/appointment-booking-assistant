'use client'

import { ChatInterface } from '@/components/Chat/ChatInterface'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { useAppSelector } from '@/hooks/useAppSelector'
import { useAppDispatch } from '@/hooks/useAppDispatch'
import { clearStoredToken } from '@/api/auth'
import { logout } from '@/state/slices/authSlice'
import { clearChat } from '@/state/slices/chatSlice'
import { Brand } from '@/components/UI/Brand'

export default function ChatPage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const handleLogout = () => {
    clearStoredToken()
    dispatch(clearChat())
    dispatch(logout())
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col lg:h-screen">
        <header className="border-b border-line bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Brand />
            <div className="flex items-center gap-3">
              {user && (
                <span className="hidden text-sm text-muted sm:inline">
                  Signed in as <strong className="text-ink">{user.name || user.email}</strong>
                </span>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-touch rounded-md border border-line px-3 text-sm font-bold hover:border-danger hover:text-danger"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main
          id="main-content"
          className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6 lg:min-h-0"
        >
          <h1 className="sr-only">Book an appointment</h1>
          <ChatInterface />
        </main>
      </div>
    </ProtectedRoute>
  )
}
