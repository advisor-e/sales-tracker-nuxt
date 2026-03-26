<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Doughnut, Bar, Line } from 'vue-chartjs';
import type { DashboardMetrics } from "~/types/sales";

const { t } = useI18n({ useScope: 'global' });

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const metrics = ref<DashboardMetrics | null>(null);
const loading = ref(false);
const errorText = ref("");

const money = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 });

// Color palettes - cyan-based for dashboard theme (#00b1e0)
const colors = {
  primary: ['#00b1e0', '#0ea5e9', '#38bdf8', '#67e8f9', '#a5f3fc'],
  cool: ['#00b1e0', '#0ea5e9', '#3b82f6', '#0891b2', '#06b6d4'],
  warm: ['#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'],
  earth: ['#78716c', '#a8a29e', '#0d9488', '#0891b2', '#0284c7'],
  vibrant: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#00b1e0', '#0ea5e9', '#38bdf8'],
};

// Combined funnel rates (Campaign + Total Needs)
const combinedApproaches = computed(() =>
  (metrics.value?.campaignFunnel?.approaches || 0) + (metrics.value?.totalNeedsFunnel?.approaches || 0)
);
const combinedMeetings = computed(() =>
  (metrics.value?.campaignFunnel?.meetings || 0) + (metrics.value?.totalNeedsFunnel?.meetings || 0)
);
const combinedProposals = computed(() =>
  (metrics.value?.campaignFunnel?.proposals || 0) + (metrics.value?.totalNeedsFunnel?.proposals || 0)
);
const combinedSecured = computed(() =>
  (metrics.value?.campaignFunnel?.secured || 0) + (metrics.value?.totalNeedsFunnel?.secured || 0)
);

const combinedMeetingRate = computed(() => {
  const approaches = combinedApproaches.value;
  return approaches ? Math.round((combinedMeetings.value / approaches) * 100) : 0;
});

const combinedProposalRate = computed(() => {
  const meetings = combinedMeetings.value;
  return meetings ? Math.round((combinedProposals.value / meetings) * 100) : 0;
});

const combinedSecuredRate = computed(() => {
  const proposals = combinedProposals.value;
  return proposals ? Math.round((combinedSecured.value / proposals) * 100) : 0;
});

const combinedOverallRate = computed(() => {
  const approaches = combinedApproaches.value;
  return approaches ? Math.round((combinedSecured.value / approaches) * 100) : 0;
});

// Campaign funnel rates
const campaignMeetingRate = computed(() => {
  const approaches = metrics.value?.campaignFunnel?.approaches || 0;
  return approaches ? Math.round(((metrics.value?.campaignFunnel?.meetings || 0) / approaches) * 100) : 0;
});

const campaignProposalRate = computed(() => {
  const meetings = metrics.value?.campaignFunnel?.meetings || 0;
  return meetings ? Math.round(((metrics.value?.campaignFunnel?.proposals || 0) / meetings) * 100) : 0;
});

const campaignSecuredRate = computed(() => {
  const proposals = metrics.value?.campaignFunnel?.proposals || 0;
  return proposals ? Math.round(((metrics.value?.campaignFunnel?.secured || 0) / proposals) * 100) : 0;
});

const campaignOverallRate = computed(() => {
  const approaches = metrics.value?.campaignFunnel?.approaches || 0;
  return approaches ? Math.round(((metrics.value?.campaignFunnel?.secured || 0) / approaches) * 100) : 0;
});

// Total Needs funnel rates
const totalNeedsMeetingRate = computed(() => {
  const approaches = metrics.value?.totalNeedsFunnel?.approaches || 0;
  return approaches ? Math.round(((metrics.value?.totalNeedsFunnel?.meetings || 0) / approaches) * 100) : 0;
});

const totalNeedsProposalRate = computed(() => {
  const meetings = metrics.value?.totalNeedsFunnel?.meetings || 0;
  return meetings ? Math.round(((metrics.value?.totalNeedsFunnel?.proposals || 0) / meetings) * 100) : 0;
});

