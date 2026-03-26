import { createI18n } from 'vue-i18n';
import en from '~/locales/en.json';
import es from '~/locales/es.json';
import fr from '~/locales/fr.json';

const messages = { en, es, fr };

export default defineNuxtPlugin((nuxtApp) => {
  const validLocales = ['en', 'es', 'fr'];

  // Read locale from cookie - use different methods for server vs client
  let savedLocale = 'en';

  if (import.meta.server) {
    // Server: read from request cookies via useCookie
    const localeCookie = useCookie<string>('i18n_locale');
    savedLocale = localeCookie.value && validLocales.includes(localeCookie.value) ? localeCookie.value : 'en';
  } else {
    // Client: read directly from document.cookie for reliability
    const match = document.cookie.match(/(?:^|; )i18n_locale=([^;]*)/);
    const cookieValue = match ? match[1] : null;
    savedLocale = cookieValue && validLocales.includes(cookieValue) ? cookieValue : 'en';
  }

  // Keep useCookie ref for SSR compatibility
  const localeCookie = useCookie<string>('i18n_locale', {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    sameSite: 'lax'
  });

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: savedLocale,
    fallbackLocale: 'en',
    messages
  });

  nuxtApp.vueApp.use(i18n);

  return {
    provide: {
      i18n: i18n.global,
      setLocale: (newLocale: string) => {
        if (validLocales.includes(newLocale)) {
          i18n.global.locale.value = newLocale;
          // Use both useCookie (for SSR) and direct cookie (for immediate browser write)
          localeCookie.value = newLocale;
          if (import.meta.client) {
            // Directly write to document.cookie to ensure it's set before reload
            const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
            document.cookie = `i18n_locale=${newLocale}; expires=${expires}; path=/; SameSite=Lax`;
          }
        }
      }
    }
  };
});
