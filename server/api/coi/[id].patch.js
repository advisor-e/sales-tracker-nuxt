const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

const schema = z.object({
  coiName: z.string().min(1).max(255).optional(),
  email: z.string().max(255).optional().nullable(),
  cell: z.string().max(80).optional().nullable(),
  entity: z.string().max(255).optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  leadRelationshipPartner: z.string().max(255).optional().nullable(),
  relationshipSupport: z.string().max(255).optional().nullable(),
  couldWe: z.boolean().optional(),
  howWouldWe: z.boolean().optional(),
  willWe: z.boolean().optional(),
  testReview: z.boolean().optional(),
  totalReferrals: z.number().int().optional(),
  totalConverted: z.number().int().optional(),
  feeValue: z.number().optional()
})

module.exports = async function(req, res) {
  await requireUser(req, res)
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const payload = schema.parse(req.body)

  // Convert boolean progress fields to integers for database
  const data = { ...payload }
  if (typeof payload.couldWe === 'boolean') data.couldWe = payload.couldWe ? 1 : 0
  if (typeof payload.howWouldWe === 'boolean') data.howWouldWe = payload.howWouldWe ? 1 : 0
  if (typeof payload.willWe === 'boolean') data.willWe = payload.willWe ? 1 : 0
  if (typeof payload.testReview === 'boolean') data.testReview = payload.testReview ? 1 : 0

  // COIs are shared across the firm - any authenticated user can update
  const result = await prisma.coiEntry.updateMany({ where: { id }, data })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  const item = await prisma.coiEntry.findUnique({ where: { id } })
  return res.json({ item: { ...item, feeValue: Number(item?.feeValue || 0) } })
}
