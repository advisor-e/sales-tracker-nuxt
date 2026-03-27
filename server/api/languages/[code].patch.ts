import { z } from "zod";
import { prisma } from "~/server/utils/db";
import { requireFirmManager } from "~/server/utils/auth";

const schema = z.object({
  name: z.string().min(1).max(100).optional(),
  nativeName: z.string().min(1).max(100).optional(),
  translations: z.record(z.any()).optional(),
  isEnabled: z.boolean().optional()
});

export default defineEventHandler(async (event) => {
  // Only Firm Managers can update languages
  await requireFirmManager(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: "Language code required" });
  }

  const payload = schema.parse(await readBody(event));

  // Find the custom language
  const existing = await prisma.customLanguage.findUnique({
    where: { code }
  });

  if (!existing) {
    throw createError({
      statusCode: 404,
      statusMessage: `Custom language "${code}" not found`
    });
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
  });

  return {
    success: true,
    language: {
      code: language.code,
      name: language.name,
      nativeName: language.nativeName,
      isBuiltIn: false,
      isEnabled: language.isEnabled
    }
  };
});
