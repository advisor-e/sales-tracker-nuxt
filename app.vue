<script setup lang="ts">
const route = useRoute();
const navItems = [
  { to: "/home", label: "Home", className: "nav-home" },
  { to: "/dashboard", label: "Dashboard", className: "nav-dashboard" },
  { to: "/pipeline", label: "Pipeline", className: "nav-pipeline" },
  { to: "/team", label: "Team", className: "nav-team" },
  { to: "/coi", label: "COI", className: "nav-coi" },
  { to: "/", label: "Blog", className: "nav-blog" },
  { to: "/lists", label: "Lists", className: "nav-lists" }
] as const;
const auth = ref<{ authenticated: boolean; user: { email: string; displayName: string | null } | null }>({
  authenticated: false,
  user: null
});

async function refreshAuth() {
  try {
    auth.value = await $fetch("/api/auth/me");
  } catch {
    auth.value = { authenticated: false, user: null };
  }
}

async function logout() {
  await $fetch("/api/auth/logout", { method: "POST" });
  await refreshAuth();
  if (route.path !== "/login") {
    await navigateTo("/login");
  }
}

onMounted(refreshAuth);
watch(
  () => route.path,
  () => {
    refreshAuth();
  }
);
</script>

<template>
  <div class="app-shell">
    <header class="top-nav">
      <div class="brand-block">
        <strong>Sales Command Center</strong>
        <span v-if="auth.authenticated">{{ auth.user?.displayName || auth.user?.email }}</span>
      </div>
      <template v-if="auth.authenticated">
        <nav class="nav-links">
          <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to" :class="item.className">{{ item.label }}</NuxtLink>
        </nav>
        <button class="auth-btn" @click="logout">Sign Out</button>
      </template>
      <template v-else>
        <NuxtLink to="/login">Sign In</NuxtLink>
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

/* Home - Coral/warm gradient matching home page */
.nav-home { background: linear-gradient(120deg, #fff0ed, #fff4e6); border: 1px solid rgba(255, 180, 174, 0.4); color: #9a3412; }
.nav-home:hover { background: linear-gradient(120deg, #ffe4df, #ffead6); border-color: rgba(255, 159, 28, 0.5); }
.nav-home.router-link-active { background: linear-gradient(120deg, #ffd3cf, #ffb8ae); border-color: rgba(255, 140, 100, 0.6); color: #7c2d12; }

/* Dashboard - Purple/violet gradient matching dashboard page */
.nav-dashboard { background: linear-gradient(120deg, #f3f0ff, #ede9fe); border: 1px solid rgba(139, 92, 246, 0.3); color: #6d28d9; }
.nav-dashboard:hover { background: linear-gradient(120deg, #ede9fe, #e4d9fc); border-color: rgba(139, 92, 246, 0.45); }
.nav-dashboard.router-link-active { background: linear-gradient(120deg, #ddd6fe, #c4b5fd); border-color: rgba(139, 92, 246, 0.6); color: #5b21b6; }

/* Pipeline - Red gradient matching pipeline page */
.nav-pipeline { background: linear-gradient(120deg, #fff5f5, #fef2f2); border: 1px solid rgba(239, 68, 68, 0.3); color: #b91c1c; }
.nav-pipeline:hover { background: linear-gradient(120deg, #fee2e2, #fecaca); border-color: rgba(239, 68, 68, 0.45); }
.nav-pipeline.router-link-active { background: linear-gradient(120deg, #fecaca, #fca5a5); border-color: rgba(220, 38, 38, 0.6); color: #991b1b; }

/* Team - Blue gradient matching team page */
.nav-team { background: linear-gradient(120deg, #eff6ff, #dbeafe); border: 1px solid rgba(59, 130, 246, 0.3); color: #1d4ed8; }
.nav-team:hover { background: linear-gradient(120deg, #dbeafe, #bfdbfe); border-color: rgba(59, 130, 246, 0.45); }
.nav-team.router-link-active { background: linear-gradient(120deg, #bfdbfe, #93c5fd); border-color: rgba(67, 97, 238, 0.6); color: #1e40af; }

/* COI - Purple gradient matching COI page */
.nav-coi { background: linear-gradient(120deg, #faf5ff, #f3e8ff); border: 1px solid rgba(155, 93, 229, 0.3); color: #7c3aed; }
.nav-coi:hover { background: linear-gradient(120deg, #f3e8ff, #e9d5ff); border-color: rgba(155, 93, 229, 0.45); }
.nav-coi.router-link-active { background: linear-gradient(120deg, #e9d5ff, #d8b4fe); border-color: rgba(106, 76, 147, 0.6); color: #6b21a8; }

/* Blog - Green gradient matching blog page */
.nav-blog { background: linear-gradient(120deg, #f0fdf4, #dcfce7); border: 1px solid rgba(34, 197, 94, 0.3); color: #15803d; }
.nav-blog:hover { background: linear-gradient(120deg, #dcfce7, #bbf7d0); border-color: rgba(34, 197, 94, 0.45); }
.nav-blog.router-link-active { background: linear-gradient(120deg, #bbf7d0, #86efac); border-color: rgba(52, 211, 153, 0.6); color: #166534; }

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
