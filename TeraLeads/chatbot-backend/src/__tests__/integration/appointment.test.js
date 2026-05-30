const request = require('supertest')
const jwt = require('../../utils/jwt')

jest.mock('../../services/appointment.service')
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}))

const app = require('../../app')
const appointmentService = require('../../services/appointment.service')

describe('Appointment API Integration', () => {
  let authToken

  beforeAll(() => {
    authToken = jwt.generateToken({ id: 1, email: 'test@example.com' })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/appointments', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .send({ date: '2025-12-31', time: '10:00:00', service_type: 'Consultation' })

      expect(res.status).toBe(401)
    })

    it('should create appointment when authenticated', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const dateStr = futureDate.toISOString().split('T')[0]

      appointmentService.createAppointment.mockResolvedValue({
        id: 1,
        user_id: 1,
        date: dateStr,
        time: '10:00:00',
        service_type: 'Consultation',
        status: 'pending',
      })

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ date: dateStr, time: '10:00:00', service_type: 'Consultation' })

      expect(res.status).toBe(201)
      expect(res.body.id).toBe(1)
      expect(res.body.status).toBe('pending')
    })

    it('should reject missing date or time', async () => {
      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ service_type: 'Consultation' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/appointments', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/appointments')
      expect(res.status).toBe(401)
    })

    it('should return list when authenticated', async () => {
      appointmentService.getAppointmentsByUser.mockResolvedValue([
        { id: 1, user_id: 1, date: '2025-12-31', time: '10:00:00' },
      ])

      const res = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
    })
  })

  describe('GET /api/appointments/:id', () => {
    it('should return appointment when owner', async () => {
      appointmentService.getAppointmentById.mockResolvedValue({
        id: 1,
        user_id: 1,
        date: '2025-12-31',
        time: '10:00:00',
      })

      const res = await request(app)
        .get('/api/appointments/1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(1)
    })
  })

  describe('DELETE /api/appointments/:id', () => {
    it('should cancel appointment when owner', async () => {
      appointmentService.cancelAppointment.mockResolvedValue({
        id: 1,
        status: 'cancelled',
      })

      const res = await request(app)
        .delete('/api/appointments/1')
        .set('Authorization', `Bearer ${authToken}`)

      expect(res.status).toBe(200)
      expect(res.body.status).toBe('cancelled')
    })
  })
})
