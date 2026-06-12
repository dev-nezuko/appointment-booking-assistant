const DEVELOPMENT_SECRET = 'your-secret-key-change-in-production'
function getJwtSecret(environment = process.env) {
  const configured = environment.JWT_SECRET
  if (environment.NODE_ENV === 'production' &&
      (!configured || configured.length < 32 || configured === DEVELOPMENT_SECRET)) {
    throw new Error('Production requires a unique JWT_SECRET of at least 32 characters')
  }
  return configured || DEVELOPMENT_SECRET
}
module.exports = { getJwtSecret }
