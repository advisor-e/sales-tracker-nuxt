<script setup lang="ts">
// Protect this page - only Firm Managers can access
definePageMeta({
  middleware: ["firm-manager"]
});

import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });
const { $addLocale, $removeLocale, $refreshLocales } = useNuxtApp();

const { lists: listsData, loading: listsLoading, fetchLists, saveList, invalidateCache } = useLists();

// Local editable copy of lists
const lists = reactive<Record<string, { name: string; description: string; items: string[]; colors?: Record<string, string> }>>({});

const expandedList = ref<string | null>(null);
const newItemText = ref("");
const saving = ref(false);
const saveMessage = ref("");

// Language management state
interface Language {
  code: string;
  name: string;
  nativeName: string;
  isBuiltIn: boolean;
  isEnabled: boolean;
}

const languages = ref<Language[]>([]);
const languagesLoading = ref(false);
const showAddLanguage = ref(false);
const newLanguage = reactive({
  code: '',
  name: '',
  nativeName: '',
  translations: {} as Record<string, unknown>
});
const languageSaving = ref(false);

// Load lists on mount
onMounted(async () => {
  await Promise.all([
    fetchLists(true),
    loadLanguages()
  ]);
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

// Language management functions
async function loadLanguages() {
  languagesLoading.value = true;
  try {
    const response = await $fetch<{ languages: Language[] }>('/api/languages');
    languages.value = response.languages;
  } catch (e) {
    console.error('Failed to load languages:', e);
  } finally {
    languagesLoading.value = false;
  }
}

async function addNewLanguage() {
  if (!newLanguage.code || !newLanguage.name || !newLanguage.nativeName) return;

  languageSaving.value = true;
  try {
    const result = await $fetch<{
      success: boolean;
      language: { code: string; name: string; nativeName: string; isBuiltIn: boolean; isEnabled: boolean };
      translations: Record<string, unknown>;
    }>('/api/languages/translate', {
      method: 'POST',
      body: {
        code: newLanguage.code.toLowerCase(),
        name: newLanguage.name,
        nativeName: newLanguage.nativeName
      }
    });

    // Register with vue-i18n and add to dropdown immediately
    if ($addLocale) {
      $addLocale(result.language.code, result.language.name, result.language.nativeName, result.translations as object);
    }

    // Refresh the languages panel
    await loadLanguages();

    // Reset form
    newLanguage.code = '';
    newLanguage.name = '';
    newLanguage.nativeName = '';
    newLanguage.translations = {};
    showAddLanguage.value = false;

    saveMessage.value = t('lists.languageAdded');
    setTimeout(() => { saveMessage.value = ''; }, 3000);
  } catch (e: unknown) {
    const error = e as { data?: { statusMessage?: string } };
    saveMessage.value = error.data?.statusMessage || 'Translation failed. Please try again.';
    setTimeout(() => { saveMessage.value = ''; }, 4000);
  } finally {
    languageSaving.value = false;
  }
}

async function deleteLanguage(code: string) {
  if (!confirm(t('lists.confirmDeleteLanguage'))) return;

  try {
    await $fetch(`/api/languages/${code}`, { method: 'DELETE' });

    // Remove from i18n runtime
    if ($removeLocale) {
      $removeLocale(code);
    }

    // Refresh the languages list
    await loadLanguages();
    if ($refreshLocales) {
      await $refreshLocales();
    }

    saveMessage.value = t('lists.languageDeleted');
    setTimeout(() => { saveMessage.value = ''; }, 2000);
  } catch (e) {
    console.error('Failed to delete language:', e);
  }
}
</script>

<template>
  <div class="lists-page">
    <!-- Header -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">{{ t('lists.badge') }}</span>
          <h1>{{ t('lists.title') }}</h1>
          <p>{{ t('lists.subtitle') }}</p>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="listsLoading && Object.keys(lists).length === 0" class="loading-banner">
      {{ t('lists.loading') }}
    </div>

    <!-- Save Status -->
    <div v-if="saveMessage" class="save-banner" :class="{ error: saveMessage.includes('Failed') }">
      {{ saveMessage === 'Saved' ? t('lists.saved') : saveMessage }}
    </div>

    <!-- Info Banner -->
    <div class="info-banner">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 16v-4"/>
        <path d="M12 8h.01"/>
      </svg>
      <p>{{ t('lists.infoBanner') }}</p>
    </div>

    <!-- Languages Section -->
    <section class="languages-section">
      <div class="section-header">
        <div>
          <h2>{{ t('lists.languagesTitle') }}</h2>
          <p>{{ t('lists.languagesDesc') }}</p>
        </div>
        <button
          class="btn-add-language"
          @click="showAddLanguage = !showAddLanguage"
        >
          {{ showAddLanguage ? '−' : '+' }} {{ t('lists.addLanguage') }}
        </button>
      </div>

      <!-- Add Language Form -->
      <div v-if="showAddLanguage" class="add-language-form">
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('lists.languageCode') }}</label>
            <input
              v-model="newLanguage.code"
              :placeholder="t('lists.languageCodePlaceholder')"
              maxlength="10"
            />
          </div>
          <div class="form-group">
            <label>{{ t('lists.languageName') }}</label>
            <input
              v-model="newLanguage.name"
              :placeholder="t('lists.languageNamePlaceholder')"
            />
          </div>
          <div class="form-group">
            <label>{{ t('lists.nativeName') }}</label>
            <input
              v-model="newLanguage.nativeName"
              :placeholder="t('lists.nativeNamePlaceholder')"
            />
          </div>
        </div>
        <div class="form-actions">
          <button
            class="btn-save-language"
            :disabled="!newLanguage.code || !newLanguage.name || !newLanguage.nativeName || languageSaving"
            @click="addNewLanguage"
          >
            <span v-if="languageSaving" class="btn-spinner">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
              Translating...
            </span>
            <span v-else>{{ t('lists.addLanguage') }}</span>
          </button>
        </div>
        <p class="form-hint" v-if="!languageSaving">
          AI will translate all app text into the new language. This takes about 30 seconds.
        </p>
        <p class="form-hint translating-hint" v-else>
          Translating with AI — please wait, this takes about 30 seconds...
        </p>
      </div>

      <!-- Languages List -->
      <div class="languages-grid">
        <div
          v-for="lang in languages"
          :key="lang.code"
          class="language-card"
          :class="{ 'built-in': lang.isBuiltIn }"
        >
          <div class="language-info">
            <span class="language-code">{{ lang.code }}</span>
            <span class="language-name">{{ lang.nativeName }}</span>
            <span class="language-tag">{{ lang.isBuiltIn ? t('lists.builtIn') : t('lists.custom') }}</span>
          </div>
          <button
            v-if="!lang.isBuiltIn"
            class="btn-delete-lang"
            @click="deleteLanguage(lang.code)"
            :title="t('lists.deleteLanguage')"
          >
            ×
          </button>
        </div>
      </div>
    </section>

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
            <span class="item-count">{{ list.items.length }} {{ t('lists.items') }}</span>
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
                  :title="t('lists.moveUp')"
                >↑</button>
                <button
                  class="btn-move"
                  :disabled="idx === list.items.length - 1"
                  @click.stop="moveItem(key, idx, 1)"
                  :title="t('lists.moveDown')"
                >↓</button>
                <button
                  class="btn-remove"
                  @click.stop="removeItem(key, item)"
                  :title="t('lists.remove')"
                >×</button>
              </div>
            </li>
          </ul>

          <div class="add-item-form">
            <input
              v-model="newItemText"
              :placeholder="t('lists.addNewItem')"
              @keyup.enter="addItem(key)"
            />
            <button
              class="btn-add"
              :disabled="!newItemText.trim()"
              @click="addItem(key)"
            >{{ t('common.add') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Usage Guide -->
    <section class="usage-guide">
      <h2>{{ t('lists.usageGuideTitle') }}</h2>
      <div class="usage-grid">
        <div class="usage-item">
          <h4>{{ t('lists.prospectStatus') }}</h4>
          <p>{{ t('lists.prospectStatusDesc') }}</p>
        </div>
        <div class="usage-item">
          <h4>{{ t('lists.prospectSource') }}</h4>
          <p>{{ t('lists.prospectSourceDesc') }}</p>
        </div>
        <div class="usage-item">
          <h4>{{ t('lists.approachStyle') }}</h4>
          <p>{{ t('lists.approachStyleDesc') }}</p>
        </div>
        <div class="usage-item">
          <h4>{{ t('lists.salesStyle') }}</h4>
          <p>{{ t('lists.salesStyleDesc') }}</p>
        </div>
        <div class="usage-item">
          <h4>{{ t('lists.totalNeedsStage') }}</h4>
          <p>{{ t('lists.totalNeedsStageDesc') }}</p>
        </div>
        <div class="usage-item">
          <h4>{{ t('lists.industry') }}</h4>
          <p>{{ t('lists.industryDesc') }}</p>
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

/* Loading/Save Banners */
.loading-banner, .save-banner {
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
.info-banner svg { flex-shrink: 0; margin-top: 0.1rem; }
.info-banner p { margin: 0; font-size: 0.875rem; line-height: 1.5; }

/* Languages Section */
.languages-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}
.section-header h2 { margin: 0; font-size: 1.1rem; color: #1e293b; }
.section-header p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #64748b; }
.btn-add-language {
  background: linear-gradient(135deg, #0891b2, #0e7490);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-add-language:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(8, 145, 178, 0.3);
}

/* Add Language Form */
.add-language-form {
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}
.form-group { display: flex; flex-direction: column; gap: 0.35rem; }
.form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.form-group input {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.875rem;
}
.form-group input:focus {
  outline: none;
  border-color: #0891b2;
  box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.1);
}
.form-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.btn-save-language:disabled { opacity: 0.7; cursor: not-allowed; }
.btn-save-language {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
}
.btn-save-language:hover:not(:disabled) { background: #059669; }
.form-hint { margin: 0.75rem 0 0; font-size: 0.8rem; color: #94a3b8; font-style: italic; }
.translating-hint { color: #0891b2; font-style: normal; font-weight: 500; }
.btn-spinner { display: flex; align-items: center; gap: 0.4rem; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Languages Grid */
.languages-grid { display: flex; flex-wrap: wrap; gap: 0.75rem; }
.language-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.6rem 0.9rem;
  transition: all 0.15s;
}
.language-card:hover { border-color: #cbd5e1; background: #f1f5f9; }
.language-card.built-in { border-color: #bbf7d0; background: #f0fdf4; }
.language-info { display: flex; align-items: center; gap: 0.5rem; }
.language-code {
  font-family: monospace;
  font-size: 0.75rem;
  font-weight: 700;
  color: #0891b2;
  background: #e0f7fa;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}
.language-name { font-size: 0.875rem; font-weight: 500; color: #334155; }
.language-tag {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: #f1f5f9;
  color: #64748b;
}
.language-card.built-in .language-tag { background: #dcfce7; color: #166534; }
.btn-delete-lang {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}
.language-card:hover .btn-delete-lang { opacity: 1; }
.btn-delete-lang:hover { background: #fecaca; }

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
.list-card:hover { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
.list-card.expanded { box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12); }
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.15s;
}
.list-header:hover { background: #f8fafc; }
.list-info h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
.list-info p { margin: 0.25rem 0 0; font-size: 0.8rem; color: #64748b; }
.list-meta { display: flex; align-items: center; gap: 1rem; }
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
.list-content { border-top: 1px solid #f1f5f9; padding: 1rem 1.5rem 1.5rem; }
.items-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  transition: transform 0.15s;
}
.list-item:hover { transform: translateX(4px); }
.item-text { font-size: 0.875rem; color: #334155; font-weight: 500; }
.item-actions { display: flex; gap: 0.25rem; opacity: 0; transition: opacity 0.15s; }
.list-item:hover .item-actions { opacity: 1; }
.btn-move, .btn-remove {
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
.btn-move { background: #e2e8f0; color: #475569; }
.btn-move:hover:not(:disabled) { background: #cbd5e1; }
.btn-move:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-remove { background: #fee2e2; color: #dc2626; font-size: 1.1rem; }
.btn-remove:hover { background: #fecaca; }

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
}
.btn-add:hover:not(:disabled) { background: #0e7490; }
.btn-add:disabled { opacity: 0.5; cursor: not-allowed; }

/* Usage Guide */
.usage-guide {
  background: white;
  border-radius: 16px;
  padding: 1.5rem 2rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}
.usage-guide h2 { margin: 0 0 1rem; font-size: 1.1rem; color: #1e293b; }
.usage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}
.usage-item { padding: 1rem; background: #f8fafc; border-radius: 10px; }
.usage-item h4 { margin: 0 0 0.5rem; font-size: 0.875rem; color: #0891b2; font-weight: 700; }
.usage-item p { margin: 0; font-size: 0.8rem; color: #64748b; line-height: 1.5; }

/* Responsive */
@media (max-width: 768px) {
  .lists-grid, .usage-grid { grid-template-columns: 1fr; }
}
</style>
