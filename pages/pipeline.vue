<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

interface PipelineEntry {
  id: number;
  prospectName: string;
  businessName: string | null;
  partner: string | null;
  leadStaff: string | null;
  prospectStatus: string;
  dateLastContact: string | null;
  address: string | null;
  contactPhone: string | null;
  email: string | null;
  industry: string | null;
  existingFeeValue: string | null;
  supportStaff: string | null;
  relationshipType: string | null;
  prospectSource: string | null;
  coiInvolved: string | null;
  approachDate: string | null;
  approachStyle: string | null;
  secureMeeting: boolean;
  quizCompleted: boolean;
  salesStyle: string | null;
  meetingTheme: string | null;
  meetingDate: string | null;
  followUpMeeting: boolean;
  followUpMeetingDate: string | null;
  totalNeedsStage: string | null;
  proposalSent: boolean;
  proposalValue: number;
  jobSecured: boolean;
  dateSecured: string | null;
  jobSecuredValue: number;
  additionalWorkSecured: number;
  comments: string | null;
}

const search = ref("");
const ownerFilter = ref("");
const items = ref<PipelineEntry[]>([]);
const errorText = ref("");
const loading = ref(false);
const showAddForm = ref(false);
const submitting = ref(false);

// Use shared lists from database
const { fetchLists, getListItems, getListColors } = useLists();

// Computed list options from database
const statusOptions = computed(() => getListItems("prospectStatus"));
const relationshipOptions = computed(() => getListItems("relationshipType"));
const sourceOptions = computed(() => getListItems("prospectSource"));
const approachOptions = computed(() => getListItems("approachStyle"));
const salesStyleOptions = computed(() => getListItems("salesStyle"));
const totalNeedsStageOptions = computed(() => getListItems("totalNeedsStage"));
const partnerOptions = computed(() => getListItems("partner"));
const leadStaffOptions = computed(() => getListItems("leadStaff"));
const industryOptions = computed(() => getListItems("industry"));
const statusColors = computed(() => getListColors("prospectStatus"));

// COI entries from database
const coiEntries = ref<{ id: number; coiName: string }[]>([]);
const coiOptions = computed(() => coiEntries.value.map(e => e.coiName));

async function loadCoiEntries() {
  try {
    const res = await $fetch<{ items: { id: number; coiName: string }[] }>("/api/coi");
    coiEntries.value = res.items;
  } catch {
    // Silently fail - COI dropdown will just be empty
  }
}

const emptyDraft = () => ({
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
});

const draft = reactive(emptyDraft());

// Default column widths
const defaultColumnWidths: Record<string, number> = {
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
};

// Load saved widths from localStorage or use defaults
function loadColumnWidths(): Record<string, number> {
  if (typeof window === "undefined") return { ...defaultColumnWidths };
  try {
    const saved = localStorage.getItem("pipeline-column-widths");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultColumnWidths, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultColumnWidths };
}

// Column widths for resizing
const columnWidths = ref<Record<string, number>>(loadColumnWidths());

// Default header labels
const defaultHeaderLabels: Record<string, string> = {
  prospect: "Prospect",
  business: "Business",
  partner: "Partner",
  leadStaff: "Lead Staff",
  status: "Status",
  relationship: "Relationship",
  source: "Source",
  coi: "COI",
  industry: "Industry",
  approachDate: "Approach Date",
  approachStyle: "Approach Style",
  meeting: "Meeting",
  quizDone: "Quiz Done",
  salesStyle: "Sales Style",
  meetingDate: "Meeting Date",
  followUp: "Follow Up",
  followUpDate: "F/Up Date",
  tnStage: "TN Stage",
  proposal: "Proposal",
  proposalValue: "Proposal $",
  secured: "Secured",
  dateSecured: "Date Secured",
  securedValue: "Secured $",
  additionalWork: "Add'l Work",
  comments: "Comments"
};