const totalNeedsSecuredRate = computed(() => {
  const proposals = metrics.value?.totalNeedsFunnel?.proposals || 0;
  return proposals ? Math.round(((metrics.value?.totalNeedsFunnel?.secured || 0) / proposals) * 100) : 0;
});

const totalNeedsOverallRate = computed(() => {
  const approaches = metrics.value?.totalNeedsFunnel?.approaches || 0;
  return approaches ? Math.round(((metrics.value?.totalNeedsFunnel?.secured || 0) / approaches) * 100) : 0;
});

// Status colors mapped to specific statuses
const statusColors: Record<string, string> = {
  'Active': '#22c55e',      // Green
  'Await Research': '#f59e0b', // Amber
  'Completed': '#3b82f6',   // Blue
  'Dead': '#ef4444',        // Red
  'On Hold': '#0891b2',     // Cyan/Teal
};

// High contrast colors for sources
const sourceColors = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
];

// Chart data configurations
const statusPieData = computed(() => {
  const breakdown = metrics.value?.statusBreakdown || [];
  return {
    labels: breakdown.map(s => `${s.status} (${s.count})`),
    datasets: [{
      data: breakdown.map(s => s.count),
      backgroundColor: breakdown.map(s => statusColors[s.status] || '#64748b'),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 10
    }]
  };
});

const sourceDoughnutData = computed(() => {
  const breakdown = metrics.value?.sourceBreakdown || [];
  return {
    labels: breakdown.map(s => `${s.source} (${s.count})`),
    datasets: [{
      data: breakdown.map(s => s.count),
      backgroundColor: breakdown.map((_, i) => sourceColors[i % sourceColors.length]),
      borderColor: '#ffffff',
      borderWidth: 3,
      hoverOffset: 8
    }]
  };
});

const staffBarData = computed(() => ({
  labels: metrics.value?.staffSecuredBreakdown.map(s => s.leadStaff) || [],
  datasets: [{
    label: 'Work Secured ($)',
    data: metrics.value?.staffSecuredBreakdown.map(s => s.value) || [],
    backgroundColor: (ctx: any) => {
      const gradient = ctx.chart.ctx.createLinearGradient(0, 0, ctx.chart.width, 0);
      gradient.addColorStop(0, '#00b1e0');
      gradient.addColorStop(1, '#38bdf8');
      return gradient;
    },
    borderRadius: 6,
    borderSkipped: false,
  }]
}));

const coiIndustryBarData = computed(() => ({
  labels: metrics.value?.coiIndustryBreakdown.map(s => s.industry) || [],
  datasets: [{
    label: 'Relationships',
    data: metrics.value?.coiIndustryBreakdown.map(s => s.relationships) || [],
    backgroundColor: colors.warm,
    borderRadius: 8,
    borderSkipped: false,
  }]
}));

const coiPerformanceBarData = computed(() => ({
  labels: ['Could We', 'How Would We', 'Will We', 'Test/Review'],
  datasets: [{
    label: 'COI Status',
    data: [
      metrics.value?.coiPerformance.couldWe || 0,
      metrics.value?.coiPerformance.howWouldWe || 0,
      metrics.value?.coiPerformance.willWe || 0,
      metrics.value?.coiPerformance.testReview || 0
    ],
    backgroundColor: [
      '#f97316', // Orange - Could We
      '#eab308', // Yellow - How Would We
      '#22c55e', // Green - Will We
      '#06b6d4'  // Cyan - Test/Review
    ],
    borderRadius: 6,
    borderSkipped: false,
    barThickness: 24,
  }]
}));

const monthlyTrendData = computed(() => ({
  labels: metrics.value?.monthlySecuredTrend.map(s => s.month) || [],
  datasets: [{
    label: 'Secured Value',
    data: metrics.value?.monthlySecuredTrend.map(s => s.value) || [],
    borderColor: '#00b1e0',
    backgroundColor: (ctx: any) => {
      const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
      gradient.addColorStop(0, 'rgba(0, 177, 224, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 177, 224, 0.02)');
      return gradient;
    },
    fill: true,
    tension: 0.4,
    pointBackgroundColor: '#00b1e0',
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
    pointRadius: 5,
    pointHoverRadius: 7,
  }]
}));

