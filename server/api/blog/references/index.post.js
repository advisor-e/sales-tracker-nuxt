const { z } = require('zod')
const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

const schema = z.object({
  title: z.string().min(1).max(255),
  type: z.enum(['document', 'url']),
  content: z.string().optional(),
  url: z.string().max(500).optional(),
  topic: z.string().max(255).optional()
})

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const payload = schema.parse(req.body)

  const item = await prisma.blogReference.create({
    data: {
      userId: user.id,
      title: payload.title,
      type: payload.type,
      content: payload.content || null,
      url: payload.url || null,
      topic: payload.topic || null
    }
  })

  return res.json({ item })
}
