const express = require('express')
const appointmentController = require('../controllers/appointment.controller')
const authMiddleware = require('../middlewares/auth.middleware')
const validationMiddleware = require('../middlewares/validation.middleware')
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware')

const router = express.Router()

router.use(authMiddleware.verifyToken)
router.use(rateLimitMiddleware.generalApiLimit)

router.post(
  '/',
  rateLimitMiddleware.appointmentCreateLimit,
  validationMiddleware.validateAppointment,
  appointmentController.create
)

router.get('/', appointmentController.list)

router.get('/availability', appointmentController.getAvailability)

router.get('/:id', appointmentController.getById)

router.put('/:id', validationMiddleware.validateAppointmentUpdate, appointmentController.update)

router.delete('/:id', appointmentController.cancel)

module.exports = router
