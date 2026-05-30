const pool = require('../config/database')

class ChatSession {
  static async create({ user_id, appointment_id = null, business_id = null }) {
    const query = `
      INSERT INTO chat_sessions (user_id, appointment_id, business_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `
    const result = await pool.query(query, [user_id, appointment_id, business_id])
    return result.rows[0]
  }

  static async findById(id) {
    const query = 'SELECT * FROM chat_sessions WHERE id = $1'
    const result = await pool.query(query, [id])
    return result.rows[0] || null
  }

  static async findByUserId(userId) {
    const query = 'SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY created_at DESC'
    const result = await pool.query(query, [userId])
    return result.rows
  }

  static async addMessage(sessionId, messageData) {
    const query = `
      UPDATE chat_sessions
      SET messages = messages || $1::jsonb, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `
    const messageJson = JSON.stringify({
      user_message: messageData.user_message,
      bot_response: messageData.bot_response,
      timestamp: messageData.timestamp,
    })
    const result = await pool.query(query, [`[${messageJson}]`, sessionId])
    return result.rows[0]
  }
}

module.exports = ChatSession
