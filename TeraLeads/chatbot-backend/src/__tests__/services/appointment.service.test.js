const appointmentService = require('../../services/appointment.service')
const Appointment = require('../../models/Appointment')

jest.mock('../../models/Appointment')

describe('Appointment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createAppointment', () => {
    it('should create appointment when slot is available', async () => {
      Appointment.findByDateAndStatus.mockResolvedValue([])
      Appointment.create.mockResolvedValue({
        id: 1,
        user_id: 1,
        date: '2025-02-15',
        time: '10:00:00',
        service_type: 'Consultation',
        status: 'pending',
      })

      const result = await appointmentService.createAppointment(1, {
        date: '2025-02-15',
        time: '10:00:00',
        service_type: 'Consultation',
      })

      expect(result.id).toBe(1)
      expect(Appointment.create).toHaveBeenCalled()
    })

    it('should throw when slot is not available', async () => {
      Appointment.findByDateAndStatus.mockResolvedValue([
        { id: 1, time: '10:00:00', duration_minutes: 60 },
      ])

      await expect(
        appointmentService.createAppointment(1, {
          date: '2025-02-15',
          time: '10:00:00',
          service_type: 'Consultation',
        })
      ).rejects.toThrow('Time slot is not available')
    })
  })

  describe('getAppointmentById', () => {
    it('should return appointment when user owns it', async () => {
      Appointment.findById.mockResolvedValue({ id: 1, user_id: 1 })

      const result = await appointmentService.getAppointmentById(1, 1)
      expect(result.user_id).toBe(1)
    })

    it('should throw 404 when appointment not found', async () => {
      Appointment.findById.mockResolvedValue(null)

      await expect(appointmentService.getAppointmentById(999, 1)).rejects.toThrow(
        'Appointment not found'
      )
    })

    it('should throw 403 when user does not own appointment', async () => {
      Appointment.findById.mockResolvedValue({ id: 1, user_id: 2 })

      await expect(appointmentService.getAppointmentById(1, 1)).rejects.toThrow(
        'Unauthorized to access this appointment'
      )
    })
  })

  describe('cancelAppointment', () => {
    it('should cancel pending appointment', async () => {
      Appointment.findById.mockResolvedValue({ id: 1, user_id: 1, status: 'pending' })
      Appointment.update.mockResolvedValue({ id: 1, status: 'cancelled' })

      const result = await appointmentService.cancelAppointment(1, 1)
      expect(Appointment.update).toHaveBeenCalledWith(1, { status: 'cancelled' })
      expect(result.status).toBe('cancelled')
    })

    it('should throw when appointment is already cancelled', async () => {
      Appointment.findById.mockResolvedValue({ id: 1, user_id: 1, status: 'cancelled' })

      await expect(appointmentService.cancelAppointment(1, 1)).rejects.toThrow(
        'Only pending or confirmed appointments can be cancelled'
      )
    })
  })

  describe('checkAvailability', () => {
    it('should return true when no conflicts', async () => {
      Appointment.findByDateAndStatus.mockResolvedValue([])

      const result = await appointmentService.checkAvailability('2025-02-15', '10:00:00')
      expect(result).toBe(true)
    })

    it('should return false when slot overlaps', async () => {
      Appointment.findByDateAndStatus.mockResolvedValue([
        { id: 1, time: '10:00:00', duration_minutes: 60 },
      ])

      const result = await appointmentService.checkAvailability('2025-02-15', '10:00:00')
      expect(result).toBe(false)
    })
  })
})
