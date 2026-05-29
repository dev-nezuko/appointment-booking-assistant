const pool = require('../config/database')

const PUBLIC_COLUMNS = 'id, email, name, created_at, updated_at'
const UPDATABLE = ['email', 'name']

class User {
  /** Insert a user. `password` must already be a bcrypt hash. */
  static async create({ email, password, name }) {
    const result = await pool.query(
      `INSERT INTO users (email, password, name, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, email, name, created_at`,
      [email, password, name]
    )
    return result.rows[0]
  }

  /** Includes the password hash, for login only; never send this row to a client. */
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email])
    return result.rows[0] || null
  }

  static async findById(id) {
    const result = await pool.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = $1`, [id])
    return result.rows[0] || null
  }

  static async update(id, updateData) {
    const keys = Object.keys(updateData).filter((key) => UPDATABLE.includes(key))
    if (keys.length === 0) {
      throw new Error('No valid fields to update')
    }
    const assignments = keys.map((key, i) => `${key} = $${i + 1}`).join(', ')
    const result = await pool.query(
      `UPDATE users SET ${assignments}, updated_at = NOW()
       WHERE id = $${keys.length + 1}
       RETURNING ${PUBLIC_COLUMNS}`,
      [...keys.map((key) => updateData[key]), id]
    )
    if (result.rows.length === 0) {
      throw new Error('User not found')
    }
    return result.rows[0]
  }
}

module.exports = User
