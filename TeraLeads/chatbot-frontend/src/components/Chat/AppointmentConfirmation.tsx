'use client'

import type { AppointmentInfo } from '@/state/slices/chatSlice'

interface AppointmentConfirmationProps {
  appointment: AppointmentInfo
  booked?: boolean
  onConfirm?: () => void
}

export function AppointmentConfirmation({
  appointment,
  booked = false,
  onConfirm,
}: AppointmentConfirmationProps) {
  return (
    <section
      className="rounded-lg border border-green-200 bg-green-50 p-4 my-2"
      aria-label={booked ? 'Booked appointment' : 'Appointment to confirm'}
    >
      <h3 className="font-semibold text-green-800 mb-2">
        {booked ? 'Booked' : 'Ready to book'}
        {booked && appointment.id !== undefined && ` · reference #${appointment.id}`}
      </h3>
      <dl className="space-y-1 text-sm text-green-700">
        <div>
          <dt className="inline font-medium">Date: </dt>
          <dd className="inline">{appointment.date}</dd>
        </div>
        <div>
          <dt className="inline font-medium">Time: </dt>
          <dd className="inline">{appointment.time}</dd>
        </div>
        {appointment.type && (
          <div>
            <dt className="inline font-medium">Service: </dt>
            <dd className="inline">{appointment.type}</dd>
          </div>
        )}
      </dl>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Confirm booking
        </button>
      )}
    </section>
  )
}
