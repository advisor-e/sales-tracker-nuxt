const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

const schema = z.object({
  prospectName: z.string().min(1).max(255).optional(),
  businessName: z.string().max(255).optional().nullable(),
  partner: z.string().max(255).optional().nullable(),
  leadStaff: z.string().max(255).optional().nullable(),
  prospectStatus: z.string().min(1).max(80).optional(),
  relationshipType: z.string().max(80).optional().nullable(),
  prospectSource: z.string().max(120).optional().nullable(),
  approachStyle: z.string().max(120).optional().nullable(),
  approachDate: z.string().optional().nullable(),
  secureMeeting: z.boolean().optional(),
  proposalSent: z.boolean().optional(),
  proposalValue: z.number().optional(),
  jobSecured: z.boolean().optional(),
  jobSecuredValue: z.number().optional(),
  comments: z.string().optional().nullable(),
  coiInvolved: z.string().max(255).optional().nullable()
})

module.exports = async function(req, res) {
  await requireUser(req, res)
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const payload = schema.parse(req.body)

  // Pipeline is shared across the firm - any authenticated user can update
  const result = await prisma.pipelineEntry.updateMany({
    where: { id },
    data: {
      ...payload,
      approachDate: payload.approachDate === undefined ? undefined : payload.approachDate ? new Date(payload.approachDate) : null
    }
  })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  // Fetch the updated item to return
  const item = await prisma.pipelineEntry.findUnique({ where: { id } })

  return res.json({
    item: {
      ...item,
      proposalValue: Number(item.proposalValue || 0),
      jobSecuredValue: Number(item.jobSecuredValue || 0)
    }
  })
}
