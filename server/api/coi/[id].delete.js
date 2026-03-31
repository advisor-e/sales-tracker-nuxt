const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

module.exports = async function(req, res) {
  await requireUser(req, res)
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  // COIs are shared across the firm - any authenticated user can delete
  const result = await prisma.coiEntry.deleteMany({ where: { id } })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  return res.json({ ok: true })
}
