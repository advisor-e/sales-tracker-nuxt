// Nuxt 2 global middleware (registered in nuxt.config.js router.middleware)
export default async function({ store, redirect, route }) {
  // Skip auth check for login page
  if (route.path === '/login') return

  // Only run on client
  if (process.server) return

  // Use cached auth state for fast navigation
  if (store.getters['auth/isCacheValid']) {
    if (!store.getters['auth/isAuthenticated']) {
      return redirect('/login')
    }
    return
  }

  // Otherwise check auth (will cache the result)
  const authenticated = await store.dispatch('auth/checkAuth')
  if (!authenticated) {
    return redirect('/login')
  }
}
