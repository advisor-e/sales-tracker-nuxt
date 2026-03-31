const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

module.exports = async function(req, res) {
  // Any authenticated user can view COIs (shared across the firm)
  await requireUser(req, res)
  const query = req.query
  const search = String(query.search || '').trim()

  const items = await prisma.coiEntry.findMany({
    where: {
      // COIs are shared across the firm - no userId filter
      OR: search
        ? [
            { coiName: { contains: search } },
            { entity: { contains: search } },
            { industry: { contains: search } },
            { leadRelationshipPartner: { contains: search } }
          ]
        : undefined
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 500
  })

  return res.json({
    items: items.map((item) => ({
      ...item,
      feeValue: Number(item.feeValue || 0)
    }))
  })
}
