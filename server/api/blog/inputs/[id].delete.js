const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  // Atomic ownership check + delete to prevent TOCTOU race conditions
  const result = await prisma.blogInput.deleteMany({ where: { id, userId: user.id } })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  return res.json({ ok: true })
}
