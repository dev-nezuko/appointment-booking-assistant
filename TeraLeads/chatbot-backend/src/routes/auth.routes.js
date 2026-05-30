const express = require('express')
const authController = require('../controllers/auth.controller')
const validationMiddleware = require('../middlewares/validation.middleware')
const rateLimitMiddleware = require('../middlewares/rateLimit.middleware')

const router = express.Router()

router.post(
  '/signup',
  rateLimitMiddleware.authLimit,
  validationMiddleware.validateSignup,
  authController.signup
)
router.post(
  '/login',
  rateLimitMiddleware.authLimit,
  validationMiddleware.validateLogin,
  authController.login
)

module.exports = router
