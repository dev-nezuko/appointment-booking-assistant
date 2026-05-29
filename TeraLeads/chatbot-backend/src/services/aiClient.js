/**
 * Client for the Python AI microservice, which owns the conversation and
 * reports where the booking stands in `metadata`.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000'
const TIMEOUT_MS = Number(process.env.AI_SERVICE_TIMEOUT_MS || 15000)

/**
 * Reshape the AI service's metadata into what the browser renders. Times are
 * trimmed to HH:MM because that is how people read them.
 */
const toBooking = (metadata) => {
  if (!metadata || !metadata.status) {
    return null
  }
  const details = metadata.appointment_data || {}
  return {
    status: metadata.status,
    missingFields: metadata.missing_fields || [],
    alternatives: (metadata.alternatives || []).map((slot) => String(slot).slice(0, 5)),
    appointment: details.date
      ? {
          date: details.date,
          time: details.time ? String(details.time).slice(0, 5) : null,
          type: details.service_type || null,
        }
      : null,
  }
}

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
      booking: toBooking(body.metadata),
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      const error = new Error(`AI service did not respond within ${TIMEOUT_MS}ms`)
      error.statusCode = 504
      throw error
    }
    if (!err.statusCode) {
      err.statusCode = 502
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

module.exports = { sendMessage, toBooking, AI_SERVICE_URL }
