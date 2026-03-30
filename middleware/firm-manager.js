export default defineNuxtRouteMiddleware(async () => {
  // This middleware is applied via definePageMeta on protected pages
  // Use cached auth state from useAuth (already validated by global auth middleware)
  const { isAuthenticated, user, checkAuth, isCacheValid } = useAuth();

  // If cache is valid, use it (instant check - no API call)
  if (isCacheValid()) {
    if (!isAuthenticated.value) {
      return navigateTo("/login");
    }
    if (user.value?.role !== "firm_manager") {
      return navigateTo("/dashboard");
    }
    return;
  }

  // Otherwise verify auth (will cache the result)
  const authenticated = await checkAuth();
  if (!authenticated) {
    return navigateTo("/login");
  }

  if (user.value?.role !== "firm_manager") {
    return navigateTo("/dashboard");
  }
});
