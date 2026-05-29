const Appointment = require('../models/Appointment')

class AppointmentError extends Error {
  constructor(message, statusCode = 400) {
    super(message)
    this.name = 'AppointmentError'
    this.statusCode = statusCode
  }
}

function parseTimeToMinutes(timeStr) {
  if (typeof timeStr === 'string') {
    const [h, m] = timeStr.split(':').map(Number)
    return (h || 0) * 60 + (m || 0)
  }
  return 0
}

function hasOverlap(start1, dur1, start2, dur2) {
  const end1 = start1 + dur1
  const end2 = start2 + dur2
  return start1 < end2 && start2 < end1
}

const createAppointment = async (userId, appointmentData, businessId = null) => {
  const { date, time, duration_minutes = 60, service_type, notes } = appointmentData

  const isAvailable = await checkAvailability(date, time, duration_minutes)
  if (!isAvailable) {
    throw new AppointmentError('Time slot is not available', 409)
  }

  const appointment = await Appointment.create({
    user_id: userId,
    business_id: businessId,
    date,
    time,
    duration_minutes,
    service_type,
    status: 'pending',
    notes,
  })
  return appointment
}

const getAppointmentsByUser = async (userId, businessId = null) => {
  return await Appointment.findByUserId(userId, businessId)
}

const getAppointmentById = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId)
  if (!appointment) {
    throw new AppointmentError('Appointment not found', 404)
  }
  if (appointment.user_id !== userId) {
    throw new AppointmentError('Unauthorized to access this appointment', 403)
  }
  return appointment
}

const updateAppointment = async (appointmentId, userId, updateData) => {
  const appointment = await getAppointmentById(appointmentId, userId)

  if (
    updateData.status &&
    !['pending', 'confirmed', 'cancelled', 'completed'].includes(updateData.status)
  ) {
    throw new AppointmentError('Invalid status', 400)
  }

  if (updateData.date || updateData.time || updateData.duration_minutes) {
    const date = updateData.date || appointment.date
    const time = updateData.time || appointment.time
    const duration = updateData.duration_minutes ?? appointment.duration_minutes

    const isAvailable = await checkAvailability(date, time, duration, appointmentId)
    if (!isAvailable) {
      throw new AppointmentError('Time slot is not available', 409)
    }
  }

  const updated = await Appointment.update(appointmentId, updateData)
  return updated || appointment
}

const cancelAppointment = async (appointmentId, userId) => {
  const appointment = await getAppointmentById(appointmentId, userId)

  if (!['pending', 'confirmed'].includes(appointment.status)) {
    throw new AppointmentError('Only pending or confirmed appointments can be cancelled', 400)
  }

  return await Appointment.update(appointmentId, { status: 'cancelled' })
}

const checkAvailability = async (date, time, durationMinutes = 60, excludeAppointmentId = null) => {
  const existing = await Appointment.findByDateAndStatus(date, ['pending', 'confirmed'])
  const newStart = parseTimeToMinutes(time)
  const newDur = Number(durationMinutes) || 60

  for (const apt of existing) {
    if (excludeAppointmentId && apt.id === excludeAppointmentId) {
      continue
    }

    const aptStart = parseTimeToMinutes(apt.time)
    const aptDur = Number(apt.duration_minutes) || 60

    if (hasOverlap(newStart, newDur, aptStart, aptDur)) {
      return false
    }
  }
  return true
}

const getAvailableSlots = async (date, durationMinutes = 60) => {
  const businessHoursStart = 9 * 60
  const businessHoursEnd = 17 * 60
  const slotDuration = Number(durationMinutes) || 60
  const existing = await Appointment.findByDateAndStatus(date, ['pending', 'confirmed'])

  const slots = []
  for (let start = businessHoursStart; start + slotDuration <= businessHoursEnd; start += 30) {
    const overlaps = existing.some((apt) => {
      const aptStart = parseTimeToMinutes(apt.time)
      const aptDur = Number(apt.duration_minutes) || 60
      return hasOverlap(start, slotDuration, aptStart, aptDur)
    })
    if (!overlaps) {
      const h = Math.floor(start / 60)
      const m = start % 60
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`)
    }
  }
  return slots
}

module.exports = {
  createAppointment,
  getAppointmentsByUser,
  getAppointmentById,
  updateAppointment,
  cancelAppointment,
  checkAvailability,
  getAvailableSlots,
  AppointmentError,
}
