const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { createSession, hashPassword, verifyPassword } = require('../../utils/auth')
const { checkLoginRateLimit, recordLoginAttempt, clearLoginRateLimit, getClientIP } = require('../../utils/ratelimit')
const { logLogin } = require('../../utils/audit')

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(128)  // Allow any length for login (validation is on registration)
})

module.exports = async function(req, res) {
  // Rate limiting check
  const clientIP = getClientIP(req)
  const rateCheck = checkLoginRateLimit(clientIP)
  if (!rateCheck.allowed) {
    res.set('Retry-After', rateCheck.retryAfter)
    return res.status(429).json({ error: `Too many login attempts. Try again in ${Math.ceil((rateCheck.retryAfter || 0) / 60)} minutes.` })
  }

  const payload = schema.parse(req.body)
  const email = payload.email.trim().toLowerCase()

  const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@example.com').trim().toLowerCase()
  const adminPassword = String(process.env.ADMIN_PASSWORD || '').trim()

  const userCount = await prisma.user.count()
  if (userCount === 0 && adminPassword && email === adminEmail && payload.password === adminPassword) {
    // First user is automatically a Firm Manager
    await prisma.user.create({
      data: {
        email,
        displayName: 'Administrator',
        passwordHash: hashPassword(payload.password),
        role: 'firm_manager'
      }
    })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !verifyPassword(payload.password, user.passwordHash)) {
    recordLoginAttempt(clientIP)
    return res.status(401).json({ error: 'Invalid credentials' })
  }

  // Successful login - clear rate limit
  clearLoginRateLimit(clientIP)
  await createSession(req, res, user.id)

  // Audit log
  logLogin(req, user.id, user.email)

  return res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName
    }
  })
}
