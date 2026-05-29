/**
 * Swagger/OpenAPI Documentation Setup
 *
 * API documentation using swagger-ui-express.
 * Install: npm install swagger-ui-express swagger-jsdoc
 */

const swaggerUi = require('swagger-ui-express')
const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chatbot Backend API',
      version: '1.0.0',
      description: 'REST API for AI chatbot appointment booking system',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            user_id: { type: 'integer' },
            business_id: { type: 'integer', nullable: true },
            date: { type: 'string', format: 'date', example: '2025-02-15' },
            time: { type: 'string', example: '10:00:00' },
            duration_minutes: { type: 'integer', default: 60 },
            service_type: { type: 'string', example: 'Consultation' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
            notes: { type: 'string', nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = {
  swaggerUi,
  swaggerSpec,
}
