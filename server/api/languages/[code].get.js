const { prisma } = require('../../utils/db')

module.exports = async function(req, res) {
  const code = req.params.code
  if (!code) {
    return res.status(400).json({ error: 'Language code required' })
  }

  // Find the custom language
  const language = await prisma.customLanguage.findUnique({
    where: { code }
  })

  if (!language) {
    return res.status(404).json({ error: `Custom language "${code}" not found` })
  }

  return res.json({
    code: language.code,
    name: language.name,
    nativeName: language.nativeName,
    translations: language.translations,
    isEnabled: language.isEnabled
  })
}
