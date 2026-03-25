import { z } from "zod";
import { prisma } from "~/server/utils/db";
import { requireFirmManager } from "~/server/utils/auth";

const schema = z.object({
  key: z.string().min(1).max(50),
  items: z.array(z.string()),
  colors: z.record(z.string()).optional()
});

export default defineEventHandler(async (event) => {
  // Only Firm Managers can modify lists
  const user = await requireFirmManager(event);
  const payload = schema.parse(await readBody(event));

  const configKey = `list:${payload.key}`;
  const configVal = JSON.stringify({
    items: payload.items,
    colors: payload.colors
  });

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
  });

  return { success: true };
});
