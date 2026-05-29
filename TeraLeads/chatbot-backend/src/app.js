/**
 * Express Application Setup
 *
 * Main application configuration with middleware, routes, and error handling.
 * This module exports the configured Express app instance.
 */

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const loggingMiddleware = require('./middlewares/logging.middleware')
const errorHandler = require('./middlewares/errorHandler.middleware')
const routes = require('./routes')

const app = express()

// Security: CORS configuration
// In production, replace '*' with specific allowed origins
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions))

// Body parsing middleware with size limits to prevent DoS attacks
app.use(bodyParser.json({ limit: '10mb' }))
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }))

// Request logging middleware (should be early in the chain)
app.use(loggingMiddleware)

// API routes
app.use('/api', routes)

// Swagger API documentation (development and when explicitly enabled)
if (process.env.NODE_ENV === 'development' || process.env.SWAGGER_ENABLED === 'true') {
  try {
    const { swaggerUi, swaggerSpec } = require('./routes/swagger')
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
  } catch (error) {
    // Swagger dependencies not installed, skip
    console.log(
      'Swagger documentation not available. Install swagger-ui-express and swagger-jsdoc to enable.'
    )
  }
}

/**
 * Health check endpoint
 *
 * Used by monitoring systems to verify service availability
 *
 * @route GET /health
 * @returns {Object} Status object with 'ok' status
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'chatbot-backend',
  })
})

// Error handling middleware (MUST be last)
// Catches all errors from routes and middleware
app.use(errorHandler)

module.exports = app
