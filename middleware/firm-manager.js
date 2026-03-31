// Nuxt 2 middleware for firm_manager role protection
export default async function({ store, redirect }) {
  if (store.getters['auth/isCacheValid']) {
    if (!store.getters['auth/isAuthenticated']) {
      return redirect('/login')
    }
    if (store.getters['auth/user']?.role !== 'firm_manager') {
      return redirect('/dashboard')
    }
    return
  }

  const authenticated = await store.dispatch('auth/checkAuth')
  if (!authenticated) {
    return redirect('/login')
  }

  if (store.getters['auth/user']?.role !== 'firm_manager') {
    return redirect('/dashboard')
  }
}
