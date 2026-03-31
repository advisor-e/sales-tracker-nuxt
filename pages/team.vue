<script>
export default {
  name: 'TeamPage',

  middleware: ['firm-manager'],

  data() {
    return {
      rows: [],
      loading: false,
      errorText: ""
    };
  },

  computed: {
    totalSecuredValue() {
      return this.rows.reduce((sum, row) => sum + row.totalSecuredValue, 0);
    },
    totalProspects() {
      return this.rows.reduce((sum, row) => sum + row.prospects, 0);
    },
    totalProposals() {
      return this.rows.reduce((sum, row) => sum + row.proposalsSent, 0);
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
    async loadRows() {
      this.loading = true;
      this.errorText = "";
      try {
        const res = await fetch("/api/team/summary", { credentials: 'same-origin' }).then(r => r.json());
        this.rows = res.items;
      } catch (error) {
        const status = Number(error?.statusCode || error?.data?.statusCode || 0);
        if (status === 401) {
          this.errorText = "Session expired. Redirecting to sign in...";
          this.$router.push('/login');
          return;
        }
        this.errorText = String(error?.data?.statusMessage || error?.data?.message || error?.message || "Failed to load team summary");
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadRows();
  }
};
</script>

<template lang="pug">
  section.page-wrap
    header.page-header
      .header-content
        .header-text
          span.header-badge {{ $t('team.badge') }}
          h1 {{ $t('team.title') }}
          p {{ $t('team.subtitle') }}
        button.refresh-btn(@click="loadRows") {{ $t('common.refresh') }}

    section.summary-strip
      article
        span {{ $t('team.teamMembers') }}
        strong {{ rows.length }}
      article
        span {{ $t('team.totalProspects') }}
        strong {{ totalProspects }}
      article
        span {{ $t('team.proposalsSent') }}
        strong {{ totalProposals }}
      article
        span {{ $t('team.securedValue') }}
        strong ${{ totalSecuredValue.toLocaleString() }}

    p.error(v-if="errorText") {{ errorText }}
    p(v-if="loading") {{ $t('team.loadingSummary') }}

    section.card
      table
        thead
          tr
            th {{ $t('team.teamMember') }}
            th {{ $t('team.prospects') }}
            th {{ $t('team.approaches') }}
            th {{ $t('team.meetings') }}
            th {{ $t('team.proposals') }}
            th {{ $t('team.proposalValue') }}
            th {{ $t('team.secured') }}
            th {{ $t('team.securedValue') }}
            th {{ $t('team.approachConv') }}
            th {{ $t('team.avgProposal') }}
            th {{ $t('team.securedConv') }}
            th {{ $t('team.active') }}
            th {{ $t('team.awaitResearch') }}
            th {{ $t('team.completed') }}
            th {{ $t('team.dead') }}
            th {{ $t('team.onHold') }}
        tbody
          tr(v-for="row in rows" :key="row.leadStaff")
            td {{ row.leadStaff }}
            td {{ row.prospects }}
            td {{ row.approachesMade }}
            td {{ row.secureMeetings }}
            td {{ row.proposalsSent }}
            td ${{ row.totalProposalValue.toLocaleString() }}
            td {{ row.engagementsSecured }}
            td ${{ row.totalSecuredValue.toLocaleString() }}
            td {{ (row.avgApproachConversion * 100).toFixed(1) }}%
            td ${{ row.avgProposalValue.toLocaleString(undefined, { maximumFractionDigits: 0 }) }}
            td {{ (row.avgSecuredConversion * 100).toFixed(1) }}%
            td {{ row.active }}
            td {{ row.awaitResearch }}
            td {{ row.completed }}
            td {{ row.dead }}
            td {{ row.onHold }}
</template>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top right, rgba(127, 211, 241, 0.15) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(200, 240, 255, 0.12) 0%, transparent 30%),
    radial-gradient(circle at bottom right, rgba(127, 211, 241, 0.1) 0%, transparent 35%),
    linear-gradient(180deg, #f0fafd 0%, #e6f7fc 100%);
}
.page-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(200, 240, 255, 0.3) 0%, transparent 40%),
    linear-gradient(135deg, #9ce0f7 0%, #7fd3f1 25%, #5ec5eb 50%, #3db7e5 75%, #2a9bc7 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(127, 211, 241, 0.35),
    0 8px 25px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
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
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  color: #0891b2;
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
  background: linear-gradient(180deg, #ecfeff, #cffafe);
  box-shadow: 0 12px 28px rgba(127, 211, 241, 0.2);
}
.summary-strip span { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #0891b2; }
.summary-strip strong { display: block; margin-top: 0.2rem; font-size: 1.2rem; color: #155e75; }
button {
  border: 1px solid rgba(127, 211, 241, 0.4);
  border-radius: 10px;
  padding: 0.34rem 0.48rem;
  background: rgba(255, 255, 255, 0.82);
  color: #0891b2;
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
