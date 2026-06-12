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
    <main id="main-content" className="booking-home" role="main">
      <header className="booking-nav"><span>TeraLeads</span><span className="prototype-tag">Scheduling prototype</span></header>
      <section className="booking-hero">
        <div><p className="booking-eyebrow">CONVERSATION → APPOINTMENT</p>
          <h1>A friendlier way to<br />start a booking.</h1>
          <p className="booking-intro">A full-stack experiment in collecting appointment details through conversation, with a separate Python service for the scheduling flow.</p>
          <Link href="/login" className="booking-cta">Sign in to the prototype →</Link>
          <p className="booking-disclaimer">Local demo · Use synthetic information only</p>
        </div>
        <aside className="booking-flow" aria-label="Intended scheduling workflow">
          <span className="booking-eyebrow">INTENDED WORKFLOW</span>
          <ol><li><strong>Describe your request</strong><p>Collect a date, time, and service.</p></li><li><strong>Check the details</strong><p>Review missing fields and availability.</p></li><li><strong>Confirm the appointment</strong><p>Persist and synchronize the booking.</p></li></ol>
        </aside>
      </section>
      <section className="booking-status"><h2>What works together today?</h2>
        <p>The UI and Express API include account and chat-session scaffolding. The Python service implements a separate appointment flow. The Express chat handler currently returns a placeholder; the end-to-end AI handoff and WebSocket server are unfinished.</p>
        <p>This is an engineering prototype, not a live appointment service.</p>
      </section>
      <footer className="booking-footer">Next.js · Express · PostgreSQL · FastAPI / LangChain</footer>
    </main>
  )
}
