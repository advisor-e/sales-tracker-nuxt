const { prisma } = require('../../utils/db')
const { requireFirmManager } = require('../../utils/auth')

module.exports = async function(req, res) {
  // Only Firm Managers can delete languages
  await requireFirmManager(req, res)

  const code = req.params.code
  if (!code) {
    return res.status(400).json({ error: 'Language code required' })
  }

  // Find the custom language
  const existing = await prisma.customLanguage.findUnique({
    where: { code }
  })

  if (!existing) {
    return res.status(404).json({ error: `Custom language "${code}" not found` })
  }

  // Delete the language
  await prisma.customLanguage.delete({
    where: { code }
  })

  return res.json({ success: true })
}
