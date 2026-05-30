const validationMiddleware = require('../../middlewares/validation.middleware')

const mockReq = (body = {}) => ({ body: { ...body } })
const mockRes = () => {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}
const mockNext = jest.fn()

describe('Validation Middleware', () => {
  beforeEach(() => {
    mockNext.mockClear()
  })

  describe('validateSignup', () => {
    it('should pass with valid data', () => {
      const req = mockReq({ email: 'a@b.com', password: 'pass123', name: 'John' })
      validationMiddleware.validateSignup(req, mockRes(), mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject missing fields', () => {
      const res = mockRes()
      validationMiddleware.validateSignup(mockReq({ email: 'a@b.com' }), res, mockNext)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should reject invalid email', () => {
      const res = mockRes()
      validationMiddleware.validateSignup(
        mockReq({ email: 'invalid', password: 'pass123', name: 'John' }),
        res,
        mockNext
      )
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject short password', () => {
      const res = mockRes()
      validationMiddleware.validateSignup(
        mockReq({ email: 'a@b.com', password: '12345', name: 'John' }),
        res,
        mockNext
      )
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validateLogin', () => {
    it('should pass with valid data', () => {
      const req = mockReq({ email: 'a@b.com', password: 'pass123' })
      validationMiddleware.validateLogin(req, mockRes(), mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject missing credentials', () => {
      const res = mockRes()
      validationMiddleware.validateLogin(mockReq({}), res, mockNext)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validateAppointment', () => {
    it('should pass with valid date and time', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      const dateStr = futureDate.toISOString().split('T')[0]
      const req = mockReq({ date: dateStr, time: '10:00:00' })
      const res = mockRes()
      validationMiddleware.validateAppointment(req, res, mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject missing date or time', () => {
      const res = mockRes()
      validationMiddleware.validateAppointment(mockReq({ date: '2025-12-31' }), res, mockNext)
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject invalid date', () => {
      const res = mockRes()
      validationMiddleware.validateAppointment(
        mockReq({ date: 'invalid', time: '10:00:00' }),
        res,
        mockNext
      )
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject past date', () => {
      const res = mockRes()
      validationMiddleware.validateAppointment(
        mockReq({ date: '2020-01-01', time: '10:00:00' }),
        res,
        mockNext
      )
      expect(res.status).toHaveBeenCalledWith(400)
    })

    it('should reject invalid time format', () => {
      const res = mockRes()
      validationMiddleware.validateAppointment(
        mockReq({ date: '2025-12-31', time: '25:00' }),
        res,
        mockNext
      )
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('validateAppointmentUpdate', () => {
    it('should pass with valid optional fields', () => {
      const req = mockReq({ status: 'confirmed' })
      validationMiddleware.validateAppointmentUpdate(req, mockRes(), mockNext)
      expect(mockNext).toHaveBeenCalled()
    })

    it('should reject invalid status', () => {
      const res = mockRes()
      validationMiddleware.validateAppointmentUpdate(mockReq({ status: 'invalid' }), res, mockNext)
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })
})
