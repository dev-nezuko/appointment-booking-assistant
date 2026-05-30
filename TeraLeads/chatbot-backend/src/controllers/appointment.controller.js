const appointmentService = require('../services/appointment.service')

/**
 * @openapi
 * /api/appointments:
 *   post:
 *     summary: Create appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, time]
 *             properties:
 *               date: { type: string, format: date }
 *               time: { type: string }
 *               duration_minutes: { type: integer, default: 60 }
 *               service_type: { type: string }
 *               notes: { type: string }
 *               business_id: { type: integer }
 *     responses:
 *       201: { description: Appointment created }
 *       400: { description: Invalid input }
 *       401: { description: Unauthorized }
 */
const create = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { date, time, duration_minutes, service_type, notes, business_id } = req.body
    const appointment = await appointmentService.createAppointment(
      userId,
      { date, time, duration_minutes, service_type, notes },
      business_id
    )
    res.status(201).json(appointment)
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/appointments:
 *   get:
 *     summary: List user appointments
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: business_id
 *         schema: { type: integer }
 *     responses:
 *       200: { description: List of appointments }
 *       401: { description: Unauthorized }
 */
const list = async (req, res, next) => {
  try {
    const userId = req.user.id
    const { business_id } = req.query
    const appointments = await appointmentService.getAppointmentsByUser(userId, business_id)
    res.json(appointments)
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Appointment details }
 *       403: { description: Forbidden }
 *       404: { description: Not found }
 */
const getById = async (req, res, next) => {
  try {
    const userId = req.user.id
    const appointmentId = parseInt(req.params.id, 10)
    const appointment = await appointmentService.getAppointmentById(appointmentId, userId)
    res.json(appointment)
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/appointments/{id}:
 *   put:
 *     summary: Update appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date: { type: string }
 *               time: { type: string }
 *               duration_minutes: { type: integer }
 *               service_type: { type: string }
 *               status: { type: string, enum: [pending, confirmed, cancelled, completed] }
 *               notes: { type: string }
 *     responses:
 *       200: { description: Updated appointment }
 *       400: { description: Invalid input }
 *       403: { description: Forbidden }
 */
const update = async (req, res, next) => {
  try {
    const userId = req.user.id
    const appointmentId = parseInt(req.params.id, 10)
    const { date, time, duration_minutes, service_type, status, notes } = req.body
    const updateData = {}
    if (date !== undefined) {
      updateData.date = date
    }
    if (time !== undefined) {
      updateData.time = time
    }
    if (duration_minutes !== undefined) {
      updateData.duration_minutes = duration_minutes
    }
    if (service_type !== undefined) {
      updateData.service_type = service_type
    }
    if (status !== undefined) {
      updateData.status = status
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const appointment = await appointmentService.updateAppointment(
      appointmentId,
      userId,
      updateData
    )
    res.json(appointment)
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/appointments/{id}:
 *   delete:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Appointment cancelled }
 *       400: { description: Cannot cancel }
 *       403: { description: Forbidden }
 */
const cancel = async (req, res, next) => {
  try {
    const userId = req.user.id
    const appointmentId = parseInt(req.params.id, 10)
    const appointment = await appointmentService.cancelAppointment(appointmentId, userId)
    res.json(appointment)
  } catch (error) {
    next(error)
  }
}

/**
 * @openapi
 * /api/appointments/availability:
 *   get:
 *     summary: Get available time slots
 *     tags: [Appointments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: duration_minutes
 *         schema: { type: integer, default: 60 }
 *     responses:
 *       200: { description: List of available slots }
 */
const getAvailability = async (req, res, next) => {
  try {
    const { date, duration_minutes } = req.query
    const slots = await appointmentService.getAvailableSlots(date, duration_minutes)
    res.json({ date, slots })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  create,
  list,
  getById,
  update,
  cancel,
  getAvailability,
}
