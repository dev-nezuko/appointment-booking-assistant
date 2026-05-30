/**
 * Appointment API Functions
 *
 * Handles appointment booking operations with the backend.
 */

import { apiClient } from './client'
import { AxiosError } from 'axios'

export interface AppointmentData {
  date: string
  time: string
  type?: string
  notes?: string
}

export interface AppointmentResponse {
  id: string
  date: string
  time: string
  status: string
  message?: string
}

export class AppointmentError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message)
    this.name = 'AppointmentError'
  }
}

/**
 * Submits appointment booking data to the backend
 *
 * @param appointment - Appointment details
 * @returns Promise resolving to AppointmentResponse
 */
export async function createAppointment(
  appointment: AppointmentData
): Promise<AppointmentResponse> {
  try {
    const response = await apiClient.post<AppointmentResponse>(
      '/api/appointments',
      appointment
    )

    return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      const statusCode = error.response?.status
      const message =
        error.response?.data?.error ||
        'Failed to create appointment. Please try again.'
      throw new AppointmentError(message, statusCode)
    }
    throw error
  }
}
