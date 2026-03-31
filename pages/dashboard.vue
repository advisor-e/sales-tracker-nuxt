<script>
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Pie, Doughnut, Bar, Line as LineChart } from 'vue-chartjs';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

export default {
  name: 'DashboardPage',

  components: { Pie, Doughnut, Bar, LineChart },

  data() {
    return {
      metrics: null,
      loading: false,
      errorText: "",
      money: new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD", maximumFractionDigits: 0 }),

      // Color palettes - cyan-based for dashboard theme (#00b1e0)
      colors: {
        primary: ['#00b1e0', '#0ea5e9', '#38bdf8', '#67e8f9', '#a5f3fc'],
        cool: ['#00b1e0', '#0ea5e9', '#3b82f6', '#0891b2', '#06b6d4'],
        warm: ['#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e'],
        earth: ['#78716c', '#a8a29e', '#0d9488', '#0891b2', '#0284c7'],
        vibrant: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#00b1e0', '#0ea5e9', '#38bdf8'],
      },

      // Status colors mapped to specific statuses
      statusColors: {
        'Active': '#22c55e',
        'Await Research': '#f59e0b',
        'Completed': '#3b82f6',
        'Dead': '#ef4444',
        'On Hold': '#0891b2',
      },

      // High contrast colors for sources
      sourceColors: [
        '#ef4444',
        '#f97316',
        '#eab308',
        '#22c55e',
        '#06b6d4',
        '#3b82f6',
        '#8b5cf6',
        '#ec4899',
      ],

      // Chart options
      pieOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.raw / total) * 100);
                return ` ${context.raw} (${percentage}%)`;
              }
            }
          }
        }
      },

      doughnutOptions: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle',
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((context.raw / total) * 100);
                return ` ${context.raw} (${percentage}%)`;
              }
            }
          }
        }
      },

      horizontalBarOptions: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            ticks: {
              callback: (value) => '$' + (value / 1000).toFixed(0) + 'k'
            }
          },
          y: {
            grid: { display: false },
            ticks: { font: { weight: 'bold' } }
          }
        }
      },

      verticalBarOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { weight: 'normal' } }
          },
          y: {
            grid: { color: 'rgba(0,0,0,0.05)' },
            beginAtZero: true
          }
        }
      },

      lineOptions: {
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
              callback: (value) => '$' + (value / 1000).toFixed(0) + 'k'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };
  },

  computed: {
    combinedApproaches() {
      return (this.metrics?.campaignFunnel?.approaches || 0) + (this.metrics?.totalNeedsFunnel?.approaches || 0);
    },
    combinedMeetings() {
      return (this.metrics?.campaignFunnel?.meetings || 0) + (this.metrics?.totalNeedsFunnel?.meetings || 0);
    },
    combinedProposals() {
      return (this.metrics?.campaignFunnel?.proposals || 0) + (this.metrics?.totalNeedsFunnel?.proposals || 0);
    },
    combinedSecured() {
      return (this.metrics?.campaignFunnel?.secured || 0) + (this.metrics?.totalNeedsFunnel?.secured || 0);
    },
    combinedMeetingRate() {
      const approaches = this.combinedApproaches;
      return approaches ? Math.round((this.combinedMeetings / approaches) * 100) : 0;
    },
    combinedProposalRate() {
      const meetings = this.combinedMeetings;
      return meetings ? Math.round((this.combinedProposals / meetings) * 100) : 0;
    },
    combinedSecuredRate() {
      const proposals = this.combinedProposals;
      return proposals ? Math.round((this.combinedSecured / proposals) * 100) : 0;
    },
    combinedOverallRate() {
      const approaches = this.combinedApproaches;
      return approaches ? Math.round((this.combinedSecured / approaches) * 100) : 0;
    },
    campaignMeetingRate() {
      const approaches = this.metrics?.campaignFunnel?.approaches || 0;
      return approaches ? Math.round(((this.metrics?.campaignFunnel?.meetings || 0) / approaches) * 100) : 0;
    },
    campaignProposalRate() {
      const meetings = this.metrics?.campaignFunnel?.meetings || 0;
      return meetings ? Math.round(((this.metrics?.campaignFunnel?.proposals || 0) / meetings) * 100) : 0;
    },
    campaignSecuredRate() {
      const proposals = this.metrics?.campaignFunnel?.proposals || 0;
      return proposals ? Math.round(((this.metrics?.campaignFunnel?.secured || 0) / proposals) * 100) : 0;
    },
    campaignOverallRate() {
      const approaches = this.metrics?.campaignFunnel?.approaches || 0;
      return approaches ? Math.round(((this.metrics?.campaignFunnel?.secured || 0) / approaches) * 100) : 0;
    },
    totalNeedsMeetingRate() {
      const approaches = this.metrics?.totalNeedsFunnel?.approaches || 0;
      return approaches ? Math.round(((this.metrics?.totalNeedsFunnel?.meetings || 0) / approaches) * 100) : 0;
    },
    totalNeedsProposalRate() {
      const meetings = this.metrics?.totalNeedsFunnel?.meetings || 0;
      return meetings ? Math.round(((this.metrics?.totalNeedsFunnel?.proposals || 0) / meetings) * 100) : 0;
    },
    totalNeedsSecuredRate() {
      const proposals = this.metrics?.totalNeedsFunnel?.proposals || 0;
      return proposals ? Math.round(((this.metrics?.totalNeedsFunnel?.secured || 0) / proposals) * 100) : 0;
    },
    totalNeedsOverallRate() {
      const approaches = this.metrics?.totalNeedsFunnel?.approaches || 0;
      return approaches ? Math.round(((this.metrics?.totalNeedsFunnel?.secured || 0) / approaches) * 100) : 0;
    },
    statusPieData() {
      const breakdown = this.metrics?.statusBreakdown || [];
      return {
        labels: breakdown.map(s => `${s.status} (${s.count})`),
        datasets: [{
          data: breakdown.map(s => s.count),
          backgroundColor: breakdown.map(s => this.statusColors[s.status] || '#64748b'),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 10
        }]
      };
    },
    sourceDoughnutData() {
      const breakdown = this.metrics?.sourceBreakdown || [];
      return {
        labels: breakdown.map(s => `${s.source} (${s.count})`),
        datasets: [{
          data: breakdown.map(s => s.count),
          backgroundColor: breakdown.map((_, i) => this.sourceColors[i % this.sourceColors.length]),
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8
        }]
      };
    },
    staffBarData() {
      return {
        labels: this.metrics?.staffSecuredBreakdown.map(s => s.leadStaff) || [],
        datasets: [{
          label: 'Work Secured ($)',
          data: this.metrics?.staffSecuredBreakdown.map(s => s.value) || [],
          backgroundColor: (ctx) => {
            const gradient = ctx.chart.ctx.createLinearGradient(0, 0, ctx.chart.width, 0);
            gradient.addColorStop(0, '#00b1e0');
            gradient.addColorStop(1, '#38bdf8');
            return gradient;
          },
          borderRadius: 6,
          borderSkipped: false,
        }]
      };
    },
    coiIndustryBarData() {
      return {
        labels: this.metrics?.coiIndustryBreakdown.map(s => s.industry) || [],
        datasets: [{
          label: 'Relationships',
          data: this.metrics?.coiIndustryBreakdown.map(s => s.relationships) || [],
          backgroundColor: this.colors.warm,
          borderRadius: 8,
          borderSkipped: false,
        }]
      };
    },
    coiPerformanceBarData() {
      return {
        labels: ['Could We', 'How Would We', 'Will We', 'Test/Review'],
        datasets: [{
          label: 'COI Status',
          data: [
            this.metrics?.coiPerformance.couldWe || 0,
            this.metrics?.coiPerformance.howWouldWe || 0,
            this.metrics?.coiPerformance.willWe || 0,
            this.metrics?.coiPerformance.testReview || 0
          ],
          backgroundColor: [
            '#f97316',
            '#eab308',
            '#22c55e',
            '#06b6d4'
          ],
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 24,
        }]
      };
    },
    monthlyTrendData() {
      return {
        labels: this.metrics?.monthlySecuredTrend.map(s => s.month) || [],
        datasets: [{
          label: 'Secured Value',
          data: this.metrics?.monthlySecuredTrend.map(s => s.value) || [],
          borderColor: '#00b1e0',
          backgroundColor: (ctx) => {
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
      };
    }
  },

  methods: {
    async loadMetrics() {
      this.loading = true;
      this.errorText = "";
      try {
        this.metrics = await fetch("/api/dashboard/metrics", { credentials: 'same-origin' }).then(r => r.json());
      } catch (error) {
        const status = Number(error?.statusCode || error?.data?.statusCode || 0);
        if (status === 401) {
          this.errorText = "Session expired. Redirecting to sign in...";
          this.$router.push('/login');
          return;
        }
        this.errorText = String(error?.data?.statusMessage || error?.data?.message || error?.message || "Failed to load dashboard metrics");
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadMetrics();
  }
};
</script>

<template lang="pug">
  section.section.dashboard-page
    //- Page header
    header.dashboard-header.mb-5
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-link is-light" rounded) {{ $t('dashboard.badge') }}
              h1.title.is-spaced.has-text-white.mt-2 {{ $t('dashboard.title') }}
              p.subtitle.has-text-white-ter {{ $t('dashboard.subtitle') }}
        .level-right
          .level-item
            b-button(@click="loadMetrics" :loading="loading" type="is-white" rounded)
              | {{ loading ? $t('common.loading') : $t('common.refresh') }}

    b-notification(v-if="errorText" type="is-danger is-light" :closable="false") {{ errorText }}
    loading-spinner(v-if="loading && !metrics" :message="$t('common.loadingDashboard')")

    template(v-if="metrics")
      //- Stats strip
      .stats-strip.mb-4
        stat-card(
          :label="$t('dashboard.totalProspects')"
          :value="metrics.totalProspects"
          :badge="$t('dashboard.pipeline')"
          badge-color="blue"
          :footer="metrics.activeProspects + ' ' + $t('common.active')"
        )
        stat-card(
          :label="$t('dashboard.approachMeeting')"
          :value="combinedMeetingRate + '%'"
          :badge="$t('dashboard.combined')"
          badge-color="cyan"
          :footer="combinedMeetings + '/' + combinedApproaches"
        )
        stat-card(
          :label="$t('dashboard.meetingProposal')"
          :value="combinedProposalRate + '%'"
          :badge="$t('dashboard.combined')"
          badge-color="blue"
          :footer="combinedProposals + '/' + combinedMeetings"
        )
        stat-card(
          :label="$t('dashboard.proposalSecured')"
          :value="combinedSecuredRate + '%'"
          :badge="$t('dashboard.combined')"
          badge-color="teal"
          :footer="combinedSecured + '/' + combinedProposals"
        )
        stat-card(
          :label="$t('dashboard.overallWinRate')"
          :value="combinedOverallRate + '%'"
          :badge="$t('dashboard.combined')"
          badge-color="green"
          :footer="combinedSecured + '/' + combinedApproaches"
        )
        stat-card(
          :label="$t('dashboard.pipelineValue')"
          :value="money.format(metrics.totalProposalValue)"
          :badge="$t('dashboard.proposals')"
          badge-color="cyan"
          :footer="$t('dashboard.outstandingProposals')"
        )
        stat-card(
          :label="$t('dashboard.workSecured')"
          :value="money.format(metrics.totalSecuredValue)"
          :badge="$t('dashboard.revenue')"
          badge-color="green"
          :footer="$t('dashboard.totalClosedValue')"
        )

      //- Campaign results
      .box.rates-section.campaign.mb-4
        h2.section-title
          span.title-icon.cyan
            svg(xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
              path(d="M22 12h-4l-3 9L9 3l-3 9H2")
          | {{ $t('dashboard.campaignResults') }}
        .funnel-grid
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.cyan(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * campaignMeetingRate / 100)")
              .rate-value {{ campaignMeetingRate }}%
            span.rate-label {{ $t('dashboard.approachMeeting') }}
            span.rate-count {{ metrics.campaignFunnel.meetings }}/{{ metrics.campaignFunnel.approaches }}
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.blue(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * campaignProposalRate / 100)")
              .rate-value {{ campaignProposalRate }}%
            span.rate-label {{ $t('dashboard.meetingProposal') }}
            span.rate-count {{ metrics.campaignFunnel.proposals }}/{{ metrics.campaignFunnel.meetings }}
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.teal(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * campaignSecuredRate / 100)")
              .rate-value {{ campaignSecuredRate }}%
            span.rate-label {{ $t('dashboard.proposalSecured') }}
            span.rate-count {{ metrics.campaignFunnel.secured }}/{{ metrics.campaignFunnel.proposals }}
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.green(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * campaignOverallRate / 100)")
              .rate-value {{ campaignOverallRate }}%
            span.rate-label {{ $t('dashboard.overallWinRate') }}
            span.rate-count {{ metrics.campaignFunnel.secured }}/{{ metrics.campaignFunnel.approaches }}
          .stat-card-inline.cyan
            .stat-icon
              svg(xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
                line(x1="12" y1="1" x2="12" y2="23")
                path(d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6")
            span.stat-label {{ $t('dashboard.avgFee') }}
            strong.stat-value {{ money.format(metrics.campaignFunnel.avgFee) }}
          .stat-card-inline.cyan
            .stat-icon
              svg(xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
                circle(cx="12" cy="12" r="10")
                polyline(points="12 6 12 12 16 14")
            span.stat-label {{ $t('dashboard.avgDays') }}
            strong.stat-value {{ Math.round(metrics.campaignFunnel.avgDaysElapsed * 10) / 10 }} {{ $t('common.days') }}

      //- Total needs results
      .box.rates-section.total-needs.mb-4
        h2.section-title
          span.title-icon.orange
            svg(xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
              circle(cx="12" cy="12" r="10")
              path(d="M12 16v-4")
              path(d="M12 8h.01")
          | {{ $t('dashboard.totalNeedsResults') }}
        .funnel-grid
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.orange(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * totalNeedsMeetingRate / 100)")
              .rate-value {{ totalNeedsMeetingRate }}%
            span.rate-label {{ $t('dashboard.approachMeeting') }}
            span.rate-count {{ metrics.totalNeedsFunnel.meetings }}/{{ metrics.totalNeedsFunnel.approaches }}
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.amber(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * totalNeedsProposalRate / 100)")
              .rate-value {{ totalNeedsProposalRate }}%
            span.rate-label {{ $t('dashboard.meetingProposal') }}
            span.rate-count {{ metrics.totalNeedsFunnel.proposals }}/{{ metrics.totalNeedsFunnel.meetings }}
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.lime(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * totalNeedsSecuredRate / 100)")
              .rate-value {{ totalNeedsSecuredRate }}%
            span.rate-label {{ $t('dashboard.proposalSecured') }}
            span.rate-count {{ metrics.totalNeedsFunnel.secured }}/{{ metrics.totalNeedsFunnel.proposals }}
          .rate-card
            .rate-ring
              svg(viewBox="0 0 100 100")
                circle.ring-bg(cx="50" cy="50" r="42")
                circle.ring-progress.emerald(cx="50" cy="50" r="42" :stroke-dasharray="264" :stroke-dashoffset="264 - (264 * totalNeedsOverallRate / 100)")
              .rate-value {{ totalNeedsOverallRate }}%
            span.rate-label {{ $t('dashboard.overallWinRate') }}
            span.rate-count {{ metrics.totalNeedsFunnel.secured }}/{{ metrics.totalNeedsFunnel.approaches }}
          .stat-card-inline.orange
            .stat-icon
              svg(xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
                line(x1="12" y1="1" x2="12" y2="23")
                path(d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6")
            span.stat-label {{ $t('dashboard.avgFee') }}
            strong.stat-value {{ money.format(metrics.totalNeedsFunnel.avgFee) }}
          .stat-card-inline.orange
            .stat-icon
              svg(xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
                circle(cx="12" cy="12" r="10")
                polyline(points="12 6 12 12 16 14")
            span.stat-label {{ $t('dashboard.avgDays') }}
            strong.stat-value {{ Math.round(metrics.totalNeedsFunnel.avgDaysElapsed * 10) / 10 }} {{ $t('common.days') }}

      //- COI performance
      .box.rates-section.coi-performance.mb-4
        h2.section-title
          span.title-icon.teal
            svg(xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2")
              path(d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2")
              circle(cx="9" cy="7" r="4")
              path(d="M22 21v-2a4 4 0 0 0-3-3.87")
              path(d="M16 3.13a4 4 0 0 1 0 7.75")
          | {{ $t('dashboard.coiPerformance') }}
        .coi-panel-grid
          .coi-chart-box
            h4 {{ $t('dashboard.statusProgression') }}
            .coi-chart-inner
              Bar(:chart-data="coiPerformanceBarData" :chart-options="verticalBarOptions")
          .coi-stats-table
            .coi-stat-row
              span.coi-stat-label {{ $t('dashboard.totalCOIs') }}
              strong.coi-stat-value {{ metrics.coiPerformance.total }}
            .coi-stat-row
              span.coi-stat-label {{ $t('dashboard.referrals') }}
              strong.coi-stat-value {{ metrics.coiPerformance.totalReferrals }}
            .coi-stat-row
              span.coi-stat-label {{ $t('dashboard.converted') }}
              strong.coi-stat-value {{ metrics.coiPerformance.totalConverted }}
            .coi-stat-row
              span.coi-stat-label {{ $t('dashboard.proposalFeeValue') }}
              strong.coi-stat-value {{ money.format(metrics.coiPerformance.totalProposalFeeValue) }}
            .coi-stat-row
              span.coi-stat-label {{ $t('dashboard.securedFeeValue') }}
              strong.coi-stat-value {{ money.format(metrics.coiPerformance.totalSecuredFeeValue) }}
          .coi-chart-box
            h4 {{ $t('dashboard.byIndustry') }}
            .coi-chart-inner
              Bar(:chart-data="coiIndustryBarData" :chart-options="verticalBarOptions")

      //- Charts row
      .columns.mb-4
        .column.is-3
          chart-card(:title="$t('dashboard.prospectStatus')" :subtitle="$t('dashboard.statusDistribution')" chart-type="pie")
            Pie(:chart-data="statusPieData" :chart-options="pieOptions")
        .column.is-3
          chart-card(:title="$t('dashboard.leadSources')" :subtitle="$t('dashboard.whereProspectsCome')" chart-type="doughnut")
            Doughnut(:chart-data="sourceDoughnutData" :chart-options="doughnutOptions")
        .column.is-6
          chart-card(:title="$t('dashboard.monthlyTrend')" :subtitle="$t('dashboard.revenueOverTime')" chart-type="line")
            LineChart(:chart-data="monthlyTrendData" :chart-options="lineOptions")

      //- Staff bar chart
      .columns
        .column
          chart-card(:title="$t('dashboard.workSecuredByTeam')" :subtitle="$t('dashboard.individualPerformance')" chart-type="bar-h")
            Bar(:chart-data="staffBarData" :chart-options="horizontalBarOptions")
</template>

<style scoped>
.dashboard-page {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #e6f9ff 0%, #f0fcff 100%);
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;
}

.dashboard-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #00c4e8 0%, #00b1e0 40%, #007a99 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 177, 224, 0.3);
}

.dashboard-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.08) 50%, transparent 70%);
  transform: rotate(25deg);
  pointer-events: none;
}

/* Rates Section */
.rates-section {
  border-radius: 20px;
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
