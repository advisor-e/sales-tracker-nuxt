const { z } = require('zod')
const OpenAI = require('openai')
const { prisma } = require('../../utils/db')
const { requireFirmManager } = require('../../utils/auth')
const en = require('../../../locales/en.json')

const reservedCodes = ['en', 'es', 'fr', 'de', 'pt', 'it']

const schema = z.object({
  code: z.string().min(2).max(10),
  name: z.string().min(1).max(100),
  nativeName: z.string().min(1).max(100)
})

module.exports = async function(req, res) {
  await requireFirmManager(req, res)
  const payload = schema.parse(req.body)
  const code = payload.code.toLowerCase()

  if (reservedCodes.includes(code)) {
    return res.status(400).json({ error: `Language code "${code}" is reserved for built-in languages` })
  }

  const apiKey = String(process.env.OPENAI_API_KEY || '').trim()
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' })
  }

  const openai = new OpenAI({ apiKey })

  // Translate the full English JSON into the target language
  const prompt = `You are a professional translator. Translate all string values in the following JSON from English into ${payload.name} (${payload.nativeName}, language code: ${code}).

Rules:
- Preserve ALL JSON structure, keys, and nesting exactly as-is
- Only translate the string values, never the keys
- Preserve placeholders like {count}, {team}, {coi}, {'@'} exactly as they appear
- Return only valid JSON with no markdown, no code fences, no explanation

English JSON:
${JSON.stringify(en, null, 2)}`

  let translated
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })

    const content = response.choices[0]?.message?.content ?? ''
    translated = JSON.parse(content)
  } catch (e) {
    return res.status(500).json({ error: 'Translation failed. Please try again.' })
  }

  // Upsert — create new or update existing (e.g. re-translating Thai)
  const language = await prisma.customLanguage.upsert({
    where: { code },
    create: {
      code,
      name: payload.name,
      nativeName: payload.nativeName,
      translations: translated,
      isEnabled: true
    },
    update: {
      name: payload.name,
      nativeName: payload.nativeName,
      translations: translated,
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
    },
    translations: translated
  })
}
