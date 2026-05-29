const jwt = require('../utils/jwt')
const ChatSession = require('../models/ChatSession')
const aiClient = require('./aiClient')
const appointmentService = require('./appointment.service')
const logger = require('../utils/logger')

const SLOT_TAKEN_REPLY =
  'That time has just been taken in our calendar, so I could not book it. ' +
  'Could you pick another time?'

// Same `id` claim as a login token, so the auth middleware and the socket
// handshake accept it; `type` marks it as the short-lived chat credential.
const generateChatbotToken = async (userId) =>
  jwt.generateToken({ id: userId, type: 'chatbot' }, { expiresIn: '15m' })

/**
 * Write a booking the assistant has just confirmed into Postgres, which is the
 * calendar the REST API and every other session read. The AI service only
 * knows about its own conversations, so a slot booked elsewhere can still
 * clash here; that comes back to the user as a request for another time.
 */
const persistBooking = async (userId, chatSessionId, booking) => {
  const { date, time, type } = booking.appointment
  try {
    const saved = await appointmentService.createAppointment(userId, {
      date,
      time,
      service_type: type,
      status: 'confirmed',
    })
    await ChatSession.linkAppointment(chatSessionId, saved.id)
    return { booking: { ...booking, appointment: { ...booking.appointment, id: saved.id } } }
  } catch (err) {
    if (err.statusCode !== 409) {
      throw err
    }
    logger.warn({ action: 'chat_booking_conflict', userId, date, time })
    return {
      message: SLOT_TAKEN_REPLY,
      booking: {
        status: 'unavailable',
        missingFields: ['time'],
        alternatives: [],
        appointment: null,
      },
    }
  }
}

/**
 * Handle one chat turn: find or open the session, ask the AI service, persist.
 *
 * `sessionId` is the browser's opaque key (e.g. "session-1788185187684-o6q91ysip").
 * It is stored in the row's metadata and looked up per user; the integer
 * primary key never leaves the backend.
 */
const sendMessage = async (userId, sessionId, message) => {
  let session = null
  if (sessionId) {
    session = await ChatSession.findBySessionKey(userId, String(sessionId))
  }
  if (!session) {
    session = await ChatSession.create({
      user_id: userId,
      session_key: sessionId ? String(sessionId) : null,
    })
  }

  const ai = await aiClient.sendMessage({
    sessionId: sessionId || session.id,
    message,
    userId,
  })

  let reply = ai.message
  let booking = ai.booking
  if (booking?.status === 'booked' && booking.appointment) {
    const outcome = await persistBooking(userId, session.id, booking)
    reply = outcome.message || reply
    booking = outcome.booking
  }

  await ChatSession.addMessage(session.id, {
    user_message: message,
    bot_response: reply,
    timestamp: new Date(),
  })

  return {
    message: reply,
    sessionId: sessionId || String(session.id),
    booking,
  }
}

module.exports = {
  generateChatbotToken,
  sendMessage,
}
