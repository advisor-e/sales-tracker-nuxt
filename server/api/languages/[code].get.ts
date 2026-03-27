import { prisma } from "~/server/utils/db";

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, "code");
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: "Language code required" });
  }

  // Find the custom language
  const language = await prisma.customLanguage.findUnique({
    where: { code }
  });

  if (!language) {
    throw createError({
      statusCode: 404,
      statusMessage: `Custom language "${code}" not found`
    });
  }

  return {
    code: language.code,
    name: language.name,
    nativeName: language.nativeName,
    translations: language.translations,
    isEnabled: language.isEnabled
  };
});
