<script setup lang="ts">
// Protect this page - only Firm Managers can access
definePageMeta({
  middleware: ["firm-manager"]
});

const { lists: listsData, loading: listsLoading, fetchLists, saveList, invalidateCache } = useLists();

// Local editable copy of lists
const lists = reactive<Record<string, { name: string; description: string; items: string[]; colors?: Record<string, string> }>>({});

const expandedList = ref<string | null>(null);
const newItemText = ref("");
const saving = ref(false);
const saveMessage = ref("");

// Load lists on mount
onMounted(async () => {
  await fetchLists(true);
  // Copy to local editable state
  Object.assign(lists, JSON.parse(JSON.stringify(listsData.value)));
});

// Watch for external updates
watch(listsData, (newLists) => {
  if (Object.keys(lists).length === 0) {
    Object.assign(lists, JSON.parse(JSON.stringify(newLists)));
  }
}, { deep: true });

function toggleExpand(key: string) {
  expandedList.value = expandedList.value === key ? null : key;
  newItemText.value = "";
}

async function addItem(key: string) {
  const text = newItemText.value.trim();
  if (text && lists[key] && !lists[key].items.includes(text)) {
    lists[key].items.push(text);
    newItemText.value = "";
    await saveListToDb(key);
  }
}

async function removeItem(key: string, item: string) {
  if (!lists[key]) return;
  const idx = lists[key].items.indexOf(item);
  if (idx !== -1) {
    lists[key].items.splice(idx, 1);
    await saveListToDb(key);
  }
}

async function moveItem(key: string, index: number, direction: -1 | 1) {
  if (!lists[key]) return;
  const arr = lists[key].items;
  const newIndex = index + direction;
  if (newIndex >= 0 && newIndex < arr.length) {
    const temp = arr[index];
    arr[index] = arr[newIndex];
    arr[newIndex] = temp;
    await saveListToDb(key);
  }
}

async function saveListToDb(key: string) {
  if (!lists[key]) return;
  saving.value = true;
  saveMessage.value = "";

  const success = await saveList(key, lists[key].items, lists[key].colors);

  if (success) {
    saveMessage.value = "Saved";
    invalidateCache();
    setTimeout(() => {
      saveMessage.value = "";
    }, 2000);
  } else {
    saveMessage.value = "Failed to save";
  }

  saving.value = false;
}
</script>

