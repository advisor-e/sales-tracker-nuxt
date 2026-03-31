<script>
export default {
  name: 'HomePage',

  data() {
    return {
      metrics: null,
      teamRows: [],
      coiRows: [],
      pipelineRows: [],
      errorText: ""
    };
  },

  methods: {
    getCsrfToken() {
      const match = document.cookie.match(/(?:^|; )csrf_token=([^;]*)/);
      return match ? decodeURIComponent(match[1]) : '';
    },
    async apiFetch(url, options = {}) {
      const method = (options.method || 'GET').toUpperCase();
      const headers = { ...options.headers };
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        headers['x-csrf-token'] = this.getCsrfToken();
      }
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
        body: options.body ? JSON.stringify(options.body) : undefined
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    },
    async loadHomeData() {
      this.errorText = "";
      try {
        const [metricsRes, teamRes, coiRes, pipelineRes] = await Promise.all([
          fetch("/api/dashboard/metrics", { credentials: 'same-origin' }).then(r => r.json()),
          fetch("/api/team/summary", { credentials: 'same-origin' }).then(r => r.json()),
          fetch("/api/coi", { credentials: 'same-origin' }).then(r => r.json()),
          fetch("/api/pipeline", { credentials: 'same-origin' }).then(r => r.json())
        ]);
        this.metrics = metricsRes;
        this.teamRows = teamRes.items;
        this.coiRows = coiRes.items;
        this.pipelineRows = pipelineRes.items.slice(0, 8);
      } catch (error) {
        const status = Number(error?.statusCode || 0);
        if (status === 401) {
          this.$router.push('/login');
          return;
        }
        this.errorText = String(error?.message || "Failed to load home data");
      }
    }
  },

  mounted() {
    this.loadHomeData();
  }
};
</script>

<template lang="pug">
  section.home-page
    header.page-header
      .header-content
        .header-text
          span.header-badge {{ $t('home.badge') }}
          h1 {{ $t('home.title') }}
          p {{ $t('home.subtitle') }}

    p.error(v-if="errorText") {{ errorText }}

    section.home-kpis(v-if="metrics")
      article.metric-card.coral
        h3 {{ $t('home.filteredProspects') }}
        p {{ metrics.totalProspects }}
      article.metric-card.sky
        h3 {{ $t('home.activeStaff') }}
        p {{ teamRows.length }}
      article.metric-card.sun
        h3 {{ $t('home.securedValue') }}
        p ${{ Number(metrics.workSecured || 0).toLocaleString() }}
      article.metric-card.mint
        h3 {{ $t('home.coiRecords') }}
        p {{ coiRows.length }}

    section.quick-links
      nuxt-link.quick-link(to="/dashboard")
        strong {{ $t('home.dashboard') }}
        span {{ $t('home.dashboardDesc') }}
      nuxt-link.quick-link(to="/dashboard")
        strong {{ $t('home.dashboardCharts') }}
        span {{ $t('home.dashboardChartsDesc') }}
      nuxt-link.quick-link(to="/pipeline")
        strong {{ $t('home.pipeline') }}
        span {{ $t('home.pipelineDesc') }}
      nuxt-link.quick-link(to="/team")
        strong {{ $t('home.team') }}
        span {{ $t('home.teamDesc') }}
      nuxt-link.quick-link(to="/coi")
        strong {{ $t('home.coi') }}
        span {{ $t('home.coiDesc') }}
      nuxt-link.quick-link(to="/")
        strong {{ $t('home.blog') }}
        span {{ $t('home.blogDesc') }}

    section.home-columns
      article.panel.preview-panel
        h2 {{ $t('home.todayGlance') }}
        table
          thead
            tr
              th {{ $t('home.prospectName') }}
              th {{ $t('home.businessName') }}
              th {{ $t('home.teamMember') }}
              th {{ $t('home.status') }}
              th {{ $t('home.securedValueCol') }}
          tbody
            tr(v-for="item in pipelineRows" :key="item.id")
              td {{ item.prospectName }}
              td {{ item.businessName || $t('common.na') }}
              td {{ item.leadStaff || $t('common.unassigned') }}
              td {{ item.prospectStatus }}
              td ${{ Number(item.jobSecuredValue || 0).toLocaleString() }}

      article.panel.info-panel
        h2 {{ $t('home.whatEachSection') }}
        p.info.blue {{ $t('home.infoDashboard') }}
        p.info.green {{ $t('home.infoTrends') }}
        p.info.gold {{ $t('home.infoPipeline') }}
        p.caption {{ $t('home.rowsLoaded', { team: teamRows.length, coi: coiRows.length }) }}
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
