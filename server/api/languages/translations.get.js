import { prisma } from "~/server/utils/db";

// This endpoint returns all enabled custom languages with their full translations
// Used by the i18n plugin to load custom translations at runtime
export default defineEventHandler(async () => {
  const customLanguages = await prisma.customLanguage.findMany({
    where: { isEnabled: true }
  });

  // Return as a map of code -> translations
  const translations = {};
  const metadata = {};

  for (const lang of customLanguages) {
    translations[lang.code] = lang.translations;
    metadata[lang.code] = {
      name: lang.name,
      nativeName: lang.nativeName
    };
  }

  return { translations, metadata };
});
