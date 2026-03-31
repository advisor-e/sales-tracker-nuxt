const { BlogPostKind } = require('@prisma/client')
const { prisma } = require('../../../utils/db')
const { requireUser } = require('../../../utils/auth')

module.exports = async function(req, res) {
  const user = await requireUser(req, res)
  const query = req.query
  const kindParam = String(query.kind || 'draft').toLowerCase()
  const kind = kindParam === 'final' ? BlogPostKind.final : BlogPostKind.draft
  const search = String(query.search || '').trim()
  const pinnedOnly = String(query.pinnedOnly || 'false').toLowerCase() === 'true'

  const posts = await prisma.blogPost.findMany({
    where: {
      userId: user.id,
      kind,
      isPinned: pinnedOnly ? true : undefined,
      OR: search
        ? [
            { title: { contains: search } },
            { topic: { contains: search } },
            { selectedPerson: { contains: search } }
          ]
        : undefined
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }]
  })

  return res.json({ items: posts })
}
