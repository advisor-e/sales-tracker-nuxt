<script setup lang="ts">
import type { DashboardMetrics, TeamSummaryRow, CoiEntry, PipelineEntry } from "~/types/sales";

const metrics = ref<DashboardMetrics | null>(null);
const teamRows = ref<TeamSummaryRow[]>([]);
const coiRows = ref<CoiEntry[]>([]);
const pipelineRows = ref<PipelineEntry[]>([]);
const errorText = ref("");

async function loadHomeData() {
  errorText.value = "";
  try {
    const [metricsRes, teamRes, coiRes, pipelineRes] = await Promise.all([
      $fetch<DashboardMetrics>("/api/dashboard/metrics"),
      $fetch<{ items: TeamSummaryRow[] }>("/api/team/summary"),
      $fetch<{ items: CoiEntry[] }>("/api/coi"),
      $fetch<{ items: PipelineEntry[] }>("/api/pipeline")
    ]);
    metrics.value = metricsRes;
    teamRows.value = teamRes.items;
    coiRows.value = coiRes.items;
    pipelineRows.value = pipelineRes.items.slice(0, 8);
  } catch (error: unknown) {
    const e = error as { statusCode?: number; data?: { statusCode?: number; statusMessage?: string; message?: string }; message?: string };
    const status = Number(e?.statusCode || e?.data?.statusCode || 0);
    if (status === 401) {
      await navigateTo("/login");
      return;
    }
    errorText.value = String(e?.data?.statusMessage || e?.data?.message || e?.message || "Failed to load home data");
  }
}

onMounted(loadHomeData);
</script>

<template>
  <section class="home-page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">Home</span>
          <h1>Sales Command Center</h1>
          <p>Navigate between dashboard, pipeline, team, COI, and blog views</p>
        </div>
      </div>
    </header>

    <p v-if="errorText" class="error">{{ errorText }}</p>

    <section v-if="metrics" class="home-kpis">
      <article class="metric-card coral"><h3>Filtered Prospects</h3><p>{{ metrics.totalProspects }}</p></article>
      <article class="metric-card sky"><h3>Active Staff Entries</h3><p>{{ teamRows.length }}</p></article>
      <article class="metric-card sun"><h3>Secured Value</h3><p>${{ Number(metrics.workSecured || 0).toLocaleString() }}</p></article>
      <article class="metric-card mint"><h3>COI Records</h3><p>{{ coiRows.length }}</p></article>
    </section>

    <section class="quick-links">
      <NuxtLink to="/dashboard" class="quick-link"><strong>Dashboard</strong><span>Top-line KPIs for approaches, meetings, proposals, and secured work.</span></NuxtLink>
      <NuxtLink to="/dashboard" class="quick-link"><strong>Dashboard Charts</strong><span>See the KPI summary and visual trends together in one place.</span></NuxtLink>
      <NuxtLink to="/pipeline" class="quick-link"><strong>Pipeline</strong><span>Detailed pipeline table with the working prospect view.</span></NuxtLink>
      <NuxtLink to="/team" class="quick-link"><strong>Team</strong><span>Open the team report without digging through tabs.</span></NuxtLink>
      <NuxtLink to="/coi" class="quick-link"><strong>COI</strong><span>Jump straight to referral development activity and records.</span></NuxtLink>
      <NuxtLink to="/" class="quick-link"><strong>Blog</strong><span>Open the content workflow, saved inputs, drafts, and final posts.</span></NuxtLink>
    </section>

    <section class="home-columns">
      <article class="panel preview-panel">
        <h2>Today at a Glance</h2>
        <table>
          <thead>
            <tr>
              <th>Prospect Name</th>
              <th>Business Name</th>
              <th>Team Member</th>
              <th>Status</th>
              <th>Secured Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pipelineRows" :key="item.id">
              <td>{{ item.prospectName }}</td>
              <td>{{ item.businessName || 'N/A' }}</td>
              <td>{{ item.leadStaff || 'Unassigned' }}</td>
              <td>{{ item.prospectStatus }}</td>
              <td>${{ Number(item.jobSecuredValue || 0).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="panel info-panel">
        <h2>What Each Section Gives You</h2>
        <p class="info blue">Dashboard now includes both headline numbers and charts.</p>
        <p class="info green">Visual trends sit directly under the KPI summary.</p>
        <p class="info gold">Pipeline is the working view for exporting and follow-up.</p>
        <p class="caption">Team rows loaded: {{ teamRows.length }} | COI rows loaded: {{ coiRows.length }}</p>
      </article>
    </section>
  </section>
</template>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: 1rem; min-height: 100vh; padding: 1.5rem; }
.page-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 180, 100, 0.25) 0%, transparent 40%),
    linear-gradient(135deg, #ff7a1a 0%, #f26200 25%, #d95700 50%, #c24e00 75%, #a34200 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(242, 98, 0, 0.35),
    0 8px 25px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.08) 50%, transparent 70%);
  transform: rotate(25deg);
  pointer-events: none;
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.header-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}
.header-text h1 { margin: 0; font-size: 2rem; font-weight: 700; line-height: 1.2; }
.header-text p { margin: 0.5rem 0 0; opacity: 0.9; font-size: 0.95rem; line-height: 1.4; max-width: 400px; }

