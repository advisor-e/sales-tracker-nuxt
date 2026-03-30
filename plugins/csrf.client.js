/**
 * CSRF Protection Plugin
 * Automatically adds CSRF token header to all state-changing requests
 */
export default defineNuxtPlugin(() => {
  const getCsrfToken = () => {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  // Intercept global fetch to add CSRF header
  const originalFetch = globalThis.$fetch;

  globalThis.$fetch = ((url, options = {}) => {
    const method = (options.method || "GET").toUpperCase();

    // Add CSRF token for state-changing methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const token = getCsrfToken();
      if (token) {
        options.headers = {
          ...options.headers,
          "x-csrf-token": token
        };
      }
    }

    return originalFetch(url, options);
  });
});
