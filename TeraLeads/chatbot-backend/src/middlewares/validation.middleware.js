const validateSignup = (req, res, next) => {
  const { email, password, name } = req.body

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' })
  }

  next()
}

const validateLogin = (req, res, next) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  next()
}

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidDate = (dateStr) => {
  const date = new Date(dateStr)
  return !isNaN(date.getTime())
}

const isValidTime = (timeStr) => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/
  return timeRegex.test(String(timeStr))
}

const sanitizeString = (str) => {
  return typeof str === 'string' ? str.trim() : str
}

const validateAppointment = (req, res, next) => {
  if (req.body.service_type) {
    req.body.service_type = sanitizeString(req.body.service_type)
  }
  if (req.body.notes) {
    req.body.notes = sanitizeString(req.body.notes)
  }

  const { date, time } = req.body

  if (!date || !time) {
    return res.status(400).json({ error: 'Date and time are required' })
  }

  if (!isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' })
  }

  if (!isValidTime(time)) {
    return res.status(400).json({ error: 'Invalid time format (use HH:MM or HH:MM:SS)' })
  }

  const appointmentDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (appointmentDate < today) {
    return res.status(400).json({ error: 'Appointment date cannot be in the past' })
  }

  if (req.body.duration_minutes !== undefined && req.body.duration_minutes !== null) {
    const dur = parseInt(req.body.duration_minutes, 10)
    if (isNaN(dur) || dur < 15 || dur > 480) {
      return res.status(400).json({ error: 'Duration must be between 15 and 480 minutes' })
    }
  }

  next()
}

const validateAppointmentUpdate = (req, res, next) => {
  const { date, time, duration_minutes, status } = req.body

  if (date !== undefined && !isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid date format (use YYYY-MM-DD)' })
  }

  if (time !== undefined && !isValidTime(time)) {
    return res.status(400).json({ error: 'Invalid time format (use HH:MM or HH:MM:SS)' })
  }

  if (duration_minutes !== undefined && duration_minutes !== null) {
    const dur = parseInt(duration_minutes, 10)
    if (isNaN(dur) || dur < 15 || dur > 480) {
      return res.status(400).json({ error: 'Duration must be between 15 and 480 minutes' })
    }
  }

  if (
    status !== undefined &&
    !['pending', 'confirmed', 'cancelled', 'completed'].includes(status)
  ) {
    return res.status(400).json({ error: 'Invalid status' })
  }

  next()
}

module.exports = {
  validateSignup,
  validateLogin,
  validateAppointment,
  validateAppointmentUpdate,
}