// Load saved header labels from localStorage
function loadHeaderLabels(): Record<string, string> {
  if (typeof window === "undefined") return { ...defaultHeaderLabels };
  try {
    const saved = localStorage.getItem("pipeline-header-labels");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultHeaderLabels, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return { ...defaultHeaderLabels };
}

// Header labels for editing
const headerLabels = ref<Record<string, string>>(loadHeaderLabels());

// Default column order
const defaultColumnOrder = [
  'prospect', 'business', 'partner', 'leadStaff', 'status', 'relationship', 'source',
  'coi', 'industry', 'approachDate', 'approachStyle', 'meeting', 'quizDone', 'salesStyle',
  'meetingDate', 'followUp', 'followUpDate', 'tnStage', 'proposal', 'proposalValue',
  'secured', 'dateSecured', 'securedValue', 'additionalWork', 'comments'
];

// Load saved column order from localStorage
function loadColumnOrder(): string[] {
  if (typeof window === "undefined") return [...defaultColumnOrder];
  try {
    const saved = localStorage.getItem("pipeline-column-order");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that all default columns are present
      if (Array.isArray(parsed) && defaultColumnOrder.every(col => parsed.includes(col))) {
        return parsed;
      }
    }
  } catch {
    // ignore parse errors
  }
  return [...defaultColumnOrder];
}

// Column order for drag reordering
const columnOrder = ref<string[]>(loadColumnOrder());

// Drag state for column reordering
const draggingColumn = ref<string | null>(null);
const dragOverColumn = ref<string | null>(null);

function onDragStart(col: string, event: DragEvent) {
  draggingColumn.value = col;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', col);
  }
}

function onDragOver(col: string, event: DragEvent) {
  event.preventDefault();
  if (draggingColumn.value && draggingColumn.value !== col) {
    dragOverColumn.value = col;
  }
}

function onDragLeave() {
  dragOverColumn.value = null;
}

function onDrop(col: string, event: DragEvent) {
  event.preventDefault();
  if (!draggingColumn.value || draggingColumn.value === col) {
    draggingColumn.value = null;
    dragOverColumn.value = null;
    return;
  }

  const order = [...columnOrder.value];
  const fromIndex = order.indexOf(draggingColumn.value);
  const toIndex = order.indexOf(col);

  if (fromIndex !== -1 && toIndex !== -1) {
    order.splice(fromIndex, 1);
    order.splice(toIndex, 0, draggingColumn.value);
    columnOrder.value = order;

    // Save to localStorage
    try {
      localStorage.setItem("pipeline-column-order", JSON.stringify(order));
    } catch {
      // ignore storage errors
    }
  }

  draggingColumn.value = null;
  dragOverColumn.value = null;
}

function onDragEnd() {
  draggingColumn.value = null;
  dragOverColumn.value = null;
}

// Get CSS class for a cell based on column type
function getCellClass(col: string): string[] {
  const classes: string[] = [];

  // First column is sticky
  if (col === columnOrder.value[0]) {
    classes.push('sticky-col');
  }

  // Checkbox columns are centered
  if (['meeting', 'quizDone', 'followUp', 'proposal', 'secured'].includes(col)) {
    classes.push('center');
  }

  // Money columns
  if (['proposalValue', 'additionalWork'].includes(col)) {
    classes.push('money-cell');
  }

  if (col === 'securedValue') {
    classes.push('money-cell', 'secured');
  }

  return classes;
}

// Save header label on edit
function saveHeaderLabel(col: string, event: Event) {
  const target = event.target as HTMLElement;
  const newLabel = target.innerText.trim() || defaultHeaderLabels[col];
  headerLabels.value[col] = newLabel;
  target.innerText = newLabel;
  try {
    localStorage.setItem("pipeline-header-labels", JSON.stringify(headerLabels.value));
  } catch {
    // ignore storage errors
  }
}

// Resize state
const resizing = ref<{ col: string; startX: number; startWidth: number } | null>(null);

function startResize(col: string, event: MouseEvent) {
  event.preventDefault();
  resizing.value = {
    col,
    startX: event.clientX,
    startWidth: columnWidths.value[col]
  };
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
}

function onResize(event: MouseEvent) {
  if (!resizing.value) return;
  const delta = event.clientX - resizing.value.startX;
  const newWidth = Math.max(50, resizing.value.startWidth + delta);
  columnWidths.value[resizing.value.col] = newWidth;
}

function stopResize() {
  resizing.value = null;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  // Save to localStorage
  try {
    localStorage.setItem("pipeline-column-widths", JSON.stringify(columnWidths.value));
  } catch {
    // ignore storage errors
  }
}

// Computed stats
const totalProspects = computed(() => items.value.length);
const activeProspects = computed(() => items.value.filter(i => i.prospectStatus === "Active").length);
const meetingsCount = computed(() => items.value.filter(i => i.secureMeeting).length);
const proposalsSent = computed(() => items.value.filter(i => i.proposalSent).length);
const securedCount = computed(() => items.value.filter(i => i.jobSecured).length);
const totalSecuredValue = computed(() => items.value.reduce((sum, i) => sum + Number(i.jobSecuredValue || 0), 0));
const totalProposalValue = computed(() => items.value.reduce((sum, i) => sum + Number(i.proposalValue || 0), 0));

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function toInputDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
}

