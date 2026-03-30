export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === "/login") return;

  // Only run on client-side navigation (not initial SSR)
  if (import.meta.server) return;

  // Use cached auth state for fast navigation
  const { checkAuth, isCacheValid, isAuthenticated } = useAuth();

  // If cache is valid, use cached state (instant navigation)
  if (isCacheValid()) {
    if (!isAuthenticated.value) {
      return navigateTo("/login");
    }
    return;
  }

  // Otherwise check auth (will cache the result)
  const authenticated = await checkAuth();
  if (!authenticated) {
    return navigateTo("/login");
  }
});
