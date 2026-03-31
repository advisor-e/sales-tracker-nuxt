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
  section.section.pipeline-page
    //- Page header
    header.pipeline-header.mb-4
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-light" rounded) {{ $t('pipeline.badge') }}
              h1.title.is-spaced.has-text-white.mt-2 {{ $t('pipeline.title') }}
              p.subtitle.has-text-white-ter {{ $t('pipeline.subtitle') }}
        .level-right
          .level-item
            .buttons
              b-button(
                @click="showAddForm = !showAddForm"
                type="is-white"
                rounded
              ) {{ showAddForm ? $t('common.cancel') : $t('pipeline.addProspect') }}
              b-button(
                @click="loadItems"
                :loading="loading"
                type="is-white"
                outlined
                rounded
              ) {{ $t('common.refresh') }}

    //- Stats bar
    .columns.is-multiline.mb-3
      .column.is-auto
        .box.has-text-centered.stat-box
          p.heading {{ $t('pipeline.totalProspects') }}
          p.title.is-4 {{ totalProspects }}
      .column.is-auto
        .box.has-text-centered.stat-box.is-active
          p.heading {{ $t('pipeline.active') }}
          p.title.is-4 {{ activeProspects }}
      .column.is-auto
        .box.has-text-centered.stat-box
          p.heading {{ $t('pipeline.meetings') }}
          p.title.is-4 {{ meetingsCount }}
      .column.is-auto
        .box.has-text-centered.stat-box
          p.heading {{ $t('pipeline.proposals') }}
          p.title.is-4 {{ proposalsSent }}
      .column.is-auto
        .box.has-text-centered.stat-box.is-secured
          p.heading {{ $t('pipeline.secured') }}
          p.title.is-4 {{ securedCount }}
      .column
        .box.has-text-centered.stat-box
          p.heading {{ $t('pipeline.proposalValue') }}
          p.title.is-5 {{ money.format(totalProposalValue) }}
      .column
        .box.has-text-centered.stat-box.is-secured
          p.heading {{ $t('pipeline.securedValue') }}
          p.title.is-5 {{ money.format(totalSecuredValue) }}

    //- Add form
    .box.mb-4(v-if="showAddForm")
      p.title.is-5.mb-4 {{ $t('pipeline.newProspect') }}
      .columns.is-multiline
        .column.is-3
          b-field(label="Prospect Name *")
            b-input(v-model="draft.prospectName" placeholder="Name" expanded)
        .column.is-3
          b-field(label="Business Name")
            b-input(v-model="draft.businessName" placeholder="Business" expanded)
        .column.is-3
          b-field(label="Partner")
            b-select(v-model="draft.partner" expanded)
              option(value="") Select...
              option(v-for="opt in partnerOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Lead Staff")
            b-select(v-model="draft.leadStaff" expanded)
              option(value="") Select...
              option(v-for="opt in leadStaffOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Status")
            b-select(v-model="draft.prospectStatus" expanded)
              option(v-for="opt in statusOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Relationship Type")
            b-select(v-model="draft.relationshipType" expanded)
              option(v-for="opt in relationshipOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Source")
            b-select(v-model="draft.prospectSource" expanded)
              option(value="") Select...
              option(v-for="opt in sourceOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Industry")
            b-select(v-model="draft.industry" expanded)
              option(value="") Select...
              option(v-for="opt in industryOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Email")
            b-input(v-model="draft.email" type="email" placeholder="Email" expanded)
        .column.is-3
          b-field(label="Phone")
            b-input(v-model="draft.contactPhone" placeholder="Phone" expanded)
        .column.is-3
          b-field(label="Approach Date")
            b-input(v-model="draft.approachDate" type="date" expanded)
        .column.is-3
          b-field(label="Approach Style")
            b-select(v-model="draft.approachStyle" expanded)
              option(value="") Select...
              option(v-for="opt in approachOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="Sales Style")
            b-select(v-model="draft.salesStyle" expanded)
              option(value="") Select...
              option(v-for="opt in salesStyleOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(label="COI Involved")
            b-select(v-model="draft.coiInvolved" :disabled="draft.prospectSource !== 'Referral'" expanded)
              option(value="") {{ draft.prospectSource === 'Referral' ? 'Select COI...' : 'N/A' }}
              option(v-for="opt in coiOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-12
          b-field(label="Comments")
            b-input(v-model="draft.comments" type="textarea" rows="2" placeholder="Notes..." expanded)
      .buttons
        b-button(
          type="is-primary"
          :loading="submitting"
          :disabled="!draft.prospectName.trim()"
          @click="createItem"
        ) {{ $t('pipeline.saveProspect') }}
        b-button(@click="showAddForm = false") {{ $t('common.cancel') }}

    //- Filters
    .box.mb-3
      .field.is-grouped.is-grouped-multiline
        .control.is-expanded
          b-input(
            v-model="search"
            :placeholder="$t('pipeline.searchProspects')"
            @keyup.native.enter="loadItems"
            expanded
          )
        .control.is-expanded
          b-input(
            v-model="ownerFilter"
            :placeholder="$t('pipeline.filterByOwner')"
            @keyup.native.enter="loadItems"
            expanded
          )
        .control
          b-button(type="is-info" @click="loadItems") {{ $t('pipeline.apply') }}

    b-notification(v-if="errorText" type="is-danger is-light" :closable="false") {{ errorText }}
    loading-spinner(v-if="loading && !items.length" :message="$t('pipeline.loadingData')")

    //- Data table (kept custom — drag/resize/inline-edit)
    .data-table-wrap
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
              span.header-label(contenteditable="true" @blur="saveHeaderLabel(col, $event)" @keydown.enter.prevent="$event.target.blur()") {{ headerLabels[col] }}
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
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f5fa 0%, #e8eff6 100%);
}

.pipeline-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #004080 0%, #002b64 50%, #001a3d 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 43, 100, 0.4);
}

.pipeline-header::before {
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

.stat-box.is-active { background: linear-gradient(135deg, #dcfce7, #bbf7d0); }
.stat-box.is-secured { background: linear-gradient(135deg, #fef3c7, #fde68a); }

/* Data Table wrapper */
.data-table-wrap {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: auto;
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

.header-label {
  display: inline-block;
  padding: 0.1rem 0.25rem;
  border-radius: 3px;
  cursor: text;
  outline: none;
  min-width: 20px;
}

.header-label:hover { background: rgba(0, 43, 100, 0.1); }
.header-label:focus { background: white; box-shadow: 0 0 0 2px rgba(0, 43, 100, 0.3); }

.drag-handle {
  cursor: grab;
  opacity: 0.4;
  font-size: 0.9rem;
  margin-right: 0.35rem;
  user-select: none;
}
.drag-handle:hover { opacity: 0.8; }
.drag-handle:active { cursor: grabbing; }

.data-table th.dragging { opacity: 0.5; background: #e0e7ff; }
.data-table th.drag-over { border-left: 3px solid #002b64; background: #e6eef8; }

.resize-handle {
  position: absolute;
  right: -2px;
  top: 0;
  bottom: 0;
  width: 5px;
  cursor: col-resize;
  background: transparent;
  border-right: 2px solid transparent;
  z-index: 20;
}
.resize-handle:hover { border-right-color: #002b64; background: rgba(0, 43, 100, 0.15); }

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

.data-table th.sticky-col { z-index: 15; background: #f8fafc; }

.actions-col { width: 40px; text-align: center; }

.status-active td { background: #f0fdf4; }
.status-active .sticky-col { background: #f0fdf4; }
.status-on-hold td { background: #fefce8; }
.status-on-hold .sticky-col { background: #fefce8; }
.status-await-research td { background: #eff6ff; }
.status-await-research .sticky-col { background: #eff6ff; }
.status-completed td { background: #f0fdf4; }
.status-completed .sticky-col { background: #f0fdf4; }
.status-dead td { background: #fef2f2; }
.status-dead .sticky-col { background: #fef2f2; }

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

.cell-input:hover, .cell-select:hover { border-color: #cbd5e1; background: white; }
.cell-input:focus, .cell-select:focus { outline: none; border-color: #002b64; background: white; box-shadow: 0 0 0 2px rgba(0, 43, 100, 0.1); }
.cell-input.number { text-align: right; }
.money-cell.secured .cell-input { color: #16a34a; font-weight: 600; }
.center { text-align: center; }
.money-cell { text-align: right; }

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
.btn-delete:hover { background: #fecaca; }
</style>
