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
    const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
    const cookieStr = `${CSRF_COOKIE}=${token}; Path=/; SameSite=Strict; Max-Age=86400${secure}`
    res.setHeader('Set-Cookie', cookieStr)
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
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Invalid or missing CSRF token' }))
    throw new Error('RESPONSE_SENT')
  }
}

module.exports = { generateCSRFToken, ensureCSRFToken, validateCSRF }
