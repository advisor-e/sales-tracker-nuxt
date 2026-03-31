const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { requireUser } = require('../../utils/auth')

const schema = z.object({
  coiName: z.string().min(1).max(255),
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
  const user = await requireUser(req, res)
  const payload = schema.parse(req.body)

  const item = await prisma.coiEntry.create({
    data: {
      userId: user.id,
      coiName: payload.coiName,
      email: payload.email || null,
      cell: payload.cell || null,
      entity: payload.entity || null,
      position: payload.position || null,
      industry: payload.industry || null,
      leadRelationshipPartner: payload.leadRelationshipPartner || null,
      relationshipSupport: payload.relationshipSupport || null,
      couldWe: payload.couldWe ?? false,
      howWouldWe: payload.howWouldWe ?? false,
      willWe: payload.willWe ?? false,
      testReview: payload.testReview ?? false,
      totalReferrals: payload.totalReferrals ?? 0,
      totalConverted: payload.totalConverted ?? 0,
      feeValue: payload.feeValue ?? 0
    }
  })

  return res.json({ item: { ...item, feeValue: Number(item.feeValue || 0) } })
}