.home-kpis { display: grid; gap: 0.62rem; grid-template-columns: repeat(4, minmax(160px, 1fr)); }
.metric-card { border-radius: 18px; padding: 1rem; box-shadow: 0 12px 28px rgba(16, 50, 74, 0.08); }
.metric-card h3 { margin: 0; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; opacity: 0.78; }
.metric-card p { margin: 0.35rem 0 0; font-size: 1.42rem; font-weight: 800; }
.coral { background: linear-gradient(135deg, #ffedd5, #fed7aa); }
.sky { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.sun { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.mint { background: linear-gradient(135deg, #ffedd5, #ffddc1); }

.quick-links { display: grid; gap: 0.62rem; grid-template-columns: repeat(3, minmax(0, 1fr)); }
.quick-link {
  display: grid;
  gap: 0.35rem;
  text-decoration: none;
  color: #123055;
  background: #ffffff;
  border: 1px solid rgba(114, 135, 161, 0.2);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(16, 50, 74, 0.08);
  padding: 0.78rem 0.82rem;
}
.quick-link strong { font-size: 0.9rem; }
.quick-link span { color: #4a617f; line-height: 1.35; font-size: 0.82rem; }

.home-columns { display: grid; gap: 0.75rem; grid-template-columns: 1.3fr 1fr; }
.panel {
  background: #ffffff;
  border: 1px solid rgba(114, 135, 161, 0.2);
  border-radius: 18px;
  box-shadow: 0 12px 28px rgba(16, 50, 74, 0.08);
  padding: 0.72rem;
}
.panel h2 { margin: 0 0 0.58rem; color: #123055; font-size: 1rem; }
table { width: 100%; border-collapse: collapse; min-width: 640px; }
th, td { padding: 0.38rem 0.45rem; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 0.82rem; line-height: 1.25; }
thead th { background: #f7fbff; color: #1e3d60; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; }

.info-panel { display: grid; align-content: start; gap: 0.55rem; }
.info { margin: 0; padding: 0.56rem 0.62rem; border-radius: 12px; font-size: 0.84rem; font-weight: 700; }
.info.blue { background: #fff7ed; color: #9a3412; }
.info.green { background: #ffedd5; color: #c2410c; }
.info.gold { background: #fef3c7; color: #92400e; }
.caption { margin: 0.2rem 0 0; color: #5b708d; font-size: 0.84rem; }
.error { color: #b91c1c; font-weight: 700; }

@media (max-width: 1080px) {
  .home-kpis { grid-template-columns: repeat(2, minmax(160px, 1fr)); }
  .quick-links { grid-template-columns: 1fr 1fr; }
  .home-columns { grid-template-columns: 1fr; }
}

@media (max-width: 760px) {
  .quick-links, .home-kpis { grid-template-columns: 1fr; }
}
</style>