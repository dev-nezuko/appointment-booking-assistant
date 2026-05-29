const pool = require('../config/database')

class ChatSession {
  static async create({
    user_id,
    appointment_id = null,
    business_id = null,
    session_key = null,
  }) {
    // The browser's opaque session key lives in metadata rather than in a new
    // column, so this needs no migration against an existing database.
    const query = `
      INSERT INTO chat_sessions (user_id, appointment_id, business_id, metadata, created_at)
      VALUES ($1, $2, $3, $4::jsonb, NOW())
      RETURNING *
    `
    const metadata = JSON.stringify(session_key ? { session_key } : {})
    const result = await pool.query(query, [
      user_id,
      appointment_id,
      business_id,
      metadata,
    ])
    return result.rows[0]
  }

  /**
   * Look a session up by the client-generated key.
   *
   * Scoped to the user: a session key is guessable, and without the user_id
   * predicate one person could resume another person's conversation.
   */
  static async findBySessionKey(userId, sessionKey) {
    const query = `
      SELECT * FROM chat_sessions
      WHERE user_id = $1 AND metadata->>'session_key' = $2
      ORDER BY created_at DESC
      LIMIT 1
    `
    const result = await pool.query(query, [userId, sessionKey])
    return result.rows[0] || null
  }

  static async findById(id) {
    // A non-numeric id is a lookup miss, not a database error. Passing one
    // through made Postgres raise `invalid input syntax for type integer`,
    // which surfaced to the user as a 500.
    if (!/^\d+$/.test(String(id))) return null
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
