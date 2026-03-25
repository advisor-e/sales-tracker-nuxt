export default defineNuxtRouteMiddleware(async () => {
  // This middleware is applied via definePageMeta on protected pages
  try {
    const auth = await $fetch<{ authenticated: boolean; user: { role: string } | null }>("/api/auth/me");

    if (!auth.authenticated) {
      return navigateTo("/login");
    }

    if (auth.user?.role !== "firm_manager") {
      // Redirect advisors to dashboard
      return navigateTo("/dashboard");
    }
  } catch {
    return navigateTo("/login");
  }
});
