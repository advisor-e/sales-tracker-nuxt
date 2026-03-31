const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const id = Number(req.params.id)

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' })
  }

  // Atomic ownership check + delete to prevent TOCTOU race conditions
  const result = await prisma.blogReference.deleteMany({ where: { id, userId: user.id } })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Reference not found' })
  }

  return res.json({ success: true })
}
