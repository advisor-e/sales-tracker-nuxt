const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')
const { logDelete } = require('../../utils/audit')

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  // Pipeline is shared across the firm - any authenticated user can delete
  const result = await prisma.pipelineEntry.deleteMany({ where: { id } })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  // Audit log
  logDelete(req, user.id, 'PipelineEntry', id)

  return res.json({ ok: true })
}
