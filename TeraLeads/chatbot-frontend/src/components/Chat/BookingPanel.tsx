'use client'

import type { Booking } from '@/state/slices/chatSlice'
import { AppointmentConfirmation } from './AppointmentConfirmation'

interface BookingPanelProps {
  booking: Booking | null
  busy: boolean
  onSend: (text: string) => void
}

const FIELD_LABELS: Record<string, string> = {
  service_type: 'Service',
  date: 'Date',
  time: 'Time',
}

/** What the assistant knows so far, and the next step it is waiting on. */
export function BookingPanel({ booking, busy, onSend }: BookingPanelProps) {
  if (!booking) {
    return (
      <p className="text-sm text-muted">
        Details appear here as you give them: the service, a date, and a time between 09:00 and
        17:00.
      </p>
    )
  }

  if (booking.appointment && (booking.status === 'ready_to_book' || booking.status === 'booked')) {
    return (
      <AppointmentConfirmation
        appointment={booking.appointment}
        booked={booking.status === 'booked'}
        onConfirm={booking.status === 'ready_to_book' && !busy ? () => onSend('yes') : undefined}
      />
    )
  }

  return (
    <div className="space-y-4">
      {booking.missingFields.length > 0 && (
        <div>
          <p className="text-sm font-bold">Still needed</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {booking.missingFields.map((field) => (
              <li
                key={field}
                className="rounded-full border border-amber/50 bg-amber-soft px-3 py-1 text-sm text-amber"
              >
                {FIELD_LABELS[field] ?? field}
              </li>
            ))}
          </ul>
        </div>
      )}
      {booking.alternatives.length > 0 && (
        <div>
          <p className="text-sm font-bold">Open times that day</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {booking.alternatives.map((slot) => (
              <li key={slot}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onSend(`at ${slot}`)}
                  className="min-h-touch rounded-md border border-spruce px-4 font-bold text-spruce hover:bg-spruce-soft disabled:opacity-60"
                >
                  {slot}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
