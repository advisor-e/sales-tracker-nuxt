const { prisma } = require('./db')
const { getClientIP } = require('./ratelimit')

async function logAudit(req, data) {
  try {
    const ipAddress = getClientIP(req)
    const userAgent = (req.headers['user-agent'] || '').slice(0, 500) || null

    await prisma.auditLog.create({
      data: {
        userId: data.userId ?? null,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId ?? null,
        changes: data.changes ? JSON.stringify(data.changes) : null,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('[audit] Failed to log audit event:', error)
  }
}

function logCreate(req, userId, entityType, entityId, data) {
  logAudit(req, { userId, action: 'CREATE', entityType, entityId, changes: data })
}

function logUpdate(req, userId, entityType, entityId, changes) {
  logAudit(req, { userId, action: 'UPDATE', entityType, entityId, changes })
}

function logDelete(req, userId, entityType, entityId) {
  logAudit(req, { userId, action: 'DELETE', entityType, entityId })
}

function logLogin(req, userId, email) {
  logAudit(req, { userId, action: 'LOGIN', entityType: 'User', entityId: userId, changes: { email } })
}

function logLogout(req, userId) {
  logAudit(req, { userId, action: 'LOGOUT', entityType: 'User', entityId: userId })
}

module.exports = { logAudit, logCreate, logUpdate, logDelete, logLogin, logLogout }
