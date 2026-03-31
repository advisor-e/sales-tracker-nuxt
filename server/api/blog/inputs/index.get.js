const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const items = await prisma.blogInput.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: 'desc' }],
    take: 120
  })
  return res.json({ items })
}
