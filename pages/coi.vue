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

<template>
  <section class="page-wrap">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">{{ $t('coi.badge') }}</span>
          <h1>{{ $t('coi.title') }}</h1>
          <p>{{ $t('coi.subtitle') }}</p>
        </div>
        <button class="refresh-btn" @click="loadSummary(); loadCoiEntries();">{{ $t('coi.refresh') }}</button>
      </div>
    </header>

    <section class="summary-strip">
      <article><span>{{ $t('coi.coiRelationships') }}</span><strong>{{ totals.relationships }}</strong></article>
      <article><span>{{ $t('coi.totalReferrals') }}</span><strong>{{ totals.totalReferrals }}</strong></article>
      <article><span>{{ $t('coi.converted') }}</span><strong>{{ totals.totalConverted }}</strong></article>
      <article><span>{{ $t('coi.conversionRate') }}</span><strong>{{ (totals.conversionRate * 100).toFixed(1) }}%</strong></article>
      <article><span>{{ $t('coi.proposedFeeValue') }}</span><strong>${{ totals.totalProposedValue.toLocaleString() }}</strong></article>
      <article><span>{{ $t('coi.securedFeeValue') }}</span><strong>${{ totals.totalSecuredValue.toLocaleString() }}</strong></article>
    </section>

    <!-- Add COI Section -->
    <section class="card add-section">
      <h2>{{ $t('coi.addCoi') }}</h2>
      <p class="section-desc">{{ $t('coi.addCoiDesc') }}</p>

      <form class="coi-form" @submit.prevent="addCoi">
        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('coi.coiName') }} <span class="required">*</span></label>
            <input v-model="newCoi.coiName" :placeholder="$t('coi.placeholderName')" required />
          </div>
          <div class="form-group">
            <label>{{ $t('coi.email') }}</label>
            <input v-model="newCoi.email" type="email" :placeholder="$t('coi.placeholderEmail')" />
          </div>
          <div class="form-group">
            <label>{{ $t('coi.cellPhone') }}</label>
            <input v-model="newCoi.cell" :placeholder="$t('coi.placeholderPhone')" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('coi.entityCompany') }}</label>
            <input v-model="newCoi.entity" :placeholder="$t('coi.placeholderCompany')" />
          </div>
          <div class="form-group">
            <label>{{ $t('coi.position') }}</label>
            <input v-model="newCoi.position" :placeholder="$t('coi.placeholderPosition')" />
          </div>
          <div class="form-group">
            <label>{{ $t('coi.industry') }}</label>
            <select v-model="newCoi.industry">
              <option value="">{{ $t('coi.selectIndustry') }}</option>
              <option v-for="opt in industryOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>{{ $t('coi.leadPartner') }}</label>
            <select v-model="newCoi.leadRelationshipPartner">
              <option value="">{{ $t('coi.selectPartner') }}</option>
              <option v-for="opt in partnerOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ $t('coi.relationshipSupport') }}</label>
            <select v-model="newCoi.relationshipSupport">
              <option value="">{{ $t('coi.selectStaff') }}</option>
              <option v-for="opt in staffOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div class="form-group btn-group">
            <button type="submit" class="btn-add" :disabled="!newCoi.coiName.trim() || savingCoi">
              {{ savingCoi ? $t('coi.saving') : $t('coi.addCoiBtn') }}
            </button>
          </div>
        </div>
      </form>
    </section>

    <!-- COI Entries Table -->
    <section class="card">
      <div class="card-header-row">
        <div>
          <h2>{{ $t('coi.directory') }}</h2>
          <p class="section-desc">{{ $t('coi.directoryDesc') }}</p>
        </div>
        <button
          v-if="selectedIds.length > 0"
          class="btn-remove-selected"
          :disabled="deletingSelected"
          @click="removeSelectedCois"
        >
          {{ deletingSelected ? $t('coi.removing') : $t('coi.removeSelected', { count: selectedIds.length }) }}
        </button>
      </div>

      <p v-if="loadingEntries">{{ $t('coi.loadingEntries') }}</p>
      <table v-else-if="coiEntries.length > 0">
        <thead>
          <tr>
            <th class="checkbox-col">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll"
                :title="$t('coi.selectAll')"
              />
            </th>
            <th>{{ $t('coi.name') }}</th>
            <th>{{ $t('coi.entity') }}</th>
            <th>{{ $t('coi.industry') }}</th>
            <th>{{ $t('coi.email') }}</th>
            <th>{{ $t('coi.cell') }}</th>
            <th>{{ $t('coi.leadPartner') }}</th>
            <th class="progress-col">{{ $t('coi.couldWe') }}</th>
            <th class="progress-col">{{ $t('coi.howWouldWe') }}</th>
            <th class="progress-col">{{ $t('coi.willWe') }}</th>
            <th class="progress-col">{{ $t('coi.testReview') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in coiEntries"
            :key="entry.id"
            :class="{ 'row-selected': selectedIds.includes(entry.id) }"
          >
            <td class="checkbox-col">
              <input
                type="checkbox"
                :checked="selectedIds.includes(entry.id)"
                @change="toggleSelection(entry.id)"
              />
            </td>
            <td>{{ entry.coiName }}</td>
            <td>{{ entry.entity || "-" }}</td>
            <td>{{ entry.industry || "-" }}</td>
            <td>{{ entry.email || "-" }}</td>
            <td>{{ entry.cell || "-" }}</td>
            <td>{{ entry.leadRelationshipPartner || "-" }}</td>
            <td class="progress-col">
              <input
                type="checkbox"
                :checked="!!entry.couldWe"
                @change="toggleProgress(entry, 'couldWe')"
              />
            </td>
            <td class="progress-col">
              <input
                type="checkbox"
                :checked="!!entry.howWouldWe"
                @change="toggleProgress(entry, 'howWouldWe')"
              />
            </td>
            <td class="progress-col">
              <input
                type="checkbox"
                :checked="!!entry.willWe"
                @change="toggleProgress(entry, 'willWe')"
              />
            </td>
            <td class="progress-col">
              <input
                type="checkbox"
                :checked="!!entry.testReview"
                @change="toggleProgress(entry, 'testReview')"
              />
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-table">{{ $t('coi.noEntries') }}</p>
    </section>

    <p v-if="errorText" class="error">{{ errorText }}</p>
    <p v-if="loading">{{ $t('coi.loadingSummary') }}</p>

    <!-- Performance Table -->
    <section class="card">
      <h2>{{ $t('coi.performanceTitle') }}</h2>
      <p class="section-desc">{{ $t('coi.performanceDesc') }}</p>
      <table v-if="summaryItems.length > 0">
        <thead>
          <tr>
            <th>{{ $t('coi.coiName') }}</th>
            <th>{{ $t('coi.referrals') }}</th>
            <th>{{ $t('coi.active') }}</th>
            <th>{{ $t('coi.converted') }}</th>
            <th>{{ $t('coi.conversionRate') }}</th>
            <th>{{ $t('coi.proposedFeeValue') }}</th>
            <th>{{ $t('coi.securedFeeValue') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in summaryItems" :key="item.coiName">
            <td>{{ item.coiName }}</td>
            <td>{{ item.totalReferrals }}</td>
            <td>{{ item.active }}</td>
            <td>{{ item.converted }}</td>
            <td>{{ item.totalReferrals > 0 ? ((item.converted / item.totalReferrals) * 100).toFixed(1) : '0.0' }}%</td>
            <td>${{ item.proposedValue.toLocaleString() }}</td>
            <td>${{ item.securedValue.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty-table">{{ $t('coi.noReferralData') }}</p>
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
    radial-gradient(circle at top right, rgba(31, 157, 64, 0.1) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(150, 230, 170, 0.08) 0%, transparent 30%),
    radial-gradient(circle at bottom right, rgba(31, 157, 64, 0.06) 0%, transparent 35%),
    linear-gradient(180deg, #f0faf2 0%, #e8f7ec 100%);
}
.page-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(150, 230, 170, 0.25) 0%, transparent 40%),
    linear-gradient(135deg, #2cb850 0%, #1f9d40 25%, #1a8537 50%, #156d2d 75%, #105523 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(31, 157, 64, 0.35),
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
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  color: #1a8537;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
.refresh-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15); }
.card {
  border: 1px solid rgba(114, 135, 161, 0.25);
  border-radius: 14px;
  background: linear-gradient(175deg, #ffffff 0%, #f7fbff 100%);
  padding: 1.25rem;
  overflow: auto;
  box-shadow: 0 10px 24px rgba(17, 37, 63, 0.07);
}
.card h2 {
  margin: 0 0 0.25rem;
  font-size: 1.1rem;
  color: #1e293b;
}
.section-desc {
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: #64748b;
}
.summary-strip { display: grid; gap: 0.58rem; grid-template-columns: repeat(6, minmax(0, 1fr)); }
.summary-strip article {
  border-radius: 18px;
  padding: 0.62rem 0.7rem;
  background: linear-gradient(180deg, #dcfce7, #bbf7d0);
  box-shadow: 0 12px 28px rgba(31, 157, 64, 0.12);
}
.summary-strip span { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #16a34a; }
.summary-strip strong { display: block; margin-top: 0.2rem; font-size: 1.2rem; color: #15803d; }

/* Add COI Section */
.add-section {
  background: linear-gradient(175deg, #f0fdf4 0%, #dcfce7 100%);
}
.coi-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.form-group label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
}
.form-group .required {
  color: #dc2626;
}
.form-group input,
.form-group select {
  border: 1px solid #86efac;
  border-radius: 10px;
  padding: 0.6rem 0.85rem;
  font-size: 0.9rem;
  background: white;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #22c55e;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}
.btn-group {
  display: flex;
  align-items: flex-end;
}
.btn-add {
  background: #1f9d40;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0.6rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
  width: 100%;
}
.btn-add:hover:not(:disabled) { background: #16a34a; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.card-header-row h2 {
  margin: 0 0 0.25rem;
}
.card-header-row .section-desc {
  margin: 0;
}

.btn-remove-selected {
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s;
}
.btn-remove-selected:hover:not(:disabled) { background: #b91c1c; }
.btn-remove-selected:disabled { opacity: 0.6; cursor: not-allowed; }

.checkbox-col {
  width: 40px;
  text-align: center;
}
.checkbox-col input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #1f9d40;
}

.progress-col {
  width: 90px;
  text-align: center;
  white-space: nowrap;
}
.progress-col input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: #22c55e;
}

.row-selected {
  background: #dcfce7 !important;
}

.empty-table {
  color: #94a3b8;
  font-style: italic;
  font-size: 0.9rem;
}

table { width: 100%; border-collapse: collapse; min-width: 600px; }
th, td { border-bottom: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; text-align: left; font-size: 0.875rem; }
thead th {
  background: #f8fafc;
  color: #475569;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
}
tbody tr:hover { background: #f0fdf4; }
.error { color: #b91c1c; font-weight: 700; }
@media (max-width: 980px) {
  .summary-strip { grid-template-columns: repeat(3, 1fr); }
  .form-row { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .summary-strip { grid-template-columns: 1fr; }
  .form-row { grid-template-columns: 1fr; }
}
</style>
