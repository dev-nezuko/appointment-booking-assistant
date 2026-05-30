import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/globals.css'
import { ReduxProvider } from '@/components/Providers/ReduxProvider'
import { AuthInitializer } from '@/components/Auth/AuthInitializer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Chatbot - Appointment Booking',
  description: 'AI-powered chatbot for appointment scheduling',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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

