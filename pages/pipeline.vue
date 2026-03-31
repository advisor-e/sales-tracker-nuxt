<script>
export default {
  name: 'PipelinePage',

  data() {
    return {
      search: "",
      ownerFilter: "",
      items: [],
      errorText: "",
      loading: false,
      showAddForm: false,
      submitting: false,
      coiEntries: [],
      draft: this.emptyDraft(),
      defaultColumnWidths: {
        prospect: 180,
        business: 160,
        partner: 120,
        leadStaff: 120,
        status: 110,
        relationship: 120,
        source: 120,
        coi: 140,
        industry: 120,
        approachDate: 120,
        approachStyle: 110,
        meeting: 70,
        quizDone: 80,
        salesStyle: 110,
        meetingDate: 120,
        followUp: 75,
        followUpDate: 120,
        tnStage: 110,
        proposal: 75,
        proposalValue: 110,
        secured: 75,
        dateSecured: 120,
        securedValue: 110,
        additionalWork: 110,
        comments: 250,
        actions: 50
      },
      columnWidths: {},
      customHeaderLabels: {},
      defaultColumnOrder: [
        'prospect', 'business', 'partner', 'leadStaff', 'status', 'relationship', 'source',
        'coi', 'industry', 'approachDate', 'approachStyle', 'meeting', 'quizDone', 'salesStyle',
        'meetingDate', 'followUp', 'followUpDate', 'tnStage', 'proposal', 'proposalValue',
        'secured', 'dateSecured', 'securedValue', 'additionalWork', 'comments'
      ],
      columnOrder: [],
      draggingColumn: null,
      dragOverColumn: null,
      resizing: null,
      money: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    };
  },

  computed: {
    statusOptions() {
      return this.$store.getters['lists/getListItems']('prospectStatus');
    },
    relationshipOptions() {
      return this.$store.getters['lists/getListItems']('relationshipType');
    },
    sourceOptions() {
      return this.$store.getters['lists/getListItems']('prospectSource');
    },
    approachOptions() {
      return this.$store.getters['lists/getListItems']('approachStyle');
    },
    salesStyleOptions() {
      return this.$store.getters['lists/getListItems']('salesStyle');
    },
    totalNeedsStageOptions() {
      return this.$store.getters['lists/getListItems']('totalNeedsStage');
    },
    partnerOptions() {
      return this.$store.getters['lists/getListItems']('partner');
    },
    leadStaffOptions() {
      return this.$store.getters['lists/getListItems']('leadStaff');
    },
    industryOptions() {
      return this.$store.getters['lists/getListItems']('industry');
    },
    statusColors() {
      return this.$store.getters['lists/getListColors']('prospectStatus');
    },
    coiOptions() {
      return this.coiEntries.map(e => e.coiName);
    },
    defaultHeaderLabels() {
      return {
        prospect: this.$t('pipeline.columns.prospect'),
        business: this.$t('pipeline.columns.business'),
        partner: this.$t('pipeline.columns.partner'),
        leadStaff: this.$t('pipeline.columns.leadStaff'),
        status: this.$t('pipeline.columns.status'),
        relationship: this.$t('pipeline.columns.relationship'),
        source: this.$t('pipeline.columns.source'),
        coi: this.$t('pipeline.columns.coi'),
        industry: this.$t('pipeline.columns.industry'),
        approachDate: this.$t('pipeline.columns.approachDate'),
        approachStyle: this.$t('pipeline.columns.approachStyle'),
        meeting: this.$t('pipeline.columns.meeting'),
        quizDone: this.$t('pipeline.columns.quizDone'),
        salesStyle: this.$t('pipeline.columns.salesStyle'),
        meetingDate: this.$t('pipeline.columns.meetingDate'),
        followUp: this.$t('pipeline.columns.followUp'),
        followUpDate: this.$t('pipeline.columns.followUpDate'),
        tnStage: this.$t('pipeline.columns.tnStage'),
        proposal: this.$t('pipeline.columns.proposal'),
        proposalValue: this.$t('pipeline.columns.proposalValue'),
        secured: this.$t('pipeline.columns.secured'),
        dateSecured: this.$t('pipeline.columns.dateSecured'),
        securedValue: this.$t('pipeline.columns.securedValue'),
        additionalWork: this.$t('pipeline.columns.additionalWork'),
        comments: this.$t('pipeline.columns.comments')
      };
    },
    headerLabels() {
      return {
        ...this.defaultHeaderLabels,
        ...this.customHeaderLabels
      };
    },
    totalProspects() {
      return this.items.length;
    },
    activeProspects() {
      return this.items.filter(i => i.prospectStatus === "Active").length;
    },
    meetingsCount() {
      return this.items.filter(i => i.secureMeeting).length;
    },
    proposalsSent() {
      return this.items.filter(i => i.proposalSent).length;
    },
    securedCount() {
      return this.items.filter(i => i.jobSecured).length;
    },
    totalSecuredValue() {
      return this.items.reduce((sum, i) => sum + Number(i.jobSecuredValue || 0), 0);
    },
    totalProposalValue() {
      return this.items.reduce((sum, i) => sum + Number(i.proposalValue || 0), 0);
    }
  },

  methods: {
    emptyDraft() {
      return {
        prospectName: "",
        businessName: "",
        partner: "",
        leadStaff: "",
        prospectStatus: "Active",
        dateLastContact: "",
        address: "",
        contactPhone: "",
        email: "",
        industry: "",
        existingFeeValue: "",
        supportStaff: "",
        relationshipType: "New Prospect",
        prospectSource: "",
        coiInvolved: "",
        approachDate: "",
        approachStyle: "",
        secureMeeting: false,
        quizCompleted: false,
        salesStyle: "",
        meetingTheme: "",
        meetingDate: "",
        followUpMeeting: false,
        followUpMeetingDate: "",
        totalNeedsStage: "",
        proposalSent: false,
        proposalValue: 0,
        jobSecured: false,
        dateSecured: "",
        jobSecuredValue: 0,
        additionalWorkSecured: 0,
        comments: ""
      };
    },
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
    loadColumnWidths() {
      if (typeof window === "undefined") return { ...this.defaultColumnWidths };
      try {
        const saved = localStorage.getItem("pipeline-column-widths");
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...this.defaultColumnWidths, ...parsed };
        }
      } catch {
        // ignore parse errors
      }
      return { ...this.defaultColumnWidths };
    },
    loadCustomHeaderLabels() {
      if (typeof window === "undefined") return {};
      try {
        const saved = localStorage.getItem("pipeline-header-labels");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch {
        // ignore parse errors
      }
      return {};
    },
    loadColumnOrder() {
      if (typeof window === "undefined") return [...this.defaultColumnOrder];
      try {
        const saved = localStorage.getItem("pipeline-column-order");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && this.defaultColumnOrder.every(col => parsed.includes(col))) {
            return parsed;
          }
        }
      } catch {
        // ignore parse errors
      }
      return [...this.defaultColumnOrder];
    },
    onDragStart(col, event) {
      this.draggingColumn = col;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', col);
      }
    },
    onDragOver(col, event) {
      event.preventDefault();
      if (this.draggingColumn && this.draggingColumn !== col) {
        this.dragOverColumn = col;
      }
    },
    onDragLeave() {
      this.dragOverColumn = null;
    },
    onDrop(col, event) {
      event.preventDefault();
      if (!this.draggingColumn || this.draggingColumn === col) {
        this.draggingColumn = null;
        this.dragOverColumn = null;
        return;
      }

      const order = [...this.columnOrder];
      const fromIndex = order.indexOf(this.draggingColumn);
      const toIndex = order.indexOf(col);

      if (fromIndex !== -1 && toIndex !== -1) {
        order.splice(fromIndex, 1);
        order.splice(toIndex, 0, this.draggingColumn);
        this.columnOrder = order;

        try {
          localStorage.setItem("pipeline-column-order", JSON.stringify(order));
        } catch {
          // ignore storage errors
        }
      }

      this.draggingColumn = null;
      this.dragOverColumn = null;
    },
    onDragEnd() {
      this.draggingColumn = null;
      this.dragOverColumn = null;
    },
    getCellClass(col) {
      const classes = [];

      if (col === this.columnOrder[0]) {
        classes.push('sticky-col');
      }

      if (['meeting', 'quizDone', 'followUp', 'proposal', 'secured'].includes(col)) {
        classes.push('center');
      }

      if (['proposalValue', 'additionalWork'].includes(col)) {
        classes.push('money-cell');
      }

      if (col === 'securedValue') {
        classes.push('money-cell', 'secured');
      }

      return classes;
    },
    saveHeaderLabel(col, event) {
      const target = event.target;
      const newLabel = target.innerText.trim() || this.defaultHeaderLabels[col];
      target.innerText = newLabel;
      if (newLabel !== this.defaultHeaderLabels[col]) {
        this.$set(this.customHeaderLabels, col, newLabel);
      } else {
        this.$delete(this.customHeaderLabels, col);
      }
      try {
        localStorage.setItem("pipeline-header-labels", JSON.stringify(this.customHeaderLabels));
      } catch {
        // ignore storage errors
      }
    },
    startResize(col, event) {
      event.preventDefault();
      this.resizing = {
        col,
        startX: event.clientX,
        startWidth: this.columnWidths[col]
      };
      document.addEventListener("mousemove", this.onResize);
      document.addEventListener("mouseup", this.stopResize);
    },
    onResize(event) {
      if (!this.resizing) return;
      const delta = event.clientX - this.resizing.startX;
      const newWidth = Math.max(50, this.resizing.startWidth + delta);
      this.$set(this.columnWidths, this.resizing.col, newWidth);
    },
    stopResize() {
      this.resizing = null;
      document.removeEventListener("mousemove", this.onResize);
      document.removeEventListener("mouseup", this.stopResize);
      try {
        localStorage.setItem("pipeline-column-widths", JSON.stringify(this.columnWidths));
      } catch {
        // ignore storage errors
      }
    },
    toInputDate(dateStr) {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    },
    async loadCoiEntries() {
      try {
        const res = await fetch("/api/coi", { credentials: 'same-origin' }).then(r => r.json());
        this.coiEntries = res.items;
      } catch {
        // Silently fail - COI dropdown will just be empty
      }
    },
    async loadItems() {
      this.loading = true;
      this.errorText = "";
      try {
        const params = new URLSearchParams();
        if (this.search) params.append('search', this.search);
        if (this.ownerFilter) params.append('owner', this.ownerFilter);
        const url = `/api/pipeline${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, { credentials: 'same-origin' }).then(r => r.json());
        this.items = res.items;
      } catch (error) {
        if (Number(error?.statusCode) === 401) {
          this.$router.push('/login');
          return;
        }
        this.errorText = String(error?.message || "Failed to load");
      } finally {
        this.loading = false;
      }
    },
    async createItem() {
      if (this.submitting) return;
      this.submitting = true;
      this.errorText = "";
      try {
        await this.apiFetch("/api/pipeline", { method: "POST", body: this.draft });
        Object.assign(this.draft, this.emptyDraft());
        this.showAddForm = false;
        await this.loadItems();
      } catch (error) {
        this.errorText = String(error?.message || "Failed to create");
      } finally {
        this.submitting = false;
      }
    },
    async updateField(item, field, value) {
      try {
        await this.apiFetch(`/api/pipeline/${item.id}`, {
          method: "PATCH",
          body: { [field]: value }
        });
        item[field] = value;
      } catch (error) {
        this.errorText = String(error?.message || "Failed to update");
      }
    },
    async removeItem(item) {
      if (!confirm(`Delete prospect "${item.prospectName}"?`)) return;
      try {
        await this.apiFetch(`/api/pipeline/${item.id}`, { method: "DELETE" });
        await this.loadItems();
      } catch (error) {
        this.errorText = String(error?.message || "Failed to delete");
      }
    }
  },

  mounted() {
    this.columnWidths = this.loadColumnWidths();
    this.customHeaderLabels = this.loadCustomHeaderLabels();
    this.columnOrder = this.loadColumnOrder();
    Promise.all([
      this.$store.dispatch('lists/fetchLists'),
      this.loadItems(),
      this.loadCoiEntries()
    ]);
  }
};
</script>

<template lang="pug">
  .pipeline-page
    header.page-header
      .header-content
        .header-text
          span.header-badge {{ $t('pipeline.badge') }}
          h1 {{ $t('pipeline.title') }}
          p {{ $t('pipeline.subtitle') }}
        .header-actions
          button.btn-primary(@click="showAddForm = !showAddForm")
            | {{ showAddForm ? $t('common.cancel') : $t('pipeline.addProspect') }}
          button.btn-secondary(@click="loadItems") {{ $t('common.refresh') }}

    section.stats-bar
      .stat-item
        span.stat-label {{ $t('pipeline.totalProspects') }}
        span.stat-value {{ totalProspects }}
      .stat-item.active
        span.stat-label {{ $t('pipeline.active') }}
        span.stat-value {{ activeProspects }}
      .stat-item
        span.stat-label {{ $t('pipeline.meetings') }}
        span.stat-value {{ meetingsCount }}
      .stat-item
        span.stat-label {{ $t('pipeline.proposals') }}
        span.stat-value {{ proposalsSent }}
      .stat-item.secured
        span.stat-label {{ $t('pipeline.secured') }}
        span.stat-value {{ securedCount }}
      .stat-item.money
        span.stat-label {{ $t('pipeline.proposalValue') }}
        span.stat-value {{ money.format(totalProposalValue) }}
      .stat-item.money.secured
        span.stat-label {{ $t('pipeline.securedValue') }}
        span.stat-value {{ money.format(totalSecuredValue) }}

    section.add-form-panel(v-if="showAddForm")
      h2 {{ $t('pipeline.newProspect') }}
      .form-grid
        .form-group
          label Prospect Name *
          input(v-model="draft.prospectName" placeholder="Name")
        .form-group
          label Business Name
          input(v-model="draft.businessName" placeholder="Business")
        .form-group
          label Partner
          select(v-model="draft.partner")
            option(value="") Select...
            option(v-for="opt in partnerOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Lead Staff
          select(v-model="draft.leadStaff")
            option(value="") Select...
            option(v-for="opt in leadStaffOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Status
          select(v-model="draft.prospectStatus")
            option(v-for="opt in statusOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Relationship Type
          select(v-model="draft.relationshipType")
            option(v-for="opt in relationshipOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Source
          select(v-model="draft.prospectSource")
            option(value="") Select...
            option(v-for="opt in sourceOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Industry
          select(v-model="draft.industry")
            option(value="") Select...
            option(v-for="opt in industryOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Email
          input(v-model="draft.email" type="email" placeholder="Email")
        .form-group
          label Phone
          input(v-model="draft.contactPhone" placeholder="Phone")
        .form-group
          label Approach Date
          input(v-model="draft.approachDate" type="date")
        .form-group
          label Approach Style
          select(v-model="draft.approachStyle")
            option(value="") Select...
            option(v-for="opt in approachOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label Sales Style
          select(v-model="draft.salesStyle")
            option(value="") Select...
            option(v-for="opt in salesStyleOptions" :key="opt" :value="opt") {{ opt }}
        .form-group
          label COI Involved
          select(v-model="draft.coiInvolved" :disabled="draft.prospectSource !== 'Referral'")
            option(value="") {{ draft.prospectSource === 'Referral' ? 'Select COI...' : 'N/A' }}
            option(v-for="opt in coiOptions" :key="opt" :value="opt") {{ opt }}
        .form-group.full-width
          label Comments
          textarea(v-model="draft.comments" rows="2" placeholder="Notes...")
      .form-actions
        button.btn-primary(:disabled="!draft.prospectName.trim() || submitting" @click="createItem")
          | {{ submitting ? $t('pipeline.saving') : $t('pipeline.saveProspect') }}
        button.btn-secondary(@click="showAddForm = false") {{ $t('common.cancel') }}

    section.filters-bar
      input(v-model="search" :placeholder="$t('pipeline.searchProspects')" @keyup.enter="loadItems")
      input(v-model="ownerFilter" :placeholder="$t('pipeline.filterByOwner')" @keyup.enter="loadItems")
      button.btn-secondary(@click="loadItems") {{ $t('pipeline.apply') }}

    p.error-msg(v-if="errorText") {{ errorText }}
    p.loading-msg(v-if="loading") {{ $t('pipeline.loadingData') }}

    .table-container
      table.data-table(:class="{ resizing: resizing }")
        thead
          tr
            th(
              v-for="col in columnOrder"
              :key="col"
              :class="['resizable', { 'sticky-col': col === columnOrder[0], 'dragging': draggingColumn === col, 'drag-over': dragOverColumn === col }]"
              :style="{ width: columnWidths[col] + 'px', minWidth: columnWidths[col] + 'px' }"
              draggable="true"
              @dragstart="onDragStart(col, $event)"
              @dragover="onDragOver(col, $event)"
              @dragleave="onDragLeave"
              @drop="onDrop(col, $event)"
              @dragend="onDragEnd"
            )
              span.drag-handle(title="Drag to reorder") ⠿
              span.header-text(contenteditable="true" @blur="saveHeaderLabel(col, $event)" @keydown.enter.prevent="$event.target.blur()") {{ headerLabels[col] }}
              span.resize-handle(@mousedown="startResize(col, $event)")
            th.actions-col(:style="{ width: columnWidths.actions + 'px' }")
        tbody
          tr(v-for="item in items" :key="item.id" :class="['status-' + item.prospectStatus.toLowerCase().replace(/\s+/g, '-')]")
            td(v-for="col in columnOrder" :key="col" :class="getCellClass(col)")
              input.cell-input(v-if="col === 'prospect'" v-model="item.prospectName" @blur="updateField(item, 'prospectName', item.prospectName)")
              input.cell-input(v-else-if="col === 'business'" v-model="item.businessName" @blur="updateField(item, 'businessName', item.businessName)")
              input.cell-input.wide(v-else-if="col === 'comments'" v-model="item.comments" @blur="updateField(item, 'comments', item.comments)")
              select.cell-select(v-else-if="col === 'partner'" v-model="item.partner" @change="updateField(item, 'partner', item.partner)")
                option(value="") -
                option(v-for="opt in partnerOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'leadStaff'" v-model="item.leadStaff" @change="updateField(item, 'leadStaff', item.leadStaff)")
                option(value="") -
                option(v-for="opt in leadStaffOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'status'" v-model="item.prospectStatus" @change="updateField(item, 'prospectStatus', item.prospectStatus)")
                option(v-for="opt in statusOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'relationship'" v-model="item.relationshipType" @change="updateField(item, 'relationshipType', item.relationshipType)")
                option(value="") -
                option(v-for="opt in relationshipOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'source'" v-model="item.prospectSource" @change="updateField(item, 'prospectSource', item.prospectSource)")
                option(value="") -
                option(v-for="opt in sourceOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'coi'" v-model="item.coiInvolved" @change="updateField(item, 'coiInvolved', item.coiInvolved)")
                option(value="") -
                option(v-for="opt in coiOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'industry'" v-model="item.industry" @change="updateField(item, 'industry', item.industry)")
                option(value="") -
                option(v-for="opt in industryOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'approachStyle'" v-model="item.approachStyle" @change="updateField(item, 'approachStyle', item.approachStyle)")
                option(value="") -
                option(v-for="opt in approachOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'salesStyle'" v-model="item.salesStyle" @change="updateField(item, 'salesStyle', item.salesStyle)")
                option(value="") -
                option(v-for="opt in salesStyleOptions" :key="opt" :value="opt") {{ opt }}
              select.cell-select(v-else-if="col === 'tnStage'" v-model="item.totalNeedsStage" @change="updateField(item, 'totalNeedsStage', item.totalNeedsStage)")
                option(value="") -
                option(v-for="opt in totalNeedsStageOptions" :key="opt" :value="opt") {{ opt }}
              input.cell-input.date(v-else-if="col === 'approachDate'" :value="toInputDate(item.approachDate)" type="date" @change="updateField(item, 'approachDate', $event.target.value)")
              input.cell-input.date(v-else-if="col === 'meetingDate'" :value="toInputDate(item.meetingDate)" type="date" @change="updateField(item, 'meetingDate', $event.target.value)")
              input.cell-input.date(v-else-if="col === 'followUpDate'" :value="toInputDate(item.followUpMeetingDate)" type="date" @change="updateField(item, 'followUpMeetingDate', $event.target.value)")
              input.cell-input.date(v-else-if="col === 'dateSecured'" :value="toInputDate(item.dateSecured)" type="date" @change="updateField(item, 'dateSecured', $event.target.value)")
              input(v-else-if="col === 'meeting'" type="checkbox" :checked="item.secureMeeting" @change="updateField(item, 'secureMeeting', !item.secureMeeting)")
              input(v-else-if="col === 'quizDone'" type="checkbox" :checked="item.quizCompleted" @change="updateField(item, 'quizCompleted', !item.quizCompleted)")
              input(v-else-if="col === 'followUp'" type="checkbox" :checked="item.followUpMeeting" @change="updateField(item, 'followUpMeeting', !item.followUpMeeting)")
              input(v-else-if="col === 'proposal'" type="checkbox" :checked="item.proposalSent" @change="updateField(item, 'proposalSent', !item.proposalSent)")
              input(v-else-if="col === 'secured'" type="checkbox" :checked="item.jobSecured" @change="updateField(item, 'jobSecured', !item.jobSecured)")
              input.cell-input.number(v-else-if="col === 'proposalValue'" :value="item.proposalValue" type="number" @blur="updateField(item, 'proposalValue', Number($event.target.value))")
              input.cell-input.number(v-else-if="col === 'securedValue'" :value="item.jobSecuredValue" type="number" @blur="updateField(item, 'jobSecuredValue', Number($event.target.value))")
              input.cell-input.number(v-else-if="col === 'additionalWork'" :value="item.additionalWorkSecured" type="number" @blur="updateField(item, 'additionalWorkSecured', Number($event.target.value))")
            td.actions-col
              button.btn-delete(@click="removeItem(item)" title="Delete") ×
</template>

<style scoped>
.pipeline-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(0, 43, 100, 0.08) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(127, 211, 241, 0.1) 0%, transparent 30%),
    radial-gradient(circle at bottom right, rgba(0, 177, 224, 0.08) 0%, transparent 35%),
    linear-gradient(180deg, #f0f5fa 0%, #e8eff6 100%);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header */
.page-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(127, 211, 241, 0.25) 0%, transparent 40%),
    radial-gradient(ellipse at 60% 80%, rgba(0, 177, 224, 0.2) 0%, transparent 45%),
    linear-gradient(135deg, #004080 0%, #003366 25%, #002b64 50%, #00224d 75%, #001a3d 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(0, 43, 100, 0.4),
    0 8px 25px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
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

.page-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1));
  padding: 0.3rem 0.9rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
}
.header-text h1 {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  letter-spacing: -0.02em;
}
.header-text p {
  margin: 0.6rem 0 0;
  opacity: 0.9;
  font-size: 1rem;
  line-height: 1.5;
  max-width: 420px;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}
.header-actions {
  display: flex;
  gap: 0.75rem;
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  color: #002b64;
  border: none;
  border-radius: 12px;
  padding: 0.7rem 1.5rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.btn-primary::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, transparent 40%, rgba(0, 43, 100, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.btn-primary:hover::before {
  opacity: 1;
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.1));
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 0.7rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.15));
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-1px);
}

/* Stats Bar */
.stats-bar {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  min-width: 100px;
  flex: 1;
  text-align: center;
}

.stat-item.active {
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
}

.stat-item.secured {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
}

.stat-item.money {
  min-width: 140px;
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  font-weight: 600;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

/* Add Form */
.add-form-panel {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.add-form-panel h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1e293b;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #475569;
}

.form-group input,
.form-group select,
.form-group textarea {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.form-actions .btn-primary {
  background: linear-gradient(135deg, #003d80 0%, #002b64 100%);
  color: white;
}

.form-actions .btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filters-bar input,
.filters-bar select {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  min-width: 150px;
}

.filters-bar .btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

/* Messages */
.error-msg {
  color: #dc2626;
  font-weight: 600;
  padding: 0.75rem;
  background: #fef2f2;
  border-radius: 8px;
}

.loading-msg {
  color: #64748b;
  font-style: italic;
}

/* Data Table */
.table-container {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: auto;
  flex: 1;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  font-size: 0.8rem;
}

.data-table.resizing {
  cursor: col-resize;
  user-select: none;
}

.data-table th {
  background: #f8fafc;
  padding: 0.6rem 0.5rem;
  text-align: left;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #475569;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th.resizable {
  position: relative;
}

.header-text {
  display: inline-block;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  cursor: text;
  transition: background-color 0.15s, box-shadow 0.15s;
  outline: none;
  min-width: 20px;
}

.header-text:hover {
  background: rgba(0, 43, 100, 0.1);
}

.header-text:focus {
  background: white;
  box-shadow: 0 0 0 2px rgba(0, 43, 100, 0.3);
}

/* Drag handle */
.drag-handle {
  cursor: grab;
  opacity: 0.4;
  font-size: 0.9rem;
  margin-right: 0.35rem;
  user-select: none;
  transition: opacity 0.15s;
}

.drag-handle:hover {
  opacity: 0.8;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Dragging state */
.data-table th.dragging {
  opacity: 0.5;
  background: #e0e7ff;
}

.data-table th.drag-over {
  border-left: 3px solid #002b64;
  background: #e6eef8;
}

.data-table th[draggable="true"] {
  cursor: grab;
}

.data-table th[draggable="true"]:active {
  cursor: grabbing;
}


.resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  background: transparent;
  border-right: 2px solid transparent;
  transition: border-color 0.15s, background-color 0.15s;
  z-index: 20;
}

.resize-handle:hover {
  border-right-color: #002b64;
  background: rgba(0, 43, 100, 0.15);
}

.resize-handle:active,
.data-table.resizing .resize-handle {
  border-right-color: #001a3d;
  background: rgba(0, 43, 100, 0.25);
}

.data-table td {
  padding: 0.25rem 0.35rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sticky-col {
  position: sticky;
  left: 0;
  z-index: 5;
  background: white;
}

.data-table th.sticky-col {
  z-index: 15;
  background: #f8fafc;
}

.actions-col {
  width: 40px;
  text-align: center;
}

/* Row status colors */
.status-active td {
  background: #f0fdf4;
}

.status-active .sticky-col {
  background: #f0fdf4;
}

.status-on-hold td {
  background: #fefce8;
}

.status-on-hold .sticky-col {
  background: #fefce8;
}

.status-await-research td {
  background: #eff6ff;
}

.status-await-research .sticky-col {
  background: #eff6ff;
}

.status-completed td {
  background: #f0fdf4;
}

.status-completed .sticky-col {
  background: #f0fdf4;
}

.status-dead td {
  background: #fef2f2;
}

.status-dead .sticky-col {
  background: #fef2f2;
}

/* Cell inputs */
.cell-input,
.cell-select {
  width: 100%;
  max-width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0.3rem 0.4rem;
  font-size: 0.8rem;
  background: transparent;
  transition: border-color 0.15s, background-color 0.15s;
  box-sizing: border-box;
}

.cell-input:hover,
.cell-select:hover {
  border-color: #cbd5e1;
  background: white;
}

.cell-input:focus,
.cell-select:focus {
  outline: none;
  border-color: #002b64;
  background: white;
  box-shadow: 0 0 0 2px rgba(0, 43, 100, 0.1);
}

.cell-input.date {
  width: 100%;
}

.cell-input.number {
  width: 100%;
  text-align: right;
}

.cell-input.wide {
  width: 100%;
}

.center {
  text-align: center;
}

.money-cell {
  text-align: right;
}

.money-cell.secured .cell-input {
  color: #16a34a;
  font-weight: 600;
}

/* Delete button */
.btn-delete {
  background: #fee2e2;
  color: #dc2626;
  border: none;
  border-radius: 6px;
  width: 26px;
  height: 26px;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: #fecaca;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .stats-bar {
    flex-direction: column;
  }

  .stat-item {
    width: 100%;
  }
}
</style>
