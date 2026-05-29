'use client'

import type { AppointmentInfo } from '@/state/slices/chatSlice'

interface AppointmentConfirmationProps {
  appointment: AppointmentInfo
  booked?: boolean
  onConfirm?: () => void
}

function readableDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** The appointment slip: what will be booked, or what has been. */
export function AppointmentConfirmation({
  appointment,
  booked = false,
  onConfirm,
}: AppointmentConfirmationProps) {
  return (
    <section
      aria-label={booked ? 'Booked appointment' : 'Appointment to confirm'}
      className={`rounded-xl border-2 border-dashed p-4 ${
        booked ? 'border-spruce bg-spruce-soft' : 'border-amber/60 bg-amber-soft'
      }`}
    >
      <p
        className={`text-xs font-bold uppercase tracking-wider ${booked ? 'text-spruce' : 'text-amber'}`}
      >
        {booked ? 'Booked' : 'Ready to book'}
        {booked && appointment.id !== undefined && ` · reference #${appointment.id}`}
      </p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {appointment.type && (
          <>
            <dt className="text-muted">Service</dt>
            <dd className="font-bold">{appointment.type}</dd>
          </>
        )}
        <dt className="text-muted">Date</dt>
        <dd className="font-bold">
          <time dateTime={appointment.date}>{readableDate(appointment.date)}</time>
        </dd>
        <dt className="text-muted">Time</dt>
        <dd className="font-bold">{appointment.time}</dd>
      </dl>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 min-h-touch w-full rounded-md bg-spruce px-4 font-bold text-white hover:bg-spruce-dark"
        >
          Confirm booking
        </button>
      )}
    </section>
  )
}
