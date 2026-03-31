const loginAttempts = new Map()

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000 // 15 minute window
const BLOCK_MS = 30 * 60 * 1000  // 30 minute block

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now > entry.blockedUntil && now - entry.firstAttempt > WINDOW_MS) {
      loginAttempts.delete(ip)
    }
  }
}, 5 * 60 * 1000)

function checkLoginRateLimit(ip) {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry) return { allowed: true }

  if (entry.blockedUntil > now) {
    return { allowed: false, retryAfter: Math.ceil((entry.blockedUntil - now) / 1000) }
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(ip)
    return { allowed: true }
  }

  if (entry.attempts < MAX_ATTEMPTS) return { allowed: true }

  entry.blockedUntil = now + BLOCK_MS
  return { allowed: false, retryAfter: Math.ceil(BLOCK_MS / 1000) }
}

function recordLoginAttempt(ip) {
  const now = Date.now()
  const entry = loginAttempts.get(ip)

  if (!entry) {
    loginAttempts.set(ip, { attempts: 1, firstAttempt: now, blockedUntil: 0 })
    return
  }

  if (now - entry.firstAttempt > WINDOW_MS) {
    entry.attempts = 1
    entry.firstAttempt = now
    entry.blockedUntil = 0
  } else {
    entry.attempts++
  }
}

function clearLoginRateLimit(ip) {
  loginAttempts.delete(ip)
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIP = req.headers['x-real-ip']
  if (realIP) return realIP
  return req.socket?.remoteAddress || 'unknown'
}

module.exports = { checkLoginRateLimit, recordLoginAttempt, clearLoginRateLimit, getClientIP }
