import { prisma } from "~/server/utils/db";
import { requireFirmManager } from "~/server/utils/auth";

export default defineEventHandler(async (event) => {
  // Only Firm Managers can delete languages
  await requireFirmManager(event);

  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: "Language code required" });
  }

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

  // Delete the language
  await prisma.customLanguage.delete({
    where: { code }
  });

  return { success: true };
});
