import type { Metadata } from 'next'
import { Atkinson_Hyperlegible, Fraunces } from 'next/font/google'
import '../styles/globals.css'
import { ReduxProvider } from '@/components/Providers/ReduxProvider'
import { AuthInitializer } from '@/components/Auth/AuthInitializer'

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', weight: ['600'] })
const body = Atkinson_Hyperlegible({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Front Desk · Appointment booking assistant',
  description: 'Book an appointment by telling the assistant the service, day and time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans antialiased">
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
