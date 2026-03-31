const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { requireFirmManager } = require('../../utils/auth')

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  nativeName: z.string().min(1).max(100).optional(),
  translations: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional()
})

module.exports = async function(req, res) {
  // Only Firm Managers can update languages
  await requireFirmManager(req, res)

  const code = req.params.code
  if (!code) {
    return res.status(400).json({ error: 'Language code required' })
  }

  const payload = schema.parse(req.body)

  // Find the custom language
  const existing = await prisma.customLanguage.findUnique({
    where: { code }
  })

  if (!existing) {
    return res.status(404).json({ error: `Custom language "${code}" not found` })
  }

  // Update the language
  const language = await prisma.customLanguage.update({
    where: { code },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.nativeName !== undefined && { nativeName: payload.nativeName }),
      ...(payload.translations !== undefined && { translations: payload.translations }),
      ...(payload.isEnabled !== undefined && { isEnabled: payload.isEnabled })
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
