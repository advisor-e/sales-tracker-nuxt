const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { requireFirmManager } = require('../../utils/auth')

// Built-in language codes that cannot be used for custom languages
const reservedCodes = ['en', 'es', 'fr', 'de', 'pt', 'it']

const schema = z.object({
  code: z.string().min(2).max(10).regex(/^[a-z]{2,3}(-[A-Z]{2})?$/, 'Invalid language code format'),
  name: z.string().min(1).max(100),
  nativeName: z.string().min(1).max(100),
  translations: z.record(z.any()) // Full translation object
})

module.exports = async function(req, res) {
  // Only Firm Managers can add languages
  await requireFirmManager(req, res)
  const payload = schema.parse(req.body)

  // Check if code is reserved
  if (reservedCodes.includes(payload.code.toLowerCase())) {
    return res.status(400).json({ error: `Language code "${payload.code}" is reserved for built-in languages` })
  }

  // Check if code already exists
  const existing = await prisma.customLanguage.findUnique({
    where: { code: payload.code }
  })

  if (existing) {
    return res.status(400).json({ error: `Language code "${payload.code}" already exists` })
  }

  // Create the custom language
  const language = await prisma.customLanguage.create({
    data: {
      code: payload.code,
      name: payload.name,
      nativeName: payload.nativeName,
      translations: payload.translations,
      isEnabled: true
    }
  })

  return res.json({
    success: true,
    language: {
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      isBuiltIn: false,
      isEnabled: language.isEnabled
    }
  })
}
