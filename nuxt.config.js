module.exports = {
  // Server-side rendering
  ssr: true,
  target: 'server',

  // Environment variables exposed to client
  publicRuntimeConfig: {
    appName: 'Sales Tracker (Nuxt)'
  },

  // Server-only env vars (not exposed to client)
  privateRuntimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || ''
  },

  // Build
  build: {
    // Increase chunk size warning limit (Chart.js is large)
    extend(config) {
      // Webpack config extensions if needed
    }
  },

  // Plugins
  plugins: [
    '~/plugins/i18n.js',
    { src: '~/plugins/csrf.client.js', mode: 'client' }
  ],

  // Server middleware (Express API server replaces Nitro routes)
  serverMiddleware: [
    '~/server/middleware/security-headers.js',
    '~/server/middleware/csrf.js',
    { path: '/api', handler: '~/server/api/index.js' }
  ],

  // Router
  router: {
    middleware: ['auth']
  },

  // Modules
  modules: [],

  // Component auto-import (Nuxt 2 style)
  components: true,

  // Head defaults
  head: {
    title: 'Sales Tracker',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ]
  }
}