async function loadItems() {
  loading.value = true;
  errorText.value = "";
  try {
    const res = await $fetch<{ items: PipelineEntry[] }>("/api/pipeline", {
      query: {
        search: search.value || undefined,
        owner: ownerFilter.value || undefined
      }
    });
    items.value = res.items;
  } catch (error: unknown) {
    const e = error as { statusCode?: number; data?: { statusMessage?: string; message?: string } };
    if (Number(e?.statusCode) === 401) {
      await navigateTo("/login");
      return;
    }
    errorText.value = String(e?.data?.statusMessage || e?.data?.message || "Failed to load");
  } finally {
    loading.value = false;
  }
}

async function createItem() {
  if (submitting.value) return;
  submitting.value = true;
  errorText.value = "";
  try {
    await $fetch("/api/pipeline", { method: "POST", body: draft });
    Object.assign(draft, emptyDraft());
    showAddForm.value = false;
    await loadItems();
  } catch (error: unknown) {
    const e = error as { data?: { statusMessage?: string } };
    errorText.value = String(e?.data?.statusMessage || "Failed to create");
  } finally {
    submitting.value = false;
  }
}

async function updateField(item: PipelineEntry, field: keyof PipelineEntry, value: unknown) {
  try {
    await $fetch(`/api/pipeline/${item.id}`, {
      method: "PATCH",
      body: { [field]: value }
    });
    (item as Record<string, unknown>)[field] = value;
  } catch (error: unknown) {
    const e = error as { data?: { statusMessage?: string } };
    errorText.value = String(e?.data?.statusMessage || "Failed to update");
  }
}

async function removeItem(item: PipelineEntry) {
  if (!confirm(`Delete prospect "${item.prospectName}"?`)) return;
  try {
    await $fetch(`/api/pipeline/${item.id}`, { method: "DELETE" });
    await loadItems();
  } catch (error: unknown) {
    const e = error as { data?: { statusMessage?: string } };
    errorText.value = String(e?.data?.statusMessage || "Failed to delete");
  }
}

onMounted(async () => {
  // Load column widths, header labels, and column order from localStorage on client
  Object.assign(columnWidths.value, loadColumnWidths());
  Object.assign(headerLabels.value, loadHeaderLabels());
  columnOrder.value = loadColumnOrder();
  await fetchLists();
  await Promise.all([loadItems(), loadCoiEntries()]);
});
</script>

