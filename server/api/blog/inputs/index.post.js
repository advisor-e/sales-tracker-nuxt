const { z } = require('zod')
const { Prisma } = require('@prisma/client')
const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

const schema = z.object({
  signature: z.string().trim().min(1).max(191),
  topic: z.string().trim().min(1).max(255),
  audience: z.string().trim().min(1).max(255),
  objective: z.string().trim().min(1).max(255),
  tone: z.string().trim().min(1).max(80),
  length: z.string().trim().min(1).max(80),
  wordCount: z.string().trim().max(50).optional(),
  cta: z.string().trim().min(1).max(255),
  principles: z.array(z.object({ title: z.string().trim(), details: z.array(z.string().trim()) })),
  authorType: z.string().trim().max(50).optional(),
  author: z.string().trim().max(255).optional(),
  selectedPerson: z.string().trim().max(255).optional().nullable(),
  targetMode: z.string().trim().max(120).optional().nullable(),
  styleStrength: z.string().trim().max(40).optional().nullable(),
  styleTitles: z.array(z.string().trim()).optional(),
  lengthRanges: z.unknown().optional(),
  styleThresholds: z.unknown().optional()
})

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const payload = schema.parse(req.body)

  const existing = await prisma.blogInput.findFirst({
    where: { signature: payload.signature, userId: user.id },
    orderBy: { updatedAt: 'desc' }
  })

  const data = {
    userId: user.id,
    signature: payload.signature,
    topic: payload.topic,
    audience: payload.audience,
    objective: payload.objective,
    tone: payload.tone,
    length: payload.length,
    cta: payload.cta,
    principlesJson: payload.principles,
    selectedPerson: payload.selectedPerson || null,
    targetMode: payload.targetMode || null,
    styleStrength: payload.styleStrength || null,
    styleTitlesJson: payload.styleTitles ?? Prisma.JsonNull,
    lengthRangesJson: payload.lengthRanges ?? Prisma.JsonNull,
    styleThresholdsJson: payload.styleThresholds ?? Prisma.JsonNull
  }

  const item = existing
    ? await prisma.blogInput.update({ where: { id: existing.id }, data })
    : await prisma.blogInput.create({ data })

  return res.json({ item })
}
