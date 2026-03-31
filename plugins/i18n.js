import Vue from 'vue'
import VueI18n from 'vue-i18n'
import en from '~/locales/en.json'
import es from '~/locales/es.json'
import fr from '~/locales/fr.json'
import de from '~/locales/de.json'
import pt from '~/locales/pt.json'
import it from '~/locales/it.json'

Vue.use(VueI18n)

const builtInMessages = { en, es, fr, de, pt, it }

const builtInLocales = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' }
]

function getCookieValue(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookieValue(name, value) {
  const maxAge = 60 * 60 * 24 * 365
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=lax`
}

export default async ({ app }, inject) => {
  const builtInCodes = Object.keys(builtInMessages)
  const savedLocale = getCookieValue('i18n_locale')
  const locale = savedLocale && builtInCodes.includes(savedLocale) ? savedLocale : 'en'

  const i18n = new VueI18n({
    locale,
    fallbackLocale: 'en',
    messages: builtInMessages
  })

  app.i18n = i18n

  const availableLocales = Vue.observable([...builtInLocales])

  // Load custom languages from DB
  if (process.client) {
    try {
      const res = await fetch('/api/languages/translations', { credentials: 'same-origin' })
      if (res.ok) {
        const response = await res.json()
        for (const [code, translations] of Object.entries(response.translations)) {
          i18n.setLocaleMessage(code, translations)
          const meta = response.metadata[code]
          if (meta && !availableLocales.find((l) => l.code === code)) {
            availableLocales.push({ code, name: meta.name, nativeName: meta.nativeName })
          }
        }
        if (savedLocale && response.translations[savedLocale]) {
          i18n.locale = savedLocale
        }
      }
    } catch {
      // DB unavailable — continue with built-in locales only
    }
  }

  inject('availableLocales', availableLocales)

  inject('setLocale', (newLocale) => {
    i18n.locale = newLocale
    setCookieValue('i18n_locale', newLocale)
  })

  inject('addLocale', (code, name, nativeName, translations) => {
    i18n.setLocaleMessage(code, translations)
    if (!availableLocales.find((l) => l.code === code)) {
      availableLocales.push({ code, name, nativeName })
    }
  })

  inject('removeLocale', (code) => {
    const idx = availableLocales.findIndex((l) => l.code === code)
    if (idx !== -1) availableLocales.splice(idx, 1)
    if (i18n.locale === code) {
      i18n.locale = 'en'
      setCookieValue('i18n_locale', 'en')
    }
  })

  inject('refreshLocales', async () => {
    try {
      const res = await fetch('/api/languages/translations', { credentials: 'same-origin' })
      if (!res.ok) return
      const response = await res.json()
      for (const [code, translations] of Object.entries(response.translations)) {
        i18n.setLocaleMessage(code, translations)
        const meta = response.metadata[code]
        if (meta && !availableLocales.find((l) => l.code === code)) {
          availableLocales.push({ code, name: meta.name, nativeName: meta.nativeName })
        }
      }
    } catch {
      // ignore
    }
  })
}
