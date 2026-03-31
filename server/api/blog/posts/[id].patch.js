const { z } = require('zod')
const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

const schema = z.object({
  isPinned: z.boolean().optional(),
  outlineText: z.string().optional(),
  finalText: z.string().nullable().optional(),
  title: z.string().min(1).max(255).optional()
})

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const id = Number(req.params.id)
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid id' })
  }

  const body = schema.parse(req.body)

  // Atomic ownership check + update to prevent TOCTOU race conditions
  const result = await prisma.blogPost.updateMany({
    where: { id, userId: user.id },
    data: {
      isPinned: body.isPinned,
      outlineText: body.outlineText,
      finalText: body.finalText,
      title: body.title
    }
  })

  if (result.count === 0) {
    return res.status(404).json({ error: 'Not found' })
  }

  const item = await prisma.blogPost.findUnique({ where: { id } })
  return res.json({ item })
}