<template>
  <div class="lists-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">Configuration</span>
          <h1>Lists</h1>
          <p>Manage dropdown options used throughout the Sales Tracker</p>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="listsLoading && Object.keys(lists).length === 0" class="loading-banner">
      Loading lists...
    </div>

    <!-- Save Status -->
    <div v-if="saveMessage" class="save-banner" :class="{ error: saveMessage === 'Failed to save' }">
      {{ saveMessage }}
    </div>

    <!-- Info Banner -->
    <div class="info-banner">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <p>These lists define the dropdown options available in Sales Activity, COI Development, and other areas. Changes here will affect what options are available when entering data.</p>
    </div>

    <!-- Lists Grid -->
    <div class="lists-grid">
      <div
        v-for="(list, key) in lists"
        :key="key"
        class="list-card"
        :class="{ expanded: expandedList === key }"
      >
        <div class="list-header" @click="toggleExpand(key)">
          <div class="list-info">
            <h3>{{ list.name }}</h3>
            <p>{{ list.description }}</p>
          </div>
          <div class="list-meta">
            <span class="item-count">{{ list.items.length }} items</span>
            <span class="expand-icon">{{ expandedList === key ? '−' : '+' }}</span>
          </div>
        </div>

        <div v-if="expandedList === key" class="list-content">
          <ul class="items-list">
            <li
              v-for="(item, idx) in list.items"
              :key="item"
              class="list-item"
              :style="(list as any).colors?.[item] ? { backgroundColor: (list as any).colors[item] } : {}"
            >
              <span class="item-text">{{ item }}</span>
              <div class="item-actions">
                <button
                  class="btn-move"
                  :disabled="idx === 0"
                  @click.stop="moveItem(key, idx, -1)"
                  title="Move up"
                >↑</button>
                <button
                  class="btn-move"
                  :disabled="idx === list.items.length - 1"
                  @click.stop="moveItem(key, idx, 1)"
                  title="Move down"
                >↓</button>
                <button
                  class="btn-remove"
                  @click.stop="removeItem(key, item)"
                  title="Remove"
                >×</button>
              </div>
            </li>
          </ul>

          <div class="add-item-form">
            <input
              v-model="newItemText"
              placeholder="Add new item..."
              @keyup.enter="addItem(key)"
            />
            <button
              class="btn-add"
              :disabled="!newItemText.trim()"
              @click="addItem(key)"
            >Add</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Guide -->
    <section class="usage-guide">
      <h2>How Lists Are Used</h2>
      <div class="usage-grid">
        <div class="usage-item">
          <h4>Prospect Status</h4>
          <p>Controls the status dropdown in Sales Activity. Rows are color-coded based on status.</p>
        </div>
        <div class="usage-item">
          <h4>Prospect Source</h4>
          <p>Tracks where leads come from. Used in dashboard charts for source analysis.</p>
        </div>
        <div class="usage-item">
          <h4>Approach Style</h4>
          <p>Documents how you first contacted the prospect. Important for measuring approach effectiveness.</p>
        </div>
        <div class="usage-item">
          <h4>Sales Style</h4>
          <p>Campaign vs Total Needs tracking. Each has its own funnel metrics on the dashboard.</p>
        </div>
        <div class="usage-item">
          <h4>Total Needs Stage</h4>
          <p>For Total Needs sales, tracks progression through the 5-stage process.</p>
        </div>
        <div class="usage-item">
          <h4>Industry</h4>
          <p>Used in both Sales Activity and COI Development for industry segmentation.</p>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.lists-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top right, rgba(8, 145, 178, 0.12) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(34, 211, 238, 0.1) 0%, transparent 30%),
    radial-gradient(circle at bottom right, rgba(165, 243, 252, 0.2) 0%, transparent 35%),
    linear-gradient(180deg, #ecfeff 0%, #cffafe 100%);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.page-header {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
  border-radius: 20px;
  padding: 2rem;
  color: white;
  box-shadow: 0 10px 40px rgba(8, 145, 178, 0.3);
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

/* Loading Banner */
.loading-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  color: #166534;
  text-align: center;
  font-weight: 500;
}

/* Save Banner */
.save-banner {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  padding: 0.75rem 1.25rem;
  color: #166534;
  text-align: center;
  font-weight: 500;
}

.save-banner.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

/* Info Banner */
.info-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  color: #1e40af;
}

.info-banner svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.info-banner p {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Lists Grid */
.lists-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
}

.list-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s;
}

.list-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.list-card.expanded {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
}

.list-header:hover {
  background: #f8fafc;
}

.list-info h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.list-info p {
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #64748b;
}

.list-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.item-count {
  font-size: 0.75rem;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.expand-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 300;
  color: #64748b;
}

/* List Content */
.list-content {
  border-top: 1px solid #f1f5f9;
  padding: 1rem 1.5rem 1.5rem;
}

.items-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  transition: transform 0.15s;
}

.list-item:hover {
  transform: translateX(4px);
}

.item-text {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;
}

.item-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.15s;
}

.list-item:hover .item-actions {
  opacity: 1;
}

.btn-move,
.btn-remove {
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
}

.btn-move {
  background: #e2e8f0;
  color: #475569;
}

.btn-move:hover:not(:disabled) {
  background: #cbd5e1;
}

.btn-move:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-remove {
  background: #fee2e2;
  color: #dc2626;
  font-size: 1.1rem;
}

.btn-remove:hover {
  background: #fecaca;
}

/* Add Item Form */
.add-item-form {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
}

.add-item-form input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.add-item-form input:focus {
  outline: none;
  border-color: #0891b2;
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
}

.btn-add {
  background: #0891b2;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-add:hover:not(:disabled) {
  background: #0e7490;
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Usage Guide */
.usage-guide {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.usage-guide h2 {
  margin: 0 0 1rem;
  font-size: 1.1rem;
  color: #1e293b;
}

.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.usage-item {
  padding: 1rem;
  background: #f8fafc;
  border-radius: 10px;
}

.usage-item h4 {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  color: #0891b2;
  font-weight: 700;
}

.usage-item p {
  margin: 0;
  font-size: 0.8rem;
  color: #64748b;
  line-height: 1.5;
}

/* Responsive */
@media (max-width: 768px) {
  .lists-grid {
    grid-template-columns: 1fr;
  }

  .usage-grid {
    grid-template-columns: 1fr;
  }
}
</style>
