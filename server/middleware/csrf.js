// Nuxt 2 serverMiddleware - Express style
const cookieParser = require('cookie-parser')
const { ensureCSRFToken, validateCSRF } = require('../utils/csrf')

const parseCookies = cookieParser()

module.exports = function csrfMiddleware(req, res, next) {
  // Parse cookies if not already parsed
  if (!req.cookies) {
    parseCookies(req, res, () => {})
  }
  try {
    ensureCSRFToken(req, res)
    validateCSRF(req, res)
    next()
  } catch (err) {
    if (err.message !== 'RESPONSE_SENT') next(err)
  }
}
