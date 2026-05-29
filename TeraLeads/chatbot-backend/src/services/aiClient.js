/**
 * Client for the Python AI microservice.
 *
 * The backend had a `// TODO: Forward message to AI microservice` and returned
 * a hardcoded placeholder string, so the three-service architecture the README
 * describes was never actually connected: the browser talked to this backend,
 * and this backend talked to nobody. Every message in the UI came back as
 * "This is a placeholder response. AI service integration pending."
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000'
const TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 15000)

/**
 * Send one turn to the AI service.
 *
 * A failure here is deliberately explicit rather than silently degraded: a
 * booking assistant that quietly stops understanding, while still replying,
 * is worse than one that says it is unavailable.
 */
const sendMessage = async ({ sessionId, message, userId }) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: String(sessionId),
        message,
        user_id: Number(userId),
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const detail = await res.text()
      const error = new Error(`AI service returned ${res.status}: ${detail.slice(0, 200)}`)
      error.statusCode = 502
      throw error
    }

    const body = await res.json()
    return {
      message: body.response,
      appointmentData: body.appointment_data || null,
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error(`AI service did not respond within ${TIMEOUT_MS}ms`)
      error.statusCode = 504
      throw error
    }
    if (!err.statusCode) err.statusCode = 502
    throw err
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { sendMessage, AI_SERVICE_URL }
