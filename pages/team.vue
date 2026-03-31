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
  section.section.team-page
    //- Page header
    header.team-header.mb-5
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-info is-light" rounded) {{ $t('team.badge') }}
              h1.title.is-spaced.has-text-white.mt-2 {{ $t('team.title') }}
              p.subtitle.has-text-white-ter {{ $t('team.subtitle') }}
        .level-right
          .level-item
            b-button(@click="loadRows" :loading="loading" type="is-white" rounded) {{ $t('common.refresh') }}

    //- Summary strip
    .columns.is-multiline.mb-4
      .column.is-3-desktop.is-6-tablet
        .box.summary-box
          p.heading {{ $t('team.teamMembers') }}
          p.title.is-4 {{ rows.length }}
      .column.is-3-desktop.is-6-tablet
        .box.summary-box
          p.heading {{ $t('team.totalProspects') }}
          p.title.is-4 {{ totalProspects }}
      .column.is-3-desktop.is-6-tablet
        .box.summary-box
          p.heading {{ $t('team.proposalsSent') }}
          p.title.is-4 {{ totalProposals }}
      .column.is-3-desktop.is-6-tablet
        .box.summary-box
          p.heading {{ $t('team.securedValue') }}
          p.title.is-4 ${{ totalSecuredValue.toLocaleString() }}

    b-notification(v-if="errorText" type="is-danger is-light" :closable="false") {{ errorText }}
    loading-spinner(v-if="loading && !rows.length" :message="$t('team.loadingSummary')")

    //- Team table
    .box(v-if="rows.length")
      .table-container
        table.table.is-fullwidth.is-striped.is-hoverable.is-size-7
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
.team-page {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0fafd 0%, #e6f7fc 100%);
}

.team-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, #9ce0f7 0%, #5ec5eb 50%, #2a9bc7 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(127, 211, 241, 0.3);
}

.team-header::before {
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

.summary-box {
  background: linear-gradient(180deg, #ecfeff, #cffafe);
}
</style>
