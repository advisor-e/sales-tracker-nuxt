export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/login") {
    return;
  }

  const sessionCookie = useCookie<string | null>("st_session");
  if (!sessionCookie.value) {
    return navigateTo("/login");
  }
});
