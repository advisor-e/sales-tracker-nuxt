<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { type UserRole } from "~/composables/useAuth";

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
const { isAuthenticated, user, checkAuth, logout: authLogout } = useAuth();

const allNavItems = [
  { to: "/home", labelKey: "nav.home", className: "nav-home" },
  { to: "/dashboard", labelKey: "nav.dashboard", className: "nav-dashboard" },
  { to: "/pipeline", labelKey: "nav.pipeline", className: "nav-pipeline" },
  { to: "/team", labelKey: "nav.team", className: "nav-team", requiredRole: "firm_manager" as UserRole },
  { to: "/coi", labelKey: "nav.coi", className: "nav-coi" },
  { to: "/", labelKey: "nav.blog", className: "nav-blog" },
  { to: "/lists", labelKey: "nav.lists", className: "nav-lists", requiredRole: "firm_manager" as UserRole }
];

// Show nav if authenticated OR if on a protected route (not login page)
// This prevents nav from disappearing during auth check
const showNav = computed(() => {
  return isAuthenticated.value || (route.path !== "/login");
});

// Filter nav items based on user role
const navItems = computed(() => {
  const userRole = user.value?.role || "advisor";
  return allNavItems.filter(item => {
    if (!item.requiredRole) return true;
    return userRole === item.requiredRole || userRole === "firm_manager";
  });
});

async function handleLogout() {
  await authLogout();
  if (route.path !== "/login") {
    await navigateTo("/login");
  }
}

// Check auth on mount (uses cache if valid)
onMounted(() => checkAuth());
</script>

<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="brand-block">
        <strong>{{ t('app.title') }}</strong>
        <ClientOnly>
          <span v-if="showNav">{{ user?.displayName || user?.email }}</span>
        </ClientOnly>
      </div>
      <template v-if="showNav">
        <nav class="nav-links">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" :class="item.className">{{ t(item.labelKey) }}</NuxtLink>
        </nav>
        <LanguageSwitcher />
        <button class="auth-btn" @click="handleLogout">{{ t('auth.signOut') }}</button>
      </template>
      <template v-else>
        <LanguageSwitcher />
        <NuxtLink to="/login">{{ t('auth.signIn') }}</NuxtLink>
      </template>
    </header>
    <main class="page-content">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --bg: #f2f5f8;
  --surface: #ffffff;
  --surface-2: #f8fafc;
  --ink: #11253f;
  --ink-muted: #4a617f;
  --line: #d4dde7;
  --brand: #0f7a8a;
  --brand-2: #1ca4b8;
  --accent: #f59e0b;
  --good: #10b981;
  --bad: #dc2626;
  --shadow: 0 12px 35px rgba(17, 37, 63, 0.08);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  font-family: "Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body,
input,
button,
select,
textarea {
  font-family: inherit;
}

body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at top right, rgba(255, 209, 102, 0.35) 0%, rgba(242, 245, 248, 0) 24%),
    radial-gradient(circle at left top, rgba(76, 201, 240, 0.18) 0%, rgba(242, 245, 248, 0) 30%),
    radial-gradient(circle at bottom right, rgba(255, 107, 107, 0.14) 0%, rgba(242, 245, 248, 0) 26%),
    linear-gradient(180deg, #f5f9fc 0%, #eef4f6 100%);
}

.app-shell {
  min-height: 100vh;
  background: transparent;
}

.top-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.6rem;
  flex-wrap: wrap;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--line);
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.96) 0%, rgba(244, 251, 252, 0.92) 100%);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 20;
}

