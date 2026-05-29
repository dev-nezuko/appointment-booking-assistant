const express = require('express')
const authRoutes = require('./auth.routes')
const chatbotRoutes = require('./chatbot.routes')
const appointmentRoutes = require('./appointment.routes')

const router = express.Router()

router.use('/auth', authRoutes)
router.use('/chatbot', chatbotRoutes)
router.use('/appointments', appointmentRoutes)

module.exports = router
