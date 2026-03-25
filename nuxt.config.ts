export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxtjs/i18n"],
  i18n: {
    locales: [
      { code: "en", name: "English", file: "en.json" },
      { code: "es", name: "Español", file: "es.json" },
      { code: "fr", name: "Français", file: "fr.json" }
    ],
    defaultLocale: "en",
    lazy: true,
    langDir: "locales",
    strategy: "no_prefix",
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: "i18n_redirected",
      fallbackLocale: "en"
    }
  },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    public: {
      appName: "Sales Tracker (Nuxt)"
    }
  },
  nitro: {
    preset: "node-server"
  }
});
