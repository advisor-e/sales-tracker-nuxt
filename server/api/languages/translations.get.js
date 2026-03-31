const { prisma } = require('../../utils/db')

// This endpoint returns all enabled custom languages with their full translations
// Used by the i18n plugin to load custom translations at runtime
module.exports = async function(req, res) {
  const customLanguages = await prisma.customLanguage.findMany({
    where: { isEnabled: true }
  })

  // Return as a map of code -> translations
  const translations = {}
  const metadata = {}

  for (const lang of customLanguages) {
    translations[lang.code] = lang.translations
    metadata[lang.code] = {
      name: lang.name,
      nativeName: lang.nativeName
    }
  }

  return res.json({ translations, metadata })
}
