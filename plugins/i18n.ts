import { createI18n } from 'vue-i18n';
import en from '~/locales/en.json';
import es from '~/locales/es.json';
import fr from '~/locales/fr.json';
import de from '~/locales/de.json';
import pt from '~/locales/pt.json';
import it from '~/locales/it.json';

const builtInMessages = { en, es, fr, de, pt, it };

const builtInLocales = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' }
];

export default defineNuxtPlugin(async (nuxtApp) => {
  const localeCookie = useCookie<string>('i18n_locale', {
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax'
  });

  const builtInCodes = Object.keys(builtInMessages);
  const savedLocale = localeCookie.value && builtInCodes.includes(localeCookie.value)
    ? localeCookie.value
    : 'en';

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: savedLocale,
    fallbackLocale: 'en',
    messages: builtInMessages
  });

  nuxtApp.vueApp.use(i18n);

  const availableLocales = ref([...builtInLocales]);

  // Load custom languages from DB and register them with vue-i18n
  try {
    const response = await $fetch<{
      translations: Record<string, object>;
      metadata: Record<string, { name: string; nativeName: string }>;
    }>('/api/languages/translations');

    for (const [code, translations] of Object.entries(response.translations)) {
      i18n.global.setLocaleMessage(code, translations as any);
      const meta = response.metadata[code];
      if (meta && !availableLocales.value.find(l => l.code === code)) {
        availableLocales.value.push({ code, name: meta.name, nativeName: meta.nativeName });
      }
    }

    // Apply saved locale if it's a custom one that just loaded
    if (localeCookie.value && response.translations[localeCookie.value]) {
      i18n.global.locale.value = localeCookie.value;
    }
  } catch {
    // DB unavailable — continue with built-in locales only
  }

  return {
    provide: {
      i18n: i18n.global,
      availableLocales,
      setLocale: (newLocale: string) => {
        i18n.global.locale.value = newLocale;
        localeCookie.value = newLocale;
      },
      addLocale: (code: string, name: string, nativeName: string, translations: object) => {
        i18n.global.setLocaleMessage(code, translations as any);
        if (!availableLocales.value.find(l => l.code === code)) {
          availableLocales.value.push({ code, name, nativeName });
        }
      },
      removeLocale: (code: string) => {
        const idx = availableLocales.value.findIndex(l => l.code === code);
        if (idx !== -1) availableLocales.value.splice(idx, 1);
        if (i18n.global.locale.value === code) {
          i18n.global.locale.value = 'en';
          localeCookie.value = 'en';
        }
      },
      refreshLocales: async () => {
        try {
          const response = await $fetch<{
            translations: Record<string, object>;
            metadata: Record<string, { name: string; nativeName: string }>;
          }>('/api/languages/translations');

          for (const [code, translations] of Object.entries(response.translations)) {
            i18n.global.setLocaleMessage(code, translations as any);
            const meta = response.metadata[code];
            if (meta && !availableLocales.value.find(l => l.code === code)) {
              availableLocales.value.push({ code, name: meta.name, nativeName: meta.nativeName });
            }
          }
        } catch {
          // ignore
        }
      }
    }
  };
});
