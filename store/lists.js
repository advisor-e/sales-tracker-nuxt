const LISTS_CACHE_MS = 5 * 60 * 1000 // 5 minutes

export const state = () => ({
  lists: {},
  loading: false,
  loaded: false,
  fetchTime: 0
})

export const getters = {
  isCacheValid: (state) => {
    if (process.server) return false
    return state.loaded && Date.now() - state.fetchTime < LISTS_CACHE_MS
  },
  getListItems: (state) => (key) => {
    return state.lists[key]?.items || []
  },
  getListColors: (state) => (key) => {
    return state.lists[key]?.colors || {}
  }
}

export const mutations = {
  SET_LISTS(state, lists) {
    state.lists = lists
    state.loaded = true
    state.fetchTime = Date.now()
  },
  SET_LOADING(state, value) {
    state.loading = value
  },
  UPDATE_LIST(state, { key, items, colors }) {
    if (state.lists[key]) {
      state.lists[key].items = items
      if (colors) state.lists[key].colors = colors
    }
  },
  CLEAR_LISTS(state) {
    state.loaded = false
    state.fetchTime = 0
  }
}

export const actions = {
  async fetchLists({ state, commit, getters }, force = false) {
    if (state.loading) return state.lists
    if (!force && getters.isCacheValid) return state.lists

    commit('SET_LOADING', true)
    try {
      const res = await fetch('/api/lists', { credentials: 'same-origin' })
      const data = res.ok ? await res.json() : { lists: {} }
      commit('SET_LISTS', data.lists || {})
    } catch (err) {
      console.error('Failed to fetch lists:', err)
    } finally {
      commit('SET_LOADING', false)
    }

    return state.lists
  },

  async saveList({ commit }, { key, items, colors }) {
    const csrfToken = document.cookie
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('csrf_token='))
      ?.split('=')[1] || ''

    try {
      const res = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'same-origin',
        body: JSON.stringify({ key, items, colors })
      })
      if (res.ok) {
        commit('UPDATE_LIST', { key, items, colors })
        return true
      }
    } catch (err) {
      console.error('Failed to save list:', err)
    }
    return false
  }
}
