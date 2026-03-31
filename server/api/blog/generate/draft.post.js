const { z } = require('zod')
const { generateDraft } = require('../../../utils/openai')
const { requireUser } = require('../../../utils/auth')

const schema = z.object({
  topic: z.string().min(1),
  audience: z.string().min(1),
  objective: z.string().min(1),
  tone: z.enum(['Professional', 'Friendly', 'Confident', 'Educational']),
  length: z.enum(['Short', 'Medium', 'Long']),
  wordCount: z.string().optional(),
  cta: z.string().min(1),
  author: z.string().optional(),
  principles: z.array(z.object({ title: z.string(), details: z.array(z.string()) })).min(1),
  references: z.string().optional()
})

module.exports = async function(req, res) {
  await requireUser(req, res)
  const payload = schema.parse(req.body)
  return res.json(await generateDraft(payload))
}
