const { createHash, randomBytes, scryptSync, timingSafeEqual } = require('crypto')
const { prisma } = require('./db')

const SESSION_COOKIE = 'st_session'
const SESSION_DAYS = 30
const SESSION_CACHE_MS = 60 * 1000 // 1 minute cache

const sessionCache = new Map()

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of sessionCache.entries()) {
    if (now - value.cachedAt > SESSION_CACHE_MS || value.expiresAt < new Date()) {
      sessionCache.delete(key)
    }
  }
}, 30000)

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function verifyPassword(password, storedHash) {
  const [salt, expected] = String(storedHash || '').split(':')
  if (!salt || !expected) return false
  const actual = scryptSync(password, salt, 64).toString('hex')
  const actualBuf = Buffer.from(actual, 'hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  if (actualBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(actualBuf, expectedBuf)
}

async function createSession(req, res, userId) {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const isHttps =
    req.protocol === 'https' ||
    (req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'

  await prisma.session.create({ data: { userId, tokenHash, expiresAt } })

  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    expires: expiresAt,
    path: '/'
  })
}

async function clearUserSession(req, res) {
  const token = req.cookies && req.cookies[SESSION_COOKIE]
  if (token) {
    const tokenHash = hashToken(token)
    sessionCache.delete(tokenHash)
    await prisma.session.deleteMany({ where: { tokenHash } })
  }
  res.clearCookie(SESSION_COOKIE, { path: '/' })
}

async function requireUser(req, res) {
  const token = req.cookies && req.cookies[SESSION_COOKIE]
  if (!token) {
    res.status(401).json({ error: 'Unauthorized' })
    throw new Error('RESPONSE_SENT')
  }

  const tokenHash = hashToken(token)

  // Check cache first
  const cached = sessionCache.get(tokenHash)
  if (cached && Date.now() - cached.cachedAt < SESSION_CACHE_MS && cached.expiresAt > new Date()) {
    return cached.user
  }

  // Cache miss - query database
  const session = await prisma.session.findFirst({
    where: { tokenHash, expiresAt: { gt: new Date() } },
    include: { user: true }
  })

  if (!session?.user) {
    sessionCache.delete(tokenHash)
    res.clearCookie(SESSION_COOKIE, { path: '/' })
    res.status(401).json({ error: 'Unauthorized' })
    throw new Error('RESPONSE_SENT')
  }

  const user = {
    id: session.user.id,
    email: session.user.email,
    displayName: session.user.displayName,
    role: session.user.role || 'advisor'
  }

  sessionCache.set(tokenHash, { user, expiresAt: session.expiresAt, cachedAt: Date.now() })
  return user
}

async function requireFirmManager(req, res) {
  const user = await requireUser(req, res)
  if (user.role !== 'firm_manager') {
    res.status(403).json({ error: 'Access denied. Firm Manager role required.' })
    throw new Error('RESPONSE_SENT')
  }
  return user
}

async function getOptionalUser(req) {
  try {
    const token = req.cookies && req.cookies[SESSION_COOKIE]
    if (!token) return null
    const tokenHash = hashToken(token)

    const cached = sessionCache.get(tokenHash)
    if (cached && Date.now() - cached.cachedAt < SESSION_CACHE_MS && cached.expiresAt > new Date()) {
      return cached.user
    }

    const session = await prisma.session.findFirst({
      where: { tokenHash, expiresAt: { gt: new Date() } },
      include: { user: true }
    })
    if (!session?.user) return null

    const user = {
      id: session.user.id,
      email: session.user.email,
      displayName: session.user.displayName,
      role: session.user.role || 'advisor'
    }
    sessionCache.set(tokenHash, { user, expiresAt: session.expiresAt, cachedAt: Date.now() })
    return user
  } catch {
    return null
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  clearUserSession,
  requireUser,
  requireFirmManager,
  getOptionalUser
}
