import type { Metadata } from 'next'
import '../styles/globals.css'
import { ReduxProvider } from '@/components/Providers/ReduxProvider'
import { AuthInitializer } from '@/components/Auth/AuthInitializer'

export const metadata: Metadata = {
  title: 'AI Chatbot - Appointment Booking',
  description: 'A full-stack appointment conversation prototype with a separate Python scheduling service',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ReduxProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </ReduxProvider>
      </body>
    </html>
  )
}