<template>
  <div class="pipeline-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">{{ t('pipeline.badge') }}</span>
          <h1>{{ t('pipeline.title') }}</h1>
          <p>{{ t('pipeline.subtitle') }}</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="showAddForm = !showAddForm">
            {{ showAddForm ? t('common.cancel') : t('pipeline.addProspect') }}
          </button>
          <button class="btn-secondary" @click="loadItems">{{ t('common.refresh') }}</button>
        </div>
      </div>
    </header>

    <!-- Summary Stats -->
    <section class="stats-bar">
      <div class="stat-item">
        <span class="stat-label">{{ t('pipeline.totalProspects') }}</span>
        <span class="stat-value">{{ totalProspects }}</span>
      </div>
      <div class="stat-item active">
        <span class="stat-label">{{ t('pipeline.active') }}</span>
        <span class="stat-value">{{ activeProspects }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ t('pipeline.meetings') }}</span>
        <span class="stat-value">{{ meetingsCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">{{ t('pipeline.proposals') }}</span>
        <span class="stat-value">{{ proposalsSent }}</span>
      </div>
      <div class="stat-item secured">
        <span class="stat-label">{{ t('pipeline.secured') }}</span>
        <span class="stat-value">{{ securedCount }}</span>
      </div>
      <div class="stat-item money">
        <span class="stat-label">{{ t('pipeline.proposalValue') }}</span>
        <span class="stat-value">{{ money.format(totalProposalValue) }}</span>
      </div>
      <div class="stat-item money secured">
        <span class="stat-label">{{ t('pipeline.securedValue') }}</span>
        <span class="stat-value">{{ money.format(totalSecuredValue) }}</span>
      </div>
    </section>

    <!-- Add Form -->
    <section v-if="showAddForm" class="add-form-panel">
      <h2>{{ t('pipeline.newProspect') }}</h2>
      <div class="form-grid">
        <div class="form-group">
          <label>Prospect Name *</label>
          <input v-model="draft.prospectName" placeholder="Name" />
        </div>
        <div class="form-group">
          <label>Business Name</label>
          <input v-model="draft.businessName" placeholder="Business" />
        </div>
        <div class="form-group">
          <label>Partner</label>
          <select v-model="draft.partner">
            <option value="">Select...</option>
            <option v-for="opt in partnerOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Lead Staff</label>
          <select v-model="draft.leadStaff">
            <option value="">Select...</option>
            <option v-for="opt in leadStaffOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="draft.prospectStatus">
            <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Relationship Type</label>
          <select v-model="draft.relationshipType">
            <option v-for="opt in relationshipOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Source</label>
          <select v-model="draft.prospectSource">
            <option value="">Select...</option>
            <option v-for="opt in sourceOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Industry</label>
          <select v-model="draft.industry">
            <option value="">Select...</option>
            <option v-for="opt in industryOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input v-model="draft.email" type="email" placeholder="Email" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input v-model="draft.contactPhone" placeholder="Phone" />
        </div>
        <div class="form-group">
          <label>Approach Date</label>
          <input v-model="draft.approachDate" type="date" />
        </div>
        <div class="form-group">
          <label>Approach Style</label>
          <select v-model="draft.approachStyle">
            <option value="">Select...</option>
            <option v-for="opt in approachOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Sales Style</label>
          <select v-model="draft.salesStyle">
            <option value="">Select...</option>
            <option v-for="opt in salesStyleOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>COI Involved</label>
          <select v-model="draft.coiInvolved" :disabled="draft.prospectSource !== 'Referral'">
            <option value="">{{ draft.prospectSource === 'Referral' ? 'Select COI...' : 'N/A' }}</option>
            <option v-for="opt in coiOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </div>
        <div class="form-group full-width">
          <label>Comments</label>
          <textarea v-model="draft.comments" rows="2" placeholder="Notes..." />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" :disabled="!draft.prospectName.trim() || submitting" @click="createItem">{{ submitting ? t('pipeline.saving') : t('pipeline.saveProspect') }}</button>
        <button class="btn-secondary" @click="showAddForm = false">{{ t('common.cancel') }}</button>
      </div>
    </section>

    <!-- Filters -->
    <section class="filters-bar">
      <input v-model="search" :placeholder="t('pipeline.searchProspects')" @keyup.enter="loadItems" />
      <input v-model="ownerFilter" :placeholder="t('pipeline.filterByOwner')" @keyup.enter="loadItems" />
      <button class="btn-secondary" @click="loadItems">{{ t('pipeline.apply') }}</button>
    </section>

    <!-- Error message -->
    <p v-if="errorText" class="error-msg">{{ errorText }}</p>
    <p v-if="loading" class="loading-msg">{{ t('pipeline.loadingData') }}</p>

    <!-- Data Table - Spreadsheet Style -->
    <div class="table-container">
      <table class="data-table" :class="{ resizing: resizing }">
        <thead>
          <tr>
            <th
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
            >
              <span class="drag-handle" title="Drag to reorder">⠿</span>
              <span class="header-text" contenteditable="true" @blur="saveHeaderLabel(col, $event)" @keydown.enter.prevent="($event.target as HTMLElement).blur()">{{ headerLabels[col] }}</span>
              <span class="resize-handle" @mousedown="startResize(col, $event)"></span>
            </th>
            <th class="actions-col" :style="{ width: columnWidths.actions + 'px' }"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" :class="['status-' + item.prospectStatus.toLowerCase().replace(/\s+/g, '-')]">
            <td v-for="col in columnOrder" :key="col" :class="getCellClass(col)">
              <!-- Text inputs -->
              <input v-if="col === 'prospect'" v-model="item.prospectName" class="cell-input" @blur="updateField(item, 'prospectName', item.prospectName)" />
              <input v-else-if="col === 'business'" v-model="item.businessName" class="cell-input" @blur="updateField(item, 'businessName', item.businessName)" />
              <input v-else-if="col === 'comments'" v-model="item.comments" class="cell-input wide" @blur="updateField(item, 'comments', item.comments)" />

              <!-- Select dropdowns -->
              <select v-else-if="col === 'partner'" v-model="item.partner" class="cell-select" @change="updateField(item, 'partner', item.partner)">
                <option value="">-</option>
                <option v-for="opt in partnerOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'leadStaff'" v-model="item.leadStaff" class="cell-select" @change="updateField(item, 'leadStaff', item.leadStaff)">
                <option value="">-</option>
                <option v-for="opt in leadStaffOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'status'" v-model="item.prospectStatus" class="cell-select" @change="updateField(item, 'prospectStatus', item.prospectStatus)">
                <option v-for="opt in statusOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'relationship'" v-model="item.relationshipType" class="cell-select" @change="updateField(item, 'relationshipType', item.relationshipType)">
                <option value="">-</option>
                <option v-for="opt in relationshipOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'source'" v-model="item.prospectSource" class="cell-select" @change="updateField(item, 'prospectSource', item.prospectSource)">
                <option value="">-</option>
                <option v-for="opt in sourceOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'coi'" v-model="item.coiInvolved" class="cell-select" @change="updateField(item, 'coiInvolved', item.coiInvolved)">
                <option value="">-</option>
                <option v-for="opt in coiOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'industry'" v-model="item.industry" class="cell-select" @change="updateField(item, 'industry', item.industry)">
                <option value="">-</option>
                <option v-for="opt in industryOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'approachStyle'" v-model="item.approachStyle" class="cell-select" @change="updateField(item, 'approachStyle', item.approachStyle)">
                <option value="">-</option>
                <option v-for="opt in approachOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'salesStyle'" v-model="item.salesStyle" class="cell-select" @change="updateField(item, 'salesStyle', item.salesStyle)">
                <option value="">-</option>
                <option v-for="opt in salesStyleOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
              <select v-else-if="col === 'tnStage'" v-model="item.totalNeedsStage" class="cell-select" @change="updateField(item, 'totalNeedsStage', item.totalNeedsStage)">
                <option value="">-</option>
                <option v-for="opt in totalNeedsStageOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>

              <!-- Date inputs -->
              <input v-else-if="col === 'approachDate'" :value="toInputDate(item.approachDate)" type="date" class="cell-input date" @change="updateField(item, 'approachDate', ($event.target as HTMLInputElement).value)" />
              <input v-else-if="col === 'meetingDate'" :value="toInputDate(item.meetingDate)" type="date" class="cell-input date" @change="updateField(item, 'meetingDate', ($event.target as HTMLInputElement).value)" />
              <input v-else-if="col === 'followUpDate'" :value="toInputDate(item.followUpMeetingDate)" type="date" class="cell-input date" @change="updateField(item, 'followUpMeetingDate', ($event.target as HTMLInputElement).value)" />
              <input v-else-if="col === 'dateSecured'" :value="toInputDate(item.dateSecured)" type="date" class="cell-input date" @change="updateField(item, 'dateSecured', ($event.target as HTMLInputElement).value)" />

              <!-- Checkboxes -->
              <input v-else-if="col === 'meeting'" type="checkbox" :checked="item.secureMeeting" @change="updateField(item, 'secureMeeting', !item.secureMeeting)" />
              <input v-else-if="col === 'quizDone'" type="checkbox" :checked="item.quizCompleted" @change="updateField(item, 'quizCompleted', !item.quizCompleted)" />
              <input v-else-if="col === 'followUp'" type="checkbox" :checked="item.followUpMeeting" @change="updateField(item, 'followUpMeeting', !item.followUpMeeting)" />
              <input v-else-if="col === 'proposal'" type="checkbox" :checked="item.proposalSent" @change="updateField(item, 'proposalSent', !item.proposalSent)" />
              <input v-else-if="col === 'secured'" type="checkbox" :checked="item.jobSecured" @change="updateField(item, 'jobSecured', !item.jobSecured)" />

              <!-- Number inputs -->
              <input v-else-if="col === 'proposalValue'" :value="item.proposalValue" type="number" class="cell-input number" @blur="updateField(item, 'proposalValue', Number(($event.target as HTMLInputElement).value))" />
              <input v-else-if="col === 'securedValue'" :value="item.jobSecuredValue" type="number" class="cell-input number" @blur="updateField(item, 'jobSecuredValue', Number(($event.target as HTMLInputElement).value))" />
              <input v-else-if="col === 'additionalWork'" :value="item.additionalWorkSecured" type="number" class="cell-input number" @blur="updateField(item, 'additionalWorkSecured', Number(($event.target as HTMLInputElement).value))" />
            </td>
            <td class="actions-col">
              <button class="btn-delete" @click="removeItem(item)" title="Delete">×</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
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
