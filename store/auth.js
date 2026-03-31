const AUTH_CACHE_MS = 5 * 60 * 1000 // 5 minutes

export const state = () => ({
  authenticated: false,
  user: null,
  checkedAt: 0,
  checking: false
})

export const getters = {
  isAuthenticated: (state) => state.authenticated,
  user: (state) => state.user,
  isCacheValid: (state) => {
    if (process.server) return false
    return state.checkedAt > 0 && Date.now() - state.checkedAt < AUTH_CACHE_MS
  }
}

export const mutations = {
  SET_AUTH(state, { authenticated, user }) {
    state.authenticated = authenticated
    state.user = user || null
    state.checkedAt = Date.now()
  },
  SET_CHECKING(state, value) {
    state.checking = value
  },
  CLEAR_AUTH(state) {
    state.authenticated = false
    state.user = null
    state.checkedAt = 0
    state.checking = false
  }
}

export const actions = {
  async checkAuth({ state, commit, getters }, force = false) {
    if (state.checking) return state.authenticated
    if (!force && getters.isCacheValid) return state.authenticated

    commit('SET_CHECKING', true)
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
      const data = res.ok ? await res.json() : { authenticated: false, user: null }
      commit('SET_AUTH', { authenticated: Boolean(data.authenticated), user: data.user })
    } catch {
      commit('SET_AUTH', { authenticated: false, user: null })
    } finally {
      commit('SET_CHECKING', false)
    }

    return state.authenticated
  },

  async logout({ commit }) {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    } catch {
      // Ignore errors - still clear local state
    }
    commit('CLEAR_AUTH')
    commit('lists/CLEAR_LISTS', null, { root: true })
  }
}
