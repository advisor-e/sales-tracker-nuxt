const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

module.exports = async function(req, res) {
  // Any authenticated user can view pipeline (shared across the firm)
  await requireUser(req, res)
  const query = req.query
  const search = String(query.search || '').trim()
  const status = String(query.status || '').trim()
  const owner = String(query.owner || '').trim()

  const items = await prisma.pipelineEntry.findMany({
    where: {
      // Pipeline is shared across the firm - no userId filter
      prospectStatus: status || undefined,
      leadStaff: owner || undefined,
      OR: search
        ? [
            { prospectName: { contains: search } },
            { businessName: { contains: search } },
            { partner: { contains: search } },
            { leadStaff: { contains: search } }
          ]
        : undefined
    },
    orderBy: [{ updatedAt: 'desc' }],
    take: 500
  })

  return res.json({
    items: items.map((item) => ({
      ...item,
      proposalValue: Number(item.proposalValue || 0),
      jobSecuredValue: Number(item.jobSecuredValue || 0)
    }))
  })
}
