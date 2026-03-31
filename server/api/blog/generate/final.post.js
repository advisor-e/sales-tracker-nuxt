const { z } = require('zod')
const { generateFinal } = require('../../../utils/openai')
const { requireUser } = require('../../../utils/auth')

const schema = z.object({
  outlineText: z.string().min(1),
  topic: z.string().min(1),
  audience: z.string().min(1),
  objective: z.string().min(1),
  tone: z.enum(['Professional', 'Friendly', 'Confident', 'Educational']),
  cta: z.string().min(1),
  polishLevel: z.enum(['Standard', 'Strong', 'Premium']),
  wordCount: z.string().optional(),
  aiInstructions: z.string().optional()
})

module.exports = async function(req, res) {
  await requireUser(req, res)
  const payload = schema.parse(req.body)
  return res.json(await generateFinal(payload))
}
