const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const query = req.query
  const topic = query.topic

  const where = { userId: user.id }
  if (topic) {
    where.topic = topic
  }

  const items = await prisma.blogReference.findMany({
    where,
    orderBy: { updatedAt: 'desc' }
  })

  return res.json({ items })
}
