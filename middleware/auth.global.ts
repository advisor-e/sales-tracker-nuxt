export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === "/login") return;

  try {
    const auth = await $fetch<{ authenticated: boolean }>("/api/auth/me");

    if (!auth.authenticated) {
      return navigateTo("/login");
    }
  } catch {
    return navigateTo("/login");
  }
});
