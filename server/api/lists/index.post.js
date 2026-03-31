const { z } = require('zod')
const { prisma } = require('../../utils/db')
const { requireFirmManager } = require('../../utils/auth')

const schema = z.object({
  key: z.string().min(1).max(50),
  items: z.array(z.string()),
  colors: z.record(z.string()).optional()
})

module.exports = async function(req, res) {
  // Only Firm Managers can modify lists
  const user = await requireFirmManager(req, res)
  const payload = schema.parse(req.body)

  const configKey = `list:${payload.key}`
  const configVal = JSON.stringify({
    items: payload.items,
    colors: payload.colors
  })

  // Upsert the config
  await prisma.appConfig.upsert({
    where: {
      userId_configKey: {
        userId: user.id,
        configKey
      }
    },
    update: { configVal },
    create: {
      userId: user.id,
      configKey,
      configVal
    }
  })

  return res.json({ success: true })
}
