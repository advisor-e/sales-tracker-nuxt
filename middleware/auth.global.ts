// Cache auth state to avoid API calls on every navigation
let authCache: { authenticated: boolean; checkedAt: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === "/login") return;

  // Only run on client-side navigation (not initial SSR)
  if (import.meta.server) return;

  // Use cached auth if fresh
  const now = Date.now();
  if (authCache && (now - authCache.checkedAt) < CACHE_TTL) {
    if (!authCache.authenticated) {
      return navigateTo("/login");
    }
    return;
  }

  try {
    const auth = await $fetch<{ authenticated: boolean }>("/api/auth/me");
    authCache = { authenticated: auth.authenticated, checkedAt: now };

    if (!auth.authenticated) {
      return navigateTo("/login");
    }
  } catch {
    authCache = { authenticated: false, checkedAt: now };
    return navigateTo("/login");
  }
});
