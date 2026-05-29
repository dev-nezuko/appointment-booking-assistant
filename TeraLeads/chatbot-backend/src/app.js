const express = require('express')
const cors = require('cors')
const loggingMiddleware = require('./middlewares/logging.middleware')
const errorHandler = require('./middlewares/errorHandler.middleware')
const routes = require('./routes')

const app = express()

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    optionsSuccessStatus: 200,
  })
)

// Chat turns and appointment payloads are a few hundred bytes; a small cap
// keeps an oversized body from tying up the parser.
app.use(express.json({ limit: '100kb' }))
app.use(express.urlencoded({ extended: true, limit: '100kb' }))

app.use(loggingMiddleware)

app.use('/api', routes)

if (process.env.NODE_ENV === 'development' || process.env.SWAGGER_ENABLED === 'true') {
  const { swaggerUi, swaggerSpec } = require('./routes/swagger')
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'chatbot-backend',
  })
})

// Last, so it receives errors from every route and middleware above.
app.use(errorHandler)

module.exports = app