// Chart options
const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        padding: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { size: 11 }
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((context.raw / total) * 100);
          return ` ${context.raw} (${percentage}%)`;
        }
      }
    }
  }
};

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '55%',
  plugins: {
    legend: {
      position: 'right' as const,
      labels: {
        padding: 12,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { size: 11 }
      }
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = Math.round((context.raw / total) * 100);
          return ` ${context.raw} (${percentage}%)`;
        }
      }
    }
  }
};

const horizontalBarOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        callback: (value: any) => '$' + (value / 1000).toFixed(0) + 'k'
      }
    },
    y: {
      grid: { display: false },
      ticks: { font: { weight: 'bold' as const } }
    }
  }
};

const verticalBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { weight: 'normal' as const } }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      beginAtZero: true
    }
  }
};

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } }
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.05)' },
      ticks: {
        callback: (value: any) => '$' + (value / 1000).toFixed(0) + 'k'
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
};

async function loadMetrics() {
  loading.value = true;
  errorText.value = "";
  try {
    metrics.value = await $fetch<DashboardMetrics>("/api/dashboard/metrics");
  } catch (error: unknown) {
    const e = error as { statusCode?: number; data?: { statusCode?: number; statusMessage?: string; message?: string }; message?: string };
    const status = Number(e?.statusCode || e?.data?.statusCode || 0);
    if (status === 401) {
      errorText.value = "Session expired. Redirecting to sign in...";
      await navigateTo("/login");
      return;
    }
    errorText.value = String(e?.data?.statusMessage || e?.data?.message || e?.message || "Failed to load dashboard metrics");
  } finally {
    loading.value = false;
  }
}

onMounted(loadMetrics);
</script>

