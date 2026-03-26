export default defineNuxtConfig({
  devtools: { enabled: true },

  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || "",
    public: {
      appName: "Sales Tracker (Nuxt)"
    }
  },

  nitro: {
    preset: "node-server",
    // Enable compression for responses
    compressPublicAssets: true,
  },

  // Experimental optimizations
  experimental: {
    // Smaller hydration payload
    payloadExtraction: true,
    // Render JSON payloads with support for reviving complex types
    renderJsonPayloads: true,
  },

  // Build optimizations
  vite: {
    build: {
      // Increase chunk size warning limit (Chart.js is large)
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          // Manual chunking for better caching
          manualChunks: {
            // Separate Chart.js into its own chunk (loaded only when needed)
            'chart': ['chart.js', 'vue-chartjs'],
            // Separate vue-i18n
            'i18n': ['vue-i18n'],
            // Separate xlsx (large library for Excel)
            'xlsx': ['xlsx'],
          }
        }
      }
    },
    // Optimize deps
    optimizeDeps: {
      include: ['vue-i18n', 'chart.js', 'vue-chartjs']
    }
  },

  // Enable component auto-imports with tree-shaking
  components: {
    dirs: [
      {
        path: '~/components',
        pathPrefix: false,
      }
    ]
  },

  // TypeScript configuration
  typescript: {
    strict: true,
    shim: false
  }
});
