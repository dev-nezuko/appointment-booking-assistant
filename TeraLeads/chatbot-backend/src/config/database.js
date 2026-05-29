const { Pool, types } = require('pg')
const logger = require('../utils/logger')

// Return DATE columns as 'YYYY-MM-DD' strings. pg's default turns them into a
// Date at local midnight, which serialises as the previous day in any server
// timezone east of UTC and as a misleading timestamp everywhere else.
const DATE_OID = 1082
types.setTypeParser(DATE_OID, (value) => value)

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'chatbot_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
})

pool.on('error', (err) => {
  logger.error({ action: 'pg_idle_client_error', error: err.message })
  process.exit(1)
})

module.exports = pool
