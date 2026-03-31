/**
 * CSRF Protection Plugin (client-only)
 * Patches global fetch to automatically add CSRF token header
 * to all state-changing requests.
 */
export default () => {
  const getCsrfToken = () => {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/)
    return match ? decodeURIComponent(match[1]) : null
  }

  const originalFetch = window.fetch

  window.fetch = function(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase()

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const token = getCsrfToken()
      if (token) {
        options.headers = {
          ...options.headers,
          'x-csrf-token': token
        }
      }
    }

    return originalFetch.call(this, url, options)
  }
}
