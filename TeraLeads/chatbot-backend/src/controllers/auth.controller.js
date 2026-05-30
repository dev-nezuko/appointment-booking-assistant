const authService = require('../services/auth.service')

const signup = async (req, res, next) => {
  try {
    const { email, password, name } = req.body
    const result = await authService.signup(email, password, name)
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.json(result)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  signup,
  login,
}
