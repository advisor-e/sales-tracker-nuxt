<script setup lang="ts">
import type { TeamSummaryRow } from "~/types/sales";

const rows = ref<TeamSummaryRow[]>([]);
const loading = ref(false);
const errorText = ref("");

const totalSecuredValue = computed(() => rows.value.reduce((sum, row) => sum + row.totalSecuredValue, 0));
const totalProspects = computed(() => rows.value.reduce((sum, row) => sum + row.prospects, 0));
const totalProposals = computed(() => rows.value.reduce((sum, row) => sum + row.proposalsSent, 0));

async function loadRows() {
  loading.value = true;
  errorText.value = "";
  try {
    const res = await $fetch<{ items: TeamSummaryRow[] }>("/api/team/summary");
    rows.value = res.items;
  } catch (error: unknown) {
    const e = error as { statusCode?: number; data?: { statusCode?: number; statusMessage?: string; message?: string }; message?: string };
    const status = Number(e?.statusCode || e?.data?.statusCode || 0);
    if (status === 401) {
      errorText.value = "Session expired. Redirecting to sign in...";
      await navigateTo("/login");
      return;
    }
    errorText.value = String(e?.data?.statusMessage || e?.data?.message || e?.message || "Failed to load team summary");
  } finally {
    loading.value = false;
  }
}

onMounted(loadRows);
</script>

<template>
  <section class="page-wrap">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">Team</span>
          <h1>Team Performance</h1>
          <p>Track team metrics, proposals, and secured work at a glance</p>
        </div>
        <button class="refresh-btn" @click="loadRows">Refresh</button>
      </div>
    </header>

    <section class="summary-strip">
      <article><span>Team Members</span><strong>{{ rows.length }}</strong></article>
      <article><span>Total Prospects</span><strong>{{ totalProspects }}</strong></article>
      <article><span>Proposals Sent</span><strong>{{ totalProposals }}</strong></article>
      <article><span>Secured Value</span><strong>${{ totalSecuredValue.toLocaleString() }}</strong></article>
    </section>

    <p v-if="errorText" class="error">{{ errorText }}</p>
    <p v-if="loading">Loading team summary...</p>

    <section class="card">
      <table>
        <thead>
          <tr>
            <th>Team Member</th>
            <th>Prospects</th>
            <th>Approaches</th>
            <th>Meetings</th>
            <th>Proposals</th>
            <th>Proposal Value</th>
            <th>Secured</th>
            <th>Secured Value</th>
            <th>Approach Conv</th>
            <th>Avg Proposal</th>
            <th>Secured Conv</th>
            <th>Active</th>
            <th>Await Research</th>
            <th>Completed</th>
            <th>Dead</th>
            <th>On Hold</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.leadStaff">
            <td>{{ row.leadStaff }}</td>
            <td>{{ row.prospects }}</td>
            <td>{{ row.approachesMade }}</td>
            <td>{{ row.secureMeetings }}</td>
            <td>{{ row.proposalsSent }}</td>
            <td>${{ row.totalProposalValue.toLocaleString() }}</td>
            <td>{{ row.engagementsSecured }}</td>
            <td>${{ row.totalSecuredValue.toLocaleString() }}</td>
            <td>{{ (row.avgApproachConversion * 100).toFixed(1) }}%</td>
            <td>${{ row.avgProposalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}</td>
            <td>{{ (row.avgSecuredConversion * 100).toFixed(1) }}%</td>
            <td>{{ row.active }}</td>
            <td>{{ row.awaitResearch }}</td>
            <td>{{ row.completed }}</td>
            <td>{{ row.dead }}</td>
            <td>{{ row.onHold }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </section>
</template>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(76, 201, 240, 0.15) 0%, transparent 30%),
    radial-gradient(circle at bottom right, rgba(147, 197, 253, 0.2) 0%, transparent 35%),
    linear-gradient(180deg, #f0f7ff 0%, #e0efff 100%);
}
.page-header {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%);
  border-radius: 20px;
  padding: 2rem;
  color: white;
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
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
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  color: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.refresh-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
.card {
  border: 1px solid rgba(114, 135, 161, 0.25);
  border-radius: 14px;
  background: linear-gradient(175deg, #ffffff 0%, #f7fbff 100%);
  padding: 0.72rem;
  overflow: auto;
  box-shadow: 0 10px 24px rgba(17, 37, 63, 0.07);
}
.summary-strip { display: grid; gap: 0.58rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.summary-strip article {
  border-radius: 18px;
  padding: 0.62rem 0.7rem;
  background: linear-gradient(180deg, #ebf5ff, #dbeafe);
  box-shadow: 0 12px 28px rgba(67, 97, 238, 0.12);
}
.summary-strip span { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #1d4ed8; }
.summary-strip strong { display: block; margin-top: 0.2rem; font-size: 1.2rem; color: #1e3a8a; }
button {
  border: 1px solid rgba(15, 122, 138, 0.35);
  border-radius: 10px;
  padding: 0.34rem 0.48rem;
  background: rgba(255, 255, 255, 0.82);
  color: #1e3a8a;
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.1;
  cursor: pointer;
}
table { width: 100%; border-collapse: collapse; min-width: 980px; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 0.38rem 0.45rem; text-align: left; font-size: 0.82rem; line-height: 1.25; }
thead th {
  background: #f1f6fb;
  color: #1e3d60;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.error { color: #b91c1c; font-weight: 700; }
@media (max-width: 980px) { .summary-strip { grid-template-columns: 1fr; } }
</style>
