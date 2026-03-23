export default defineNuxtRouteMiddleware(async (to) => {
  const { isAuthenticated, checkAuth, isCacheValid } = useAuth();

  // Only check auth if cache is invalid or on server-side render
  if (!isCacheValid() || import.meta.server) {
    await checkAuth();
  }

  if (to.path === "/login") {
    if (isAuthenticated.value) {
      return navigateTo("/dashboard");
    }
    return;
  }

  if (!isAuthenticated.value) {
    return navigateTo("/login");
  }
});
