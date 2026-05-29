/**
 * User Model
 *
 * Database model for user operations. Provides methods for creating,
 * finding, and managing user records.
 *
 * Security considerations:
 * - Uses parameterized queries to prevent SQL injection
 * - Never returns password hashes in findById results
 * - Email lookups are case-insensitive
 */

const pool = require('../config/database')
const logger = require('../utils/logger')

/**
 * User Model Class
 *
 * Static methods for user database operations.
 * All methods use parameterized queries for SQL injection prevention.
 */
class User {
  /**
   * Creates a new user record in the database
   *
   * @param {Object} userData - User data object
   * @param {string} userData.email - User's email address
   * @param {string} userData.password - Hashed password (should be hashed before calling)
   * @param {string} userData.name - User's full name
   * @returns {Promise<Object>} Created user object (without password)
   * @throws {Error} If database operation fails
   *
   * @example
   * ```javascript
   * const hashedPassword = await bcrypt.hash('password123', 10)
   * const user = await User.create({
   *   email: 'user@example.com',
   *   password: hashedPassword,
   *   name: 'John Doe'
   * })
   * ```
   */
  static async create({ email, password, name }) {
    try {
      // Parameterized query prevents SQL injection
      const query = `
        INSERT INTO users (email, password, name, created_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING id, email, name, created_at
      `
      const result = await pool.query(query, [email, password, name])

      if (result.rows.length === 0) {
        throw new Error('Failed to create user')
      }

      logger.info({
        action: 'user_created',
        userId: result.rows[0].id,
        email: result.rows[0].email,
      })

      return result.rows[0]
    } catch (error) {
      logger.error({
        action: 'user_create_error',
        error: error.message,
        email: email,
      })
      throw error
    }
  }

  /**
   * Finds a user by email address
   *
   * Note: Returns password hash for authentication purposes.
   * Callers should never expose this value.
   *
   * @param {string} email - User's email address (case-insensitive)
   * @returns {Promise<Object|null>} User object with all fields including password, or null if not found
   * @throws {Error} If database operation fails
   *
   * @example
   * ```javascript
   * const user = await User.findByEmail('user@example.com')
   * if (user) {
   *   const isValid = await bcrypt.compare(password, user.password)
   * }
   * ```
   */
  static async findByEmail(email) {
    try {
      // Parameterized query with LOWER() for case-insensitive search
      const query = 'SELECT * FROM users WHERE LOWER(email) = LOWER($1)'
      const result = await pool.query(query, [email])

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } catch (error) {
      logger.error({
        action: 'user_find_by_email_error',
        error: error.message,
        email: email,
      })
      throw error
    }
  }

  /**
   * Finds a user by ID
   *
   * Note: Does NOT return password hash for security.
   *
   * @param {number} id - User's unique identifier
   * @returns {Promise<Object|null>} User object without password, or null if not found
   * @throws {Error} If database operation fails
   *
   * @example
   * ```javascript
   * const user = await User.findById(123)
   * if (user) {
   *   console.log(user.name)
   * }
   * ```
   */
  static async findById(id) {
    try {
      // Explicitly exclude password from results
      const query = `
        SELECT id, email, name, created_at, updated_at
        FROM users
        WHERE id = $1
      `
      const result = await pool.query(query, [id])

      if (result.rows.length === 0) {
        return null
      }

      return result.rows[0]
    } catch (error) {
      logger.error({
        action: 'user_find_by_id_error',
        error: error.message,
        userId: id,
      })
      throw error
    }
  }

  /**
   * Updates a user's information
   *
   * @param {number} id - User's unique identifier
   * @param {Object} updateData - Fields to update (email, name, etc.)
   * @returns {Promise<Object>} Updated user object (without password)
   * @throws {Error} If user not found or database operation fails
   */
  static async update(id, updateData) {
    try {
      const allowedFields = ['email', 'name']
      const fields = []
      const values = []
      let paramCount = 1

      // Build dynamic update query with only allowed fields
      Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
          fields.push(`${key} = $${paramCount}`)
          values.push(updateData[key])
          paramCount++
        }
      })

      if (fields.length === 0) {
        throw new Error('No valid fields to update')
      }

      values.push(id)
      const query = `
        UPDATE users
        SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount}
        RETURNING id, email, name, created_at, updated_at
      `
      const result = await pool.query(query, values)

      if (result.rows.length === 0) {
        throw new Error('User not found')
      }

      logger.info({
        action: 'user_updated',
        userId: id,
      })

      return result.rows[0]
    } catch (error) {
      logger.error({
        action: 'user_update_error',
        error: error.message,
        userId: id,
      })
      throw error
    }
  }
}

module.exports = User
