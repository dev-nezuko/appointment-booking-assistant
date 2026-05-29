'use client'

import type { AppointmentInfo } from '@/state/slices/chatSlice'

interface AppointmentConfirmationProps {
  appointment: AppointmentInfo
  onConfirm?: () => void
  onCancel?: () => void
}

export function AppointmentConfirmation({
  appointment,
  onConfirm,
  onCancel,
}: AppointmentConfirmationProps) {
  return (
    <div
      className="rounded-lg border border-green-200 bg-green-50 p-4 my-2"
      role="region"
      aria-label="Appointment confirmation"
    >
      <h3 className="font-semibold text-green-800 mb-2">Appointment Details</h3>
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
            <dt className="inline font-medium">Type: </dt>
            <dd className="inline">{appointment.type}</dd>
          </div>
        )}
      </dl>
      {(onConfirm || onCancel) && (
        <div className="flex gap-2 mt-4">
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Confirm
            </button>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-green-600 text-green-600 rounded hover:bg-green-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}
