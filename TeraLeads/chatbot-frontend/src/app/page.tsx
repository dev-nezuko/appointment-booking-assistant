'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAppSelector } from '@/hooks/useAppSelector'
import { Brand } from '@/components/UI/Brand'

const SAMPLE = [
  { who: 'You', text: "I'd like a check-up tomorrow" },
  { who: 'Front Desk', text: 'I have a Check-up on 2026-11-08. Could you tell me a time?' },
  { who: 'You', text: '2pm please' },
  {
    who: 'Front Desk',
    text: 'Great! I have you scheduled for 2026-11-08 at 14:00. Is this correct?',
  },
]

export default function Home() {
  const router = useRouter()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/chat')
    }
  }, [isAuthenticated, router])

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Brand />
        <Link
          href="/login"
          className="rounded-md px-3 py-2 text-sm font-bold text-spruce hover:bg-spruce-soft"
        >
          Sign in
        </Link>
      </header>

      <main
        id="main-content"
        className="mx-auto grid max-w-5xl gap-10 px-4 pb-16 pt-6 sm:px-6 md:grid-cols-[1.1fr_1fr] md:pt-14"
      >
        <section>
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-amber">
            Appointment booking assistant
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">
            Say the service and the time. It finds the slot.
          </h1>
          <p className="mt-5 max-w-prose text-lg text-muted">
            Front Desk asks for whatever is missing, checks the calendar between 09:00 and 17:00,
            offers open times when yours is taken, and books only after you confirm the summary it
            reads back.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex min-h-touch items-center rounded-md bg-spruce px-5 font-bold text-white hover:bg-spruce-dark"
            >
              Create an account
            </Link>
            <Link
              href="/chat"
              className="inline-flex min-h-touch items-center rounded-md border border-spruce px-5 font-bold text-spruce hover:bg-spruce-soft"
            >
              Open the chat
            </Link>
          </div>
        </section>

        <figure className="rounded-xl border border-line bg-card p-5 shadow-sm">
          <figcaption className="mb-4 text-sm text-muted">A typical exchange</figcaption>
          <ol className="space-y-3">
            {SAMPLE.map((line, i) => (
              <li key={i} className={line.who === 'You' ? 'text-right' : ''}>
                <span className="block text-xs font-bold text-muted">{line.who}</span>
                <span
                  className={`mt-1 inline-block rounded-lg px-3 py-2 text-left ${
                    line.who === 'You' ? 'bg-spruce text-white' : 'border border-line bg-paper'
                  }`}
                >
                  {line.text}
                </span>
              </li>
            ))}
          </ol>
        </figure>
      </main>
    </div>
  )
}
