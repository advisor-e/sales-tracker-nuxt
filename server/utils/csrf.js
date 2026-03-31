const { randomBytes } = require('crypto')

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'
const TOKEN_LENGTH = 32

function generateCSRFToken() {
  return randomBytes(TOKEN_LENGTH).toString('hex')
}

function ensureCSRFToken(req, res) {
  let token = req.cookies && req.cookies[CSRF_COOKIE]

  if (!token) {
    token = generateCSRFToken()
    res.cookie(CSRF_COOKIE, token, {
      httpOnly: false, // Must be readable by client JS
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours (seconds)
    })
  }

  return token
}

function validateCSRF(req, res) {
  const method = req.method

  // Only check state-changing methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return

  const path = req.path || ''

  // Skip CSRF for login (user doesn't have token yet)
  if (path === '/auth/login') return

  const cookieToken = req.cookies && req.cookies[CSRF_COOKIE]
  const headerToken = req.headers[CSRF_HEADER]

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'Invalid or missing CSRF token' })
    throw new Error('RESPONSE_SENT')
  }
}

module.exports = { generateCSRFToken, ensureCSRFToken, validateCSRF }