<template>
  <div class="dashboard">
    <!-- Header -->
    <header class="dashboard-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">{{ t('dashboard.badge') }}</span>
          <h1>{{ t('dashboard.title') }}</h1>
          <p>{{ t('dashboard.subtitle') }}</p>
        </div>
        <button class="refresh-btn" @click="loadMetrics" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          {{ loading ? t('common.loading') : t('common.refresh') }}
        </button>
      </div>
    </header>

    <p v-if="errorText" class="error-message">{{ errorText }}</p>

    <div v-if="loading && !metrics" class="loading-state">
      <div class="spinner"></div>
      <p>{{ t('common.loadingDashboard') }}</p>
    </div>

    <template v-if="metrics">
      <!-- Combined Performance Stats -->
      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.totalProspects') }}</span>
            <span class="stat-badge blue">{{ t('dashboard.pipeline') }}</span>
          </div>
          <strong class="stat-value">{{ metrics.totalProspects }}</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ metrics.activeProspects }} {{ t('common.active') }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.approachMeeting') }}</span>
            <span class="stat-badge cyan">{{ t('dashboard.combined') }}</span>
          </div>
          <strong class="stat-value">{{ combinedMeetingRate }}%</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ combinedMeetings }}/{{ combinedApproaches }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.meetingProposal') }}</span>
            <span class="stat-badge blue">{{ t('dashboard.combined') }}</span>
          </div>
          <strong class="stat-value">{{ combinedProposalRate }}%</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ combinedProposals }}/{{ combinedMeetings }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.proposalSecured') }}</span>
            <span class="stat-badge teal">{{ t('dashboard.combined') }}</span>
          </div>
          <strong class="stat-value">{{ combinedSecuredRate }}%</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ combinedSecured }}/{{ combinedProposals }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.overallWinRate') }}</span>
            <span class="stat-badge green">{{ t('dashboard.combined') }}</span>
          </div>
          <strong class="stat-value">{{ combinedOverallRate }}%</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ combinedSecured }}/{{ combinedApproaches }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.pipelineValue') }}</span>
            <span class="stat-badge cyan">{{ t('dashboard.proposals') }}</span>
          </div>
          <strong class="stat-value">{{ money.format(metrics.totalProposalValue) }}</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ t('dashboard.outstandingProposals') }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-label">{{ t('dashboard.workSecured') }}</span>
            <span class="stat-badge green">{{ t('dashboard.revenue') }}</span>
          </div>
          <strong class="stat-value">{{ money.format(metrics.totalSecuredValue) }}</strong>
          <div class="stat-footer">
            <span class="stat-sub">{{ t('dashboard.totalClosedValue') }}</span>
          </div>
        </div>
      </section>

      <!-- Campaign Results Funnel -->
      <section class="rates-section campaign">
        <h2 class="section-title">
          <span class="title-icon cyan">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </span>
          {{ t('dashboard.campaignResults') }}
        </h2>
        <div class="funnel-grid">
          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress cyan" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * campaignMeetingRate / 100)"/>
              </svg>
              <div class="rate-value">{{ campaignMeetingRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.approachMeeting') }}</span>
            <span class="rate-count">{{ metrics.campaignFunnel.meetings }}/{{ metrics.campaignFunnel.approaches }}</span>
          </div>

          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress blue" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * campaignProposalRate / 100)"/>
              </svg>
              <div class="rate-value">{{ campaignProposalRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.meetingProposal') }}</span>
            <span class="rate-count">{{ metrics.campaignFunnel.proposals }}/{{ metrics.campaignFunnel.meetings }}</span>
          </div>

          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress teal" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * campaignSecuredRate / 100)"/>
              </svg>
              <div class="rate-value">{{ campaignSecuredRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.proposalSecured') }}</span>
            <span class="rate-count">{{ metrics.campaignFunnel.secured }}/{{ metrics.campaignFunnel.proposals }}</span>
          </div>

          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress green" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * campaignOverallRate / 100)"/>
              </svg>
              <div class="rate-value">{{ campaignOverallRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.overallWinRate') }}</span>
            <span class="rate-count">{{ metrics.campaignFunnel.secured }}/{{ metrics.campaignFunnel.approaches }}</span>
          </div>

          <div class="stat-card-inline cyan">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span class="stat-label">{{ t('dashboard.avgFee') }}</span>
            <strong class="stat-value">{{ money.format(metrics.campaignFunnel.avgFee) }}</strong>
          </div>

          <div class="stat-card-inline cyan">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span class="stat-label">{{ t('dashboard.avgDays') }}</span>
            <strong class="stat-value">{{ Math.round(metrics.campaignFunnel.avgDaysElapsed * 10) / 10 }} {{ t('common.days') }}</strong>
          </div>
        </div>
      </section>

      <!-- Total Needs Results Funnel -->
      <section class="rates-section total-needs">
        <h2 class="section-title">
          <span class="title-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </span>
          {{ t('dashboard.totalNeedsResults') }}
        </h2>
        <div class="funnel-grid">
          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress orange" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * totalNeedsMeetingRate / 100)"/>
              </svg>
              <div class="rate-value">{{ totalNeedsMeetingRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.approachMeeting') }}</span>
            <span class="rate-count">{{ metrics.totalNeedsFunnel.meetings }}/{{ metrics.totalNeedsFunnel.approaches }}</span>
          </div>

          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress amber" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * totalNeedsProposalRate / 100)"/>
              </svg>
              <div class="rate-value">{{ totalNeedsProposalRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.meetingProposal') }}</span>
            <span class="rate-count">{{ metrics.totalNeedsFunnel.proposals }}/{{ metrics.totalNeedsFunnel.meetings }}</span>
          </div>

          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress lime" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * totalNeedsSecuredRate / 100)"/>
              </svg>
              <div class="rate-value">{{ totalNeedsSecuredRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.proposalSecured') }}</span>
            <span class="rate-count">{{ metrics.totalNeedsFunnel.secured }}/{{ metrics.totalNeedsFunnel.proposals }}</span>
          </div>

          <div class="rate-card">
            <div class="rate-ring">
              <svg viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="42"/>
                <circle class="ring-progress emerald" cx="50" cy="50" r="42"
                  :stroke-dasharray="264"
                  :stroke-dashoffset="264 - (264 * totalNeedsOverallRate / 100)"/>
              </svg>
              <div class="rate-value">{{ totalNeedsOverallRate }}%</div>
            </div>
            <span class="rate-label">{{ t('dashboard.overallWinRate') }}</span>
            <span class="rate-count">{{ metrics.totalNeedsFunnel.secured }}/{{ metrics.totalNeedsFunnel.approaches }}</span>
          </div>

          <div class="stat-card-inline orange">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span class="stat-label">{{ t('dashboard.avgFee') }}</span>
            <strong class="stat-value">{{ money.format(metrics.totalNeedsFunnel.avgFee) }}</strong>
          </div>

          <div class="stat-card-inline orange">
            <div class="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <span class="stat-label">{{ t('dashboard.avgDays') }}</span>
            <strong class="stat-value">{{ Math.round(metrics.totalNeedsFunnel.avgDaysElapsed * 10) / 10 }} {{ t('common.days') }}</strong>
          </div>
        </div>
      </section>

      <!-- COI Performance -->
      <section class="rates-section coi-performance">
        <h2 class="section-title">
          <span class="title-icon teal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </span>
          {{ t('dashboard.coiPerformance') }}
        </h2>
        <div class="coi-panel-grid">
          <div class="coi-chart-box">
            <h4>{{ t('dashboard.statusProgression') }}</h4>
            <div class="coi-chart-inner">
              <Bar :data="coiPerformanceBarData" :options="verticalBarOptions" />
            </div>
          </div>

          <div class="coi-stats-table">
            <div class="coi-stat-row">
              <span class="coi-stat-label">{{ t('dashboard.totalCOIs') }}</span>
              <strong class="coi-stat-value">{{ metrics.coiPerformance.total }}</strong>
            </div>
            <div class="coi-stat-row">
              <span class="coi-stat-label">{{ t('dashboard.referrals') }}</span>
              <strong class="coi-stat-value">{{ metrics.coiPerformance.totalReferrals }}</strong>
            </div>
            <div class="coi-stat-row">
              <span class="coi-stat-label">{{ t('dashboard.converted') }}</span>
              <strong class="coi-stat-value">{{ metrics.coiPerformance.totalConverted }}</strong>
            </div>
            <div class="coi-stat-row">
              <span class="coi-stat-label">{{ t('dashboard.proposalFeeValue') }}</span>
              <strong class="coi-stat-value">{{ money.format(metrics.coiPerformance.totalProposalFeeValue) }}</strong>
            </div>
            <div class="coi-stat-row">
              <span class="coi-stat-label">{{ t('dashboard.securedFeeValue') }}</span>
              <strong class="coi-stat-value">{{ money.format(metrics.coiPerformance.totalSecuredFeeValue) }}</strong>
            </div>
          </div>

          <div class="coi-chart-box">
            <h4>{{ t('dashboard.byIndustry') }}</h4>
            <div class="coi-chart-inner">
              <Bar :data="coiIndustryBarData" :options="verticalBarOptions" />
            </div>
          </div>
        </div>
      </section>

      <!-- Charts Row 1 -->
      <section class="charts-row">
        <div class="chart-card">
          <h3>{{ t('dashboard.prospectStatus') }}</h3>
          <p class="chart-subtitle">{{ t('dashboard.statusDistribution') }}</p>
          <div class="chart-container pie">
            <Pie :data="statusPieData" :options="pieOptions" />
          </div>
        </div>

        <div class="chart-card">
          <h3>{{ t('dashboard.leadSources') }}</h3>
          <p class="chart-subtitle">{{ t('dashboard.whereProspectsCome') }}</p>
          <div class="chart-container doughnut">
            <Doughnut :data="sourceDoughnutData" :options="doughnutOptions" />
          </div>
        </div>

        <div class="chart-card wide">
          <h3>{{ t('dashboard.monthlyTrend') }}</h3>
          <p class="chart-subtitle">{{ t('dashboard.revenueOverTime') }}</p>
          <div class="chart-container line">
            <Line :data="monthlyTrendData" :options="lineOptions" />
          </div>
        </div>
      </section>

      <!-- Charts Row 2 -->
      <section class="charts-row single">
        <div class="chart-card wide">
          <h3>{{ t('dashboard.workSecuredByTeam') }}</h3>
          <p class="chart-subtitle">{{ t('dashboard.individualPerformance') }}</p>
          <div class="chart-container bar-h">
            <Bar :data="staffBarData" :options="horizontalBarOptions" />
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(0, 177, 224, 0.08) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(0, 200, 255, 0.06) 0%, transparent 30%),
    linear-gradient(180deg, #e6f9ff 0%, #f0fcff 100%);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow-x: hidden;
}

/* Header */
.dashboard-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 200, 255, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #00c4e8 0%, #00b1e0 25%, #009fc8 50%, #008db3 75%, #007a99 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(0, 177, 224, 0.35),
    0 8px 25px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.dashboard-header::before {
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

.header-text h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.header-text p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  color: #008db3;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

/* Primary KPI Cards */
.kpi-section.primary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.kpi-card {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  transition: all 0.3s;
}

.kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);
}

.kpi-card.highlight {
  position: relative;
  overflow: hidden;
}

.kpi-card.highlight::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
}

.kpi-card.cyan::before { background: linear-gradient(90deg, #00b1e0, #38bdf8); }
.kpi-card.blue::before { background: linear-gradient(90deg, #3b82f6, #06b6d4); }
.kpi-card.teal::before { background: linear-gradient(90deg, #14b8a6, #06b6d4); }
.kpi-card.green::before { background: linear-gradient(90deg, #22c55e, #10b981); }

.kpi-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-card.cyan .kpi-icon { background: linear-gradient(135deg, #cffafe, #a5f3fc); color: #0891b2; }
.kpi-card.blue .kpi-icon { background: linear-gradient(135deg, #dbeafe, #bfdbfe); color: #2563eb; }
.kpi-card.teal .kpi-icon { background: linear-gradient(135deg, #ccfbf1, #99f6e4); color: #0d9488; }
.kpi-card.green .kpi-icon { background: linear-gradient(135deg, #dcfce7, #bbf7d0); color: #16a34a; }

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.kpi-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.kpi-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1rem;
}

.stat-card {
  background: white;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.stat-badge {
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-badge.blue { background: #dbeafe; color: #2563eb; }
.stat-badge.green { background: #dcfce7; color: #16a34a; }
.stat-badge.cyan { background: #cffafe; color: #0891b2; }
.stat-badge.teal { background: #ccfbf1; color: #0d9488; }
.stat-badge.orange { background: #ffedd5; color: #ea580c; }
.stat-badge.pink { background: #fce7f3; color: #db2777; }

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.stat-footer {
  font-size: 0.8rem;
  color: #94a3b8;
}

.stat-rate {
  color: #22c55e;
  font-weight: 600;
}

.stat-active {
  color: #3b82f6;
  font-weight: 500;
}

/* Rates Section */
.rates-section {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
}

.section-title {
  margin: 0 0 1.25rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title-icon.cyan {
  background: linear-gradient(135deg, #cffafe, #a5f3fc);
  color: #0891b2;
}

.title-icon.orange {
  background: linear-gradient(135deg, #ffedd5, #fed7aa);
  color: #ea580c;
}

.rates-section.campaign {
  border-left: 4px solid #00b1e0;
}

.rates-section.total-needs {
  border-left: 4px solid #f97316;
}

.rates-section.coi-performance {
  border-left: 4px solid #14b8a6;
}

.title-icon.teal {
  background: linear-gradient(135deg, #ccfbf1, #99f6e4);
  color: #0d9488;
}

.coi-panel-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

.coi-stats-table {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
  border-radius: 14px;
  min-width: 160px;
}

.coi-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(13, 148, 136, 0.1);
}

.coi-stat-row:last-child {
  border-bottom: none;
}

.coi-stat-label {
  font-size: 0.85rem;
  color: #0d9488;
  font-weight: 500;
}

.coi-stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.coi-chart-box {
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
  border-radius: 14px;
  padding: 0.75rem 1rem;
  display: flex;
  flex-direction: column;
}

.coi-chart-box h4 {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: #0d9488;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.coi-chart-inner {
  flex: 1;
  min-height: 100px;
}

.stat-card-inline.teal {
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);
}

.stat-card-inline.teal .stat-icon {
  background: linear-gradient(135deg, #14b8a6, #0d9488);
  color: white;
}

.funnel-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.stat-card-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 14px;
  background: #f8fafc;
  text-align: center;
}

.stat-card-inline.cyan {
  background: linear-gradient(135deg, #ecfeff, #cffafe);
}

.stat-card-inline.orange {
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
}

.stat-card-inline .stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card-inline.cyan .stat-icon {
  background: linear-gradient(135deg, #00b1e0, #38bdf8);
  color: white;
}

.stat-card-inline.orange .stat-icon {
  background: linear-gradient(135deg, #f97316, #fb923c);
  color: white;
}

.stat-card-inline .stat-label {
  font-size: 0.7rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.stat-card-inline .stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.rate-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.rate-ring {
  position: relative;
  width: 100px;
  height: 100px;
}

.rate-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}

.ring-progress.cyan { stroke: #00b1e0; }
.ring-progress.blue { stroke: #3b82f6; }
.ring-progress.green { stroke: #22c55e; }
.ring-progress.orange { stroke: #f97316; }
.ring-progress.teal { stroke: #14b8a6; }
.ring-progress.amber { stroke: #f59e0b; }
.ring-progress.lime { stroke: #84cc16; }
.ring-progress.emerald { stroke: #10b981; }

.rate-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.rate-label {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
  text-align: center;
}

.rate-count {
  font-size: 0.7rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Charts */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1.5fr;
  gap: 1rem;
}

.charts-row:last-child {
  grid-template-columns: 2fr 1.5fr;
}

.charts-row.single {
  grid-template-columns: 1fr;
}

.chart-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-width: 0;
}

.chart-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.chart-subtitle {
  margin: 0.25rem 0 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
}

.chart-container {
  position: relative;
  width: 100%;
  max-width: 100%;
}

.chart-container.pie,
.chart-container.doughnut {
  height: 280px;
}

.chart-container.line {
  height: 220px;
}

.chart-container.bar-h {
  height: 200px;
}

.chart-container.bar-v {
  height: 240px;
}

/* Loading & Error States */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #00b1e0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid #fecaca;
}

/* Responsive */
@media (max-width: 1400px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 1200px) {
  .kpi-section.primary {
    grid-template-columns: repeat(2, 1fr);
  }

  .charts-row {
    grid-template-columns: 1fr 1fr;
  }

  .charts-row:last-child {
    grid-template-columns: 1fr 1fr;
  }

  .chart-card.wide {
    grid-column: span 2;
  }
}

@media (max-width: 1200px) {
  .funnel-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .coi-panel-grid {
    grid-template-columns: 1fr auto 1fr;
  }
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .funnel-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .coi-panel-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .coi-stats-table {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-around;
  }

  .coi-stat-row {
    flex-direction: column;
    gap: 0.25rem;
    text-align: center;
    border-bottom: none;
    padding: 0.5rem 1rem;
  }

  .charts-row,
  .charts-row:last-child {
    grid-template-columns: 1fr;
  }

  .chart-card.wide {
    grid-column: span 1;
  }
}

@media (max-width: 600px) {
  .dashboard {
    padding: 1rem;
  }

  .kpi-section.primary {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .funnel-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .header-text h1 {
    font-size: 1.5rem;
  }
}
</style>