.nav-links {
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.brand-block {
  margin-right: auto;
  display: grid;
  gap: 0.1rem;
}

.brand-block strong {
  font-size: 0.98rem;
  letter-spacing: 0.02em;
}

.brand-block span {
  font-size: 0.78rem;
  color: var(--ink-muted);
}

.top-nav a {
  padding: 0.44rem 0.82rem;
  border-radius: 999px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s ease;
}

.top-nav a.router-link-active {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(17, 37, 63, 0.12);
}

.top-nav a:hover {
  transform: translateY(-1px);
}

/* Home - Orange #f26200 */
.nav-home { background: linear-gradient(120deg, #fff4ed, #ffefe6); border: 1px solid rgba(242, 98, 0, 0.3); color: #c24e00; }
.nav-home:hover { background: linear-gradient(120deg, #ffe8d9, #ffdcc6); border-color: rgba(242, 98, 0, 0.45); }
.nav-home.router-link-active { background: linear-gradient(120deg, #ffd4b8, #ffc49e); border-color: rgba(242, 98, 0, 0.6); color: #a34200; }

/* Dashboard - Cyan #00b1e0 */
.nav-dashboard { background: linear-gradient(120deg, #e6f9ff, #d9f5fc); border: 1px solid rgba(0, 177, 224, 0.3); color: #008db3; }
.nav-dashboard:hover { background: linear-gradient(120deg, #ccf2fc, #b3ecfa); border-color: rgba(0, 177, 224, 0.45); }
.nav-dashboard.router-link-active { background: linear-gradient(120deg, #99e5f7, #66d9f2); border-color: rgba(0, 177, 224, 0.6); color: #007a99; }

/* Pipeline - Navy #002b64 */
.nav-pipeline { background: linear-gradient(120deg, #e6eef8, #dce6f4); border: 1px solid rgba(0, 43, 100, 0.3); color: #002b64; }
.nav-pipeline:hover { background: linear-gradient(120deg, #ccdcef, #b3cbe6); border-color: rgba(0, 43, 100, 0.45); }
.nav-pipeline.router-link-active { background: linear-gradient(120deg, #99b8db, #6695c9); border-color: rgba(0, 43, 100, 0.6); color: #001a3d; }

/* Team - Light Blue #7fd3f1 */
.nav-team { background: linear-gradient(120deg, #f0fafd, #e6f7fc); border: 1px solid rgba(127, 211, 241, 0.4); color: #2a9bc7; }
.nav-team:hover { background: linear-gradient(120deg, #d9f3fa, #c6edf8); border-color: rgba(127, 211, 241, 0.55); }
.nav-team.router-link-active { background: linear-gradient(120deg, #b3e8f5, #8cddf0); border-color: rgba(127, 211, 241, 0.7); color: #1e7a9e; }

/* COI - Green #1f9d40 */
.nav-coi { background: linear-gradient(120deg, #e8f7ec, #dcf4e3); border: 1px solid rgba(31, 157, 64, 0.3); color: #1a8537; }
.nav-coi:hover { background: linear-gradient(120deg, #c8edcf, #b3e6be); border-color: rgba(31, 157, 64, 0.45); }
.nav-coi.router-link-active { background: linear-gradient(120deg, #99dba8, #66cc7a); border-color: rgba(31, 157, 64, 0.6); color: #156d2d; }

/* Blog - Magenta #d015d5 */
.nav-blog { background: linear-gradient(120deg, #fce8fc, #fadcfa); border: 1px solid rgba(208, 21, 213, 0.3); color: #a611aa; }
.nav-blog:hover { background: linear-gradient(120deg, #f7ccf7, #f4b8f4); border-color: rgba(208, 21, 213, 0.45); }
.nav-blog.router-link-active { background: linear-gradient(120deg, #ee99ee, #e566e5); border-color: rgba(208, 21, 213, 0.6); color: #8a0e8e; }

/* Lists - Cyan/teal gradient matching lists page */
.nav-lists { background: linear-gradient(120deg, #ecfeff, #cffafe); border: 1px solid rgba(8, 145, 178, 0.3); color: #0e7490; }
.nav-lists:hover { background: linear-gradient(120deg, #cffafe, #a5f3fc); border-color: rgba(8, 145, 178, 0.45); }
.nav-lists.router-link-active { background: linear-gradient(120deg, #a5f3fc, #67e8f9); border-color: rgba(6, 182, 212, 0.6); color: #0891b2; }

.auth-btn {
  padding: 0.44rem 0.82rem;
  border: 1px solid rgba(220, 38, 38, 0.28);
  border-radius: 999px;
  background: #fff5f5;
  color: #9f1239;
  font-weight: 600;
  cursor: pointer;
}

.page-content {
  max-width: 1320px;
  margin: 0 auto;
  padding: 0.95rem 1rem;
}

.dense-table {
  width: 100%;
  border-collapse: collapse;
}

.dense-table th,
.dense-table td {
  border-bottom: 1px solid #dbe5ef;
  font-size: 0.82rem;
  line-height: 1.25;
  padding: 0.38rem 0.45rem;
  text-align: left;
  vertical-align: middle;
}

.dense-table thead th {
  background: #f1f6fb;
  color: #1e3d60;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  position: sticky;
  text-transform: uppercase;
  top: 0;
  z-index: 2;
}

.dense-control {
  border: 1px solid #c8d6e5;
  border-radius: 8px;
  font: inherit;
  font-size: 0.84rem;
  line-height: 1.2;
  padding: 0.36rem 0.48rem;
}

.dense-button {
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.1;
  padding: 0.34rem 0.48rem;
}

@media (max-width: 780px) {
  .top-nav {
    justify-content: stretch;
  }

  .nav-links {
    width: 100%;
  }
}
</style>
