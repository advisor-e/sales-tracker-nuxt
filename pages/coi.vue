<script>
export default {
  name: 'CoiPage',

  data() {
    return {
      summaryItems: [],
      totals: {
        relationships: 0,
        totalReferrals: 0,
        totalConverted: 0,
        totalProposedValue: 0,
        totalSecuredValue: 0,
        conversionRate: 0
      },
      loading: false,
      errorText: "",
      coiEntries: [],
      loadingEntries: false,
      selectedIds: [],
      deletingSelected: false,
      newCoi: {
        coiName: "",
        email: "",
        cell: "",
        entity: "",
        position: "",
        industry: "",
        leadRelationshipPartner: "",
        relationshipSupport: ""
      },
      savingCoi: false
    };
  },

  computed: {
    industryOptions() {
      return this.$store.getters['lists/getListItems']('industry');
    },
    partnerOptions() {
      return this.$store.getters['lists/getListItems']('partner');
    },
    staffOptions() {
      return this.$store.getters['lists/getListItems']('leadStaff');
    },
    allSelected() {
      return this.coiEntries.length > 0 && this.selectedIds.length === this.coiEntries.length;
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
    async loadSummary() {
      this.loading = true;
      this.errorText = "";
      try {
        const res = await fetch("/api/coi/summary", { credentials: 'same-origin' }).then(r => r.json());
        this.summaryItems = res.items;
        this.totals = res.totals;
      } catch (error) {
        const status = Number(error?.statusCode || 0);
        if (status === 401) {
          this.errorText = "Session expired. Redirecting to sign in...";
          this.$router.push('/login');
          return;
        }
        this.errorText = String(error?.data?.statusMessage || error?.data?.message || error?.message || "Failed to load COI summary");
      } finally {
        this.loading = false;
      }
    },
    async loadCoiEntries() {
      this.loadingEntries = true;
      try {
        const res = await fetch("/api/coi", { credentials: 'same-origin' }).then(r => r.json());
        this.coiEntries = res.items;
      } catch (error) {
        console.error("Failed to load COI entries:", error);
      } finally {
        this.loadingEntries = false;
      }
    },
    async addCoi() {
      const name = this.newCoi.coiName.trim();
      if (!name) return;

      this.savingCoi = true;
      try {
        await this.apiFetch("/api/coi", {
          method: "POST",
          body: {
            coiName: name,
            email: this.newCoi.email.trim() || null,
            cell: this.newCoi.cell.trim() || null,
            entity: this.newCoi.entity.trim() || null,
            position: this.newCoi.position.trim() || null,
            industry: this.newCoi.industry || null,
            leadRelationshipPartner: this.newCoi.leadRelationshipPartner || null,
            relationshipSupport: this.newCoi.relationshipSupport || null
          }
        });

        this.newCoi = {
          coiName: "",
          email: "",
          cell: "",
          entity: "",
          position: "",
          industry: "",
          leadRelationshipPartner: "",
          relationshipSupport: ""
        };

        await this.loadCoiEntries();
      } catch (error) {
        alert(error?.message || "Failed to add COI");
      } finally {
        this.savingCoi = false;
      }
    },
    toggleSelection(id) {
      const idx = this.selectedIds.indexOf(id);
      if (idx >= 0) {
        this.selectedIds.splice(idx, 1);
      } else {
        this.selectedIds.push(id);
      }
    },
    toggleSelectAll() {
      if (this.selectedIds.length === this.coiEntries.length) {
        this.selectedIds = [];
      } else {
        this.selectedIds = this.coiEntries.map(e => e.id);
      }
    },
    async removeSelectedCois() {
      const ids = this.selectedIds.slice();
      if (ids.length === 0) return;

      const names = this.coiEntries
        .filter(e => ids.includes(e.id))
        .map(e => e.coiName)
        .join(", ");

      if (!confirm(`Remove ${ids.length} COI${ids.length > 1 ? "s" : ""}?\n\n${names}`)) return;

      this.deletingSelected = true;
      try {
        await Promise.all(ids.map(id => this.apiFetch(`/api/coi/${id}`, { method: "DELETE" })));
        this.selectedIds = [];
        await this.loadCoiEntries();
      } catch (error) {
        alert(error?.message || "Failed to remove COIs");
      } finally {
        this.deletingSelected = false;
      }
    },
    async toggleProgress(entry, field) {
      const newValue = !entry[field];
      try {
        await this.apiFetch(`/api/coi/${entry.id}`, {
          method: "PATCH",
          body: { [field]: newValue }
        });
        entry[field] = newValue ? 1 : 0;
      } catch (error) {
        alert(error?.message || "Failed to update progress");
      }
    }
  },

  mounted() {
    Promise.all([
      this.$store.dispatch('lists/fetchLists'),
      this.loadSummary(),
      this.loadCoiEntries()
    ]);
  }
};
</script>

<template lang="pug">
  section.section.coi-page
    //- Page header
    header.coi-header.mb-5
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-success is-light" rounded) {{ $t('coi.badge') }}
              h1.title.is-spaced.has-text-white.mt-2 {{ $t('coi.title') }}
              p.subtitle.has-text-white-ter {{ $t('coi.subtitle') }}
        .level-right
          .level-item
            b-button(@click="loadSummary(); loadCoiEntries();" :loading="loading" type="is-white" rounded)
              | {{ $t('coi.refresh') }}

    //- Summary strip
    .columns.is-multiline.mb-4
      .column.is-2-desktop.is-4-tablet
        .box.summary-box
          p.heading {{ $t('coi.coiRelationships') }}
          p.title.is-4 {{ totals.relationships }}
      .column.is-2-desktop.is-4-tablet
        .box.summary-box
          p.heading {{ $t('coi.totalReferrals') }}
          p.title.is-4 {{ totals.totalReferrals }}
      .column.is-2-desktop.is-4-tablet
        .box.summary-box
          p.heading {{ $t('coi.converted') }}
          p.title.is-4 {{ totals.totalConverted }}
      .column.is-2-desktop.is-4-tablet
        .box.summary-box
          p.heading {{ $t('coi.conversionRate') }}
          p.title.is-4 {{ (totals.conversionRate * 100).toFixed(1) }}%
      .column.is-2-desktop.is-4-tablet
        .box.summary-box
          p.heading {{ $t('coi.proposedFeeValue') }}
          p.title.is-4 ${{ totals.totalProposedValue.toLocaleString() }}
      .column.is-2-desktop.is-4-tablet
        .box.summary-box
          p.heading {{ $t('coi.securedFeeValue') }}
          p.title.is-4 ${{ totals.totalSecuredValue.toLocaleString() }}

    b-notification(v-if="errorText" type="is-danger is-light" :closable="false") {{ errorText }}

    //- Add COI form
    .box.add-section.mb-4
      p.title.is-5 {{ $t('coi.addCoi') }}
      p.is-size-7.has-text-grey.mb-4 {{ $t('coi.addCoiDesc') }}
      form(@submit.prevent="addCoi")
        .columns.is-multiline
          .column.is-4
            b-field(:label="$t('coi.coiName')" label-for="coi-name")
              b-input#coi-name(v-model="newCoi.coiName" :placeholder="$t('coi.placeholderName')" required expanded)
          .column.is-4
            b-field(:label="$t('coi.email')" label-for="coi-email")
              b-input#coi-email(v-model="newCoi.email" type="email" :placeholder="$t('coi.placeholderEmail')" expanded)
          .column.is-4
            b-field(:label="$t('coi.cellPhone')" label-for="coi-cell")
              b-input#coi-cell(v-model="newCoi.cell" :placeholder="$t('coi.placeholderPhone')" expanded)
          .column.is-4
            b-field(:label="$t('coi.entityCompany')" label-for="coi-entity")
              b-input#coi-entity(v-model="newCoi.entity" :placeholder="$t('coi.placeholderCompany')" expanded)
          .column.is-4
            b-field(:label="$t('coi.position')" label-for="coi-position")
              b-input#coi-position(v-model="newCoi.position" :placeholder="$t('coi.placeholderPosition')" expanded)
          .column.is-4
            b-field(:label="$t('coi.industry')" label-for="coi-industry")
              b-select#coi-industry(v-model="newCoi.industry" expanded)
                option(value="") {{ $t('coi.selectIndustry') }}
                option(v-for="opt in industryOptions" :key="opt" :value="opt") {{ opt }}
          .column.is-4
            b-field(:label="$t('coi.leadPartner')" label-for="coi-partner")
              b-select#coi-partner(v-model="newCoi.leadRelationshipPartner" expanded)
                option(value="") {{ $t('coi.selectPartner') }}
                option(v-for="opt in partnerOptions" :key="opt" :value="opt") {{ opt }}
          .column.is-4
            b-field(:label="$t('coi.relationshipSupport')" label-for="coi-support")
              b-select#coi-support(v-model="newCoi.relationshipSupport" expanded)
                option(value="") {{ $t('coi.selectStaff') }}
                option(v-for="opt in staffOptions" :key="opt" :value="opt") {{ opt }}
          .column.is-4.is-flex.is-align-items-flex-end
            b-button(
              native-type="submit"
              type="is-success"
              :loading="savingCoi"
              :disabled="!newCoi.coiName.trim()"
              expanded
            ) {{ $t('coi.addCoiBtn') }}

    //- COI Directory
    .box.mb-4
      .level.mb-3
        .level-left
          .level-item
            div
              p.title.is-5.mb-1 {{ $t('coi.directory') }}
              p.is-size-7.has-text-grey {{ $t('coi.directoryDesc') }}
        .level-right
          .level-item(v-if="selectedIds.length > 0")
            b-button(
              type="is-danger"
              :loading="deletingSelected"
              @click="removeSelectedCois"
              size="is-small"
            ) {{ $t('coi.removeSelected', { count: selectedIds.length }) }}

      loading-spinner(v-if="loadingEntries")
      .table-container(v-else-if="coiEntries.length > 0")
        table.table.is-fullwidth.is-striped.is-hoverable.is-size-7
          thead
            tr
              th.checkbox-col
                b-checkbox(
                  :value="allSelected"
                  @input="toggleSelectAll"
                  :title="$t('coi.selectAll')"
                )
              th {{ $t('coi.name') }}
              th {{ $t('coi.entity') }}
              th {{ $t('coi.industry') }}
              th {{ $t('coi.email') }}
              th {{ $t('coi.cell') }}
              th {{ $t('coi.leadPartner') }}
              th.has-text-centered {{ $t('coi.couldWe') }}
              th.has-text-centered {{ $t('coi.howWouldWe') }}
              th.has-text-centered {{ $t('coi.willWe') }}
              th.has-text-centered {{ $t('coi.testReview') }}
          tbody
            tr(
              v-for="entry in coiEntries"
              :key="entry.id"
              :class="{ 'is-selected': selectedIds.includes(entry.id) }"
            )
              td.checkbox-col
                b-checkbox(
                  :value="selectedIds.includes(entry.id)"
                  @input="toggleSelection(entry.id)"
                )
              td {{ entry.coiName }}
              td {{ entry.entity || "-" }}
              td {{ entry.industry || "-" }}
              td {{ entry.email || "-" }}
              td {{ entry.cell || "-" }}
              td {{ entry.leadRelationshipPartner || "-" }}
              td.has-text-centered
                b-checkbox(:value="!!entry.couldWe" @input="toggleProgress(entry, 'couldWe')")
              td.has-text-centered
                b-checkbox(:value="!!entry.howWouldWe" @input="toggleProgress(entry, 'howWouldWe')")
              td.has-text-centered
                b-checkbox(:value="!!entry.willWe" @input="toggleProgress(entry, 'willWe')")
              td.has-text-centered
                b-checkbox(:value="!!entry.testReview" @input="toggleProgress(entry, 'testReview')")
      p.has-text-grey.is-italic(v-else) {{ $t('coi.noEntries') }}

    //- Performance table
    .box
      p.title.is-5 {{ $t('coi.performanceTitle') }}
      p.is-size-7.has-text-grey.mb-4 {{ $t('coi.performanceDesc') }}
      loading-spinner(v-if="loading")
      .table-container(v-else-if="summaryItems.length > 0")
        table.table.is-fullwidth.is-striped.is-hoverable.is-size-7
          thead
            tr
              th {{ $t('coi.coiName') }}
              th {{ $t('coi.referrals') }}
              th {{ $t('coi.active') }}
              th {{ $t('coi.converted') }}
              th {{ $t('coi.conversionRate') }}
              th {{ $t('coi.proposedFeeValue') }}
              th {{ $t('coi.securedFeeValue') }}
          tbody
            tr(v-for="item in summaryItems" :key="item.coiName")
              td {{ item.coiName }}
              td {{ item.totalReferrals }}
              td {{ item.active }}
              td {{ item.converted }}
              td {{ item.totalReferrals > 0 ? ((item.converted / item.totalReferrals) * 100).toFixed(1) : '0.0' }}%
              td ${{ item.proposedValue.toLocaleString() }}
              td ${{ item.securedValue.toLocaleString() }}
      p.has-text-grey.is-italic(v-else-if="!loading") {{ $t('coi.noReferralData') }}
</template>

<style scoped>
.coi-page {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0faf2 0%, #e8f7ec 100%);
}

.coi-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #2cb850 0%, #1a8537 50%, #105523 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(31, 157, 64, 0.3);
}

.coi-header::before {
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
  background: linear-gradient(180deg, #dcfce7, #bbf7d0);
}

.add-section {
  background: linear-gradient(175deg, #f0fdf4 0%, #dcfce7 100%);
}

.checkbox-col {
  width: 50px;
}
</style>
