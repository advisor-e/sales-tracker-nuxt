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

  computed: {
    quickLinks() {
      return [
        { to: '/dashboard', label: this.$t('home.dashboard'), desc: this.$t('home.dashboardDesc') },
        { to: '/dashboard', label: this.$t('home.dashboardCharts'), desc: this.$t('home.dashboardChartsDesc') },
        { to: '/pipeline', label: this.$t('home.pipeline'), desc: this.$t('home.pipelineDesc') },
        { to: '/team', label: this.$t('home.team'), desc: this.$t('home.teamDesc') },
        { to: '/coi', label: this.$t('home.coi'), desc: this.$t('home.coiDesc') },
        { to: '/', label: this.$t('home.blog'), desc: this.$t('home.blogDesc') }
      ];
    }
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
  section.section.home-page
    //- Page header
    header.home-header.mb-5
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-warning is-light" rounded) {{ $t('home.badge') }}
              h1.title.is-spaced.has-text-white.mt-2 {{ $t('home.title') }}
              p.subtitle.has-text-white-ter {{ $t('home.subtitle') }}

    b-notification(v-if="errorText" type="is-danger is-light" :closable="false") {{ errorText }}

    //- KPI cards
    .columns.is-multiline.mb-5(v-if="metrics")
      .column.is-3-desktop.is-6-tablet
        .box.metric-box.coral
          p.heading {{ $t('home.filteredProspects') }}
          p.title.is-3 {{ metrics.totalProspects }}
      .column.is-3-desktop.is-6-tablet
        .box.metric-box.sky
          p.heading {{ $t('home.activeStaff') }}
          p.title.is-3 {{ teamRows.length }}
      .column.is-3-desktop.is-6-tablet
        .box.metric-box.sun
          p.heading {{ $t('home.securedValue') }}
          p.title.is-3 ${{ Number(metrics.workSecured || 0).toLocaleString() }}
      .column.is-3-desktop.is-6-tablet
        .box.metric-box.mint
          p.heading {{ $t('home.coiRecords') }}
          p.title.is-3 {{ coiRows.length }}

    //- Quick links
    .columns.is-multiline.mb-5
      .column.is-4-desktop.is-6-tablet(v-for="link in quickLinks" :key="link.to")
        nuxt-link.box.quick-link(:to="link.to")
          p.has-text-weight-bold {{ link.label }}
          p.is-size-7.has-text-grey {{ link.desc }}

    //- Main columns
    .columns
      .column.is-8
        .box
          p.title.is-5 {{ $t('home.todayGlance') }}
          .table-container
            table.table.is-fullwidth.is-striped.is-hoverable.is-size-7
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
      .column.is-4
        .box
          p.title.is-5 {{ $t('home.whatEachSection') }}
          .content
            b-message(type="is-info is-light" :closable="false") {{ $t('home.infoDashboard') }}
            b-message(type="is-success is-light" :closable="false") {{ $t('home.infoTrends') }}
            b-message(type="is-warning is-light" :closable="false") {{ $t('home.infoPipeline') }}
          p.is-size-7.has-text-grey {{ $t('home.rowsLoaded', { team: teamRows.length, coi: coiRows.length }) }}
</template>

<style scoped>
.home-page {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(160deg, #fff7ed 0%, #ffffff 100%);
}

.home-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #ff7a1a 0%, #f26200 40%, #a34200 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(242, 98, 0, 0.3);
}

.home-header::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 60%;
  height: 200%;
  background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%);
  transform: rotate(25deg);
  pointer-events: none;
}

.metric-box {
  border-radius: 16px;
}

.metric-box.coral { background: linear-gradient(135deg, #ffedd5, #fed7aa); }
.metric-box.sky   { background: linear-gradient(135deg, #fff7ed, #ffedd5); }
.metric-box.sun   { background: linear-gradient(135deg, #fef3c7, #fde68a); }
.metric-box.mint  { background: linear-gradient(135deg, #ffedd5, #ffddc1); }

.quick-link {
  display: block;
  text-decoration: none;
  color: inherit;
  transition: box-shadow 0.2s;
}

.quick-link:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
</style>
