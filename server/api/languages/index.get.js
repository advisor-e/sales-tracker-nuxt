const { prisma } = require('../../utils/db')

// Built-in languages that ship with the app
const builtInLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', isBuiltIn: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isBuiltIn: true },
  { code: 'fr', name: 'French', nativeName: 'Français', isBuiltIn: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isBuiltIn: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', isBuiltIn: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', isBuiltIn: true }
]

module.exports = async function(req, res) {
  // Fetch custom languages from database
  const customLanguages = await prisma.customLanguage.findMany({
    where: { isEnabled: true },
    orderBy: { name: 'asc' }
  })

  // Combine built-in and custom languages
  const languages = [
    ...builtInLanguages.map(lang => ({ ...lang, isEnabled: true })),
    ...customLanguages.map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      isBuiltIn: false,
      isEnabled: lang.isEnabled
    }))
  ]

  return res.json({ languages })
}
