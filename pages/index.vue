<script setup lang="ts">
import type { Principle } from "~/types/blog";
import { marked } from "marked";
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'global' });

// Use shared lists from database for Author dropdown
const { fetchLists, getListItems } = useLists();
const authorTypeOptions = ["Partner", "Lead Staff"] as const;

type BlogPost = {
  id: number;
  kind: "draft" | "final";
  title: string;
  topic: string;
  audience: string;
  objective: string;
  tone: string;
  length: string;
  cta: string;
  selectedPerson?: string | null;
  targetMode?: string | null;
  outlineText: string;
  finalText?: string | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

type BlogInput = {
  id: number;
  signature: string;
  topic: string;
  audience: string;
  objective: string;
  tone: string;
  length: string;
  cta: string;
  principlesJson: Principle[];
  selectedPerson?: string | null;
  targetMode?: string | null;
  styleStrength?: string | null;
  updatedAt: string;
};

type BlogReference = {
  id: number;
  title: string;
  type: "document" | "url";
  content?: string | null;
  url?: string | null;
  topic?: string | null;
  createdAt: string;
  updatedAt: string;
};

const tones = ["Professional", "Friendly", "Confident", "Educational"];
const lengths = ["Short", "Medium", "Long"];
const polishLevels = ["Standard", "Strong", "Premium"];

const form = reactive({
  topic: "",
  audience: "Business owners",
  objective: "Help readers make practical financial decisions",
  tone: "Professional",
  length: "Medium",
  wordCount: "300-400",
  cta: "book a short strategy call",
  authorType: "Lead Staff" as "Partner" | "Lead Staff",
  author: "",
  polishLevel: "Strong",
  aiInstructions: ""
});

// Author options based on authorType selection
const authorOptions = computed(() => {
  if (form.authorType === "Partner") {
    return getListItems("partner");
  }
  return getListItems("leadStaff");
});

// Clear author when authorType changes
watch(() => form.authorType, () => {
  form.author = "";
});

// Word count preferences per length (reactive, persisted to localStorage)
const defaultWordCounts: Record<string, string> = {
  Short: "250-350",
  Medium: "400-600",
  Long: "800-1000"
};

const lengthWordCounts = reactive<Record<string, string>>({ ...defaultWordCounts });

// Load saved word count preferences from localStorage on mount
function loadWordCountPrefs() {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("blogLengthWordCounts");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.assign(lengthWordCounts, parsed);
        // Also update current form value to match selected length
        form.wordCount = lengthWordCounts[form.length] || defaultWordCounts[form.length];
      } catch {
        // Ignore parse errors
      }
    }
  }
}

// Save word count preferences to localStorage
function saveWordCountPrefs() {
  if (typeof window !== "undefined") {
    localStorage.setItem("blogLengthWordCounts", JSON.stringify(lengthWordCounts));
  }
}

// Update word count when length changes
watch(() => form.length, (newLength) => {
  form.wordCount = lengthWordCounts[newLength] || defaultWordCounts[newLength];
});

// Flag to skip saving when restoring inputs
let isRestoring = false;

// Save word count preference when user edits it (debounced to avoid excessive saves)
let wordCountSaveTimer: ReturnType<typeof setTimeout> | null = null;
watch(() => form.wordCount, (newWordCount) => {
  // Skip saving when we're restoring from saved inputs
  if (isRestoring) return;

  // Update the preference for the current length
  lengthWordCounts[form.length] = newWordCount;

  // Debounce the localStorage save
  if (wordCountSaveTimer) clearTimeout(wordCountSaveTimer);
  wordCountSaveTimer = setTimeout(() => {
    saveWordCountPrefs();
  }, 500);
});

const principles = ref<Principle[]>([
  { title: "Market context", details: ["What changed and why it matters", "Which indicators to watch", "Where uncertainty is highest"] },
  { title: "Action plan", details: ["What to do this month", "How to sequence decisions", "How to avoid overreaction"] },
  { title: "Review cadence", details: ["What to review regularly", "When to adjust", "How to measure progress"] }
]);

const draftText = ref("");
const finalText = ref("");
const aiSource = ref<"ai" | "template" | "">("");
const aiError = ref("");
const busy = ref(false);
const generatingType = ref<"draft" | "final" | "">("");
const startupError = ref("");
const saveStatus = ref<{ type: "success" | "error"; message: string } | null>(null);
const showPreview = ref(true);

const draftHtml = computed(() => marked(draftText.value || ""));
const finalHtml = computed(() => marked(finalText.value || ""));

// Word count helpers
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}
const draftWordCount = computed(() => countWords(draftText.value));
const finalWordCount = computed(() => countWords(finalText.value));
const isWordCountShort = computed(() => {
  if (!form.wordCount || finalWordCount.value === 0) return false;
  const match = form.wordCount.match(/(\d+)/);
  const minWords = match ? parseInt(match[1], 10) : 0;
  return finalWordCount.value < minWords;
});

const inputs = ref<BlogInput[]>([]);
const draftPosts = ref<BlogPost[]>([]);
const finalPosts = ref<BlogPost[]>([]);
const references = ref<BlogReference[]>([]);
const selectedReferenceIds = ref<number[]>([]);

// New reference form
const newRef = reactive({
  title: "",
  type: "document" as "document" | "url",
  content: "",
  url: "",
  topic: ""
});
const showRefForm = ref(false);

const draftSearch = ref("");
const finalSearch = ref("");
const draftPinnedOnly = ref(false);
const finalPinnedOnly = ref(false);

const filteredDrafts = computed(() => {
  return draftPosts.value.filter((item) => {
    if (draftPinnedOnly.value && !item.isPinned) {
      return false;
    }
    if (!draftSearch.value.trim()) {
      return true;
    }
    const q = draftSearch.value.toLowerCase();
    return `${item.title} ${item.topic} ${item.selectedPerson || ""}`.toLowerCase().includes(q);
  });
});

const filteredFinals = computed(() => {
  return finalPosts.value.filter((item) => {
    if (finalPinnedOnly.value && !item.isPinned) {
      return false;
    }
    if (!finalSearch.value.trim()) {
      return true;
    }
    const q = finalSearch.value.toLowerCase();
    return `${item.title} ${item.topic} ${item.selectedPerson || ""}`.toLowerCase().includes(q);
  });
});

function signatureForInputs() {
  // Create a short signature using key fields (max 191 chars for DB)
  const parts = [
    form.topic.trim().slice(0, 50),
    form.tone,
    form.length,
    form.author || "none"
  ];
  return parts.join("|").slice(0, 191);
}

function buildPostTitle(kind: "draft" | "final") {
  const prefix = kind === "draft" ? "Draft" : "Final";
  return `${prefix}: ${form.topic || "Untitled"}`;
}

async function loadInputs() {
  const res = await $fetch<{ items: BlogInput[] }>("/api/blog/inputs");
  inputs.value = res.items;
}

async function loadPosts() {
  const drafts = await $fetch<{ items: BlogPost[] }>("/api/blog/posts", { query: { kind: "draft" } });
  const finals = await $fetch<{ items: BlogPost[] }>("/api/blog/posts", { query: { kind: "final" } });
  draftPosts.value = drafts.items;
  finalPosts.value = finals.items;
}

async function loadReferences() {
  const res = await $fetch<{ items: BlogReference[] }>("/api/blog/references");
  references.value = res.items;
}

async function saveReference() {
  if (!newRef.title.trim()) return;
  busy.value = true;
  try {
    await $fetch("/api/blog/references", {
      method: "POST",
      body: {
        title: newRef.title,
        type: newRef.type,
        content: newRef.type === "document" ? newRef.content : undefined,
        url: newRef.type === "url" ? newRef.url : undefined,
        topic: newRef.topic || undefined
      }
    });
    await loadReferences();
    newRef.title = "";
    newRef.content = "";
    newRef.url = "";
    newRef.topic = "";
    showRefForm.value = false;
    saveStatus.value = { type: "success", message: "Reference saved!" };
    setTimeout(() => { saveStatus.value = null; }, 3000);
  } catch (error: unknown) {
    const e = error as { data?: { message?: string }; message?: string };
    saveStatus.value = { type: "error", message: String(e?.data?.message || e?.message || "Failed to save reference") };
  } finally {
    busy.value = false;
  }
}

async function deleteReference(id: number) {
  await $fetch(`/api/blog/references/${id}`, { method: "DELETE" });
  selectedReferenceIds.value = selectedReferenceIds.value.filter(rid => rid !== id);
  await loadReferences();
}

function toggleReference(id: number) {
  const idx = selectedReferenceIds.value.indexOf(id);
  if (idx >= 0) {
    selectedReferenceIds.value.splice(idx, 1);
  } else {
    selectedReferenceIds.value.push(id);
  }
}

function getSelectedReferencesText(): string {
  const selected = references.value.filter(r => selectedReferenceIds.value.includes(r.id));
  return selected.map(r => {
    if (r.type === "url") {
      return `Reference: ${r.title}\nURL: ${r.url}`;
    }
    return `Reference: ${r.title}\n${r.content || ""}`;
  }).join("\n\n");
}

async function generateDraft() {
  busy.value = true;
  generatingType.value = "draft";
  aiError.value = "";
  try {
    const res = await $fetch<{ text: string; source: "ai" | "template"; error?: string }>("/api/blog/generate/draft", {
      method: "POST",
      body: {
        topic: form.topic,
        audience: form.audience,
        objective: form.objective,
        tone: form.tone,
        length: form.length,
        wordCount: form.wordCount,
        cta: form.cta,
        author: form.author,
        principles: principles.value,
        references: getSelectedReferencesText()
      }
    });
    draftText.value = res.text;
    aiSource.value = res.source;
    aiError.value = res.error || "";
    await saveInputs();
  } finally {
    busy.value = false;
    generatingType.value = "";
  }
}

async function generateFinal() {
  busy.value = true;
  generatingType.value = "final";
  aiError.value = "";
  try {
    const res = await $fetch<{ text: string; source: "ai" | "template"; error?: string }>("/api/blog/generate/final", {
      method: "POST",
      body: {
        outlineText: draftText.value,
        topic: form.topic,
        audience: form.audience,
        objective: form.objective,
        tone: form.tone,
        cta: form.cta,
        polishLevel: form.polishLevel,
        wordCount: form.wordCount,
        aiInstructions: form.aiInstructions
      }
    });
    finalText.value = res.text;
    aiSource.value = res.source;
    aiError.value = res.error || "";
  } finally {
    busy.value = false;
    generatingType.value = "";
  }
}

async function saveInputs() {
  busy.value = true;
  saveStatus.value = null;
  try {
    await $fetch("/api/blog/inputs", {
      method: "POST",
      body: {
        signature: signatureForInputs(),
        topic: form.topic,
        audience: form.audience,
        objective: form.objective,
        tone: form.tone,
        length: form.length,
        wordCount: form.wordCount,
        cta: form.cta,
        principles: principles.value,
        authorType: form.authorType,
        author: form.author
      }
    });
    await loadInputs();
    saveStatus.value = { type: "success", message: "Inputs saved successfully!" };
    setTimeout(() => { saveStatus.value = null; }, 3000);
  } catch (error: unknown) {
    const e = error as { data?: { message?: string }; message?: string };
    saveStatus.value = { type: "error", message: String(e?.data?.message || e?.message || "Failed to save inputs") };
  } finally {
    busy.value = false;
  }
}

async function savePost(kind: "draft" | "final") {
  await $fetch("/api/blog/posts", {
    method: "POST",
    body: {
      kind,
      title: buildPostTitle(kind),
      topic: form.topic,
      audience: form.audience,
      objective: form.objective,
      tone: form.tone,
      length: form.length,
      wordCount: form.wordCount,
      cta: form.cta,
      authorType: form.authorType,
      author: form.author,
      outlineText: draftText.value,
      finalText: kind === "final" ? finalText.value : null,
      metadata: {
        aiSource: aiSource.value,
        aiError: aiError.value
      }
    }
  });
  await loadPosts();
}

function autoResize(event: Event) {
  const el = event.target as HTMLTextAreaElement;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

function resizeAllTextareas() {
  nextTick(() => {
    document.querySelectorAll<HTMLTextAreaElement>(".auto-resize").forEach((el) => {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    });
  });
}

function restoreFromInput(item: BlogInput) {
  isRestoring = true;
  form.topic = item.topic;
  form.audience = item.audience;
  form.objective = item.objective;
  form.tone = item.tone;
  form.length = item.length;
  // Use saved word count preference for this length, not the old input's value
  form.wordCount = lengthWordCounts[item.length] || defaultWordCounts[item.length];
  form.cta = item.cta;
  form.authorType = (item as any).authorType || "Lead Staff";
  form.author = (item as any).author || item.targetMode || "";
  principles.value = Array.isArray(item.principlesJson) ? item.principlesJson : principles.value;
  resizeAllTextareas();
  nextTick(() => { isRestoring = false; });
}

function restoreDraft(item: BlogPost) {
  isRestoring = true;
  form.topic = item.topic;
  form.audience = item.audience;
  form.objective = item.objective;
  form.tone = item.tone;
  form.length = item.length;
  // Use saved word count preference for this length, not the old post's value
  form.wordCount = lengthWordCounts[item.length] || defaultWordCounts[item.length];
  form.cta = item.cta;
  form.authorType = (item as any).authorType || "Lead Staff";
  form.author = (item as any).author || item.targetMode || "";
  draftText.value = item.outlineText || "";
  nextTick(() => { isRestoring = false; });
}

function restoreFinal(item: BlogPost) {
  restoreDraft(item);
  finalText.value = item.finalText || "";
}

function duplicateFinalToDraft(item: BlogPost) {
  draftText.value = item.finalText || item.outlineText || "";
}

async function setPinned(item: BlogPost, value: boolean) {
  await $fetch(`/api/blog/posts/${item.id}`, {
    method: "PATCH",
    body: { isPinned: value }
  });
  await loadPosts();
}

async function deletePost(item: BlogPost) {
  await $fetch(`/api/blog/posts/${item.id}`, { method: "DELETE" });
  await loadPosts();
}

async function deleteInput(item: BlogInput) {
  await $fetch(`/api/blog/inputs/${item.id}`, { method: "DELETE" });
  await loadInputs();
}

onMounted(async () => {
  try {
    loadWordCountPrefs();
    // Load all data in parallel for faster page load
    await Promise.all([fetchLists(), loadInputs(), loadPosts(), loadReferences()]);
    resizeAllTextareas();
  } catch (error: unknown) {
    const e = error as { data?: { message?: string }; message?: string };
    startupError.value = String(e?.data?.message || e?.message || "Failed to load initial data");
  }
});
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">{{ t('blog.badge') }}</span>
          <h1>{{ t('blog.title') }}</h1>
          <p>{{ t('blog.subtitle') }}</p>
        </div>
      </div>
    </header>

    <section class="stats-strip">
      <article><span>{{ t('blog.savedInputs') }}</span><strong>{{ inputs.length }}</strong></article>
      <article><span>{{ t('blog.drafts') }}</span><strong>{{ draftPosts.length }}</strong></article>
      <article><span>{{ t('blog.finals') }}</span><strong>{{ finalPosts.length }}</strong></article>
    </section>

    <p v-if="startupError" class="error">Startup warning: {{ startupError }}</p>

    <section class="card form-card">
      <h2>{{ t('blog.blogInputs') }}</h2>
      <div class="grid">
        <label>
          {{ t('blog.topic') }}
          <input v-model="form.topic" :placeholder="t('blog.topicPlaceholder')" />
        </label>
        <label>
          {{ t('blog.audience') }}
          <input v-model="form.audience" />
        </label>
        <label>
          {{ t('blog.objective') }}
          <input v-model="form.objective" />
        </label>
        <label>
          {{ t('blog.tone') }}
          <select v-model="form.tone">
            <option v-for="tone in tones" :key="tone" :value="tone">{{ tone }}</option>
          </select>
        </label>
        <label>
          {{ t('blog.length') }}
          <select v-model="form.length">
            <option v-for="length in lengths" :key="length" :value="length">{{ length }}</option>
          </select>
        </label>
        <label>
          {{ t('blog.wordCount') }}
          <input v-model="form.wordCount" :placeholder="t('blog.wordCountPlaceholder')" />
        </label>
        <label>
          {{ t('blog.cta') }}
          <input v-model="form.cta" />
        </label>
        <label>
          {{ t('blog.authorType') }}
          <select v-model="form.authorType">
            <option v-for="opt in authorTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label>
          {{ t('blog.author') }}
          <select v-model="form.author">
            <option value="">{{ t('blog.selectAuthor') }}</option>
            <option v-for="opt in authorOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>

      <h3>{{ t('blog.principles') }}</h3>
      <div class="principles">
        <article v-for="(p, index) in principles" :key="index" class="principle">
          <h4>{{ t('blog.principle') }} {{ index + 1 }}</h4>
          <textarea v-model="p.title" class="auto-resize" rows="1" @input="autoResize" />
          <label v-for="(_, detailIndex) in p.details" :key="detailIndex">
            {{ t('blog.detail') }} {{ detailIndex + 1 }}
            <textarea v-model="p.details[detailIndex]" class="auto-resize" rows="1" @input="autoResize" />
          </label>
        </article>
      </div>

      <h3>{{ t('blog.references') }}</h3>
      <p class="ref-hint">{{ t('blog.refHint') }}</p>

      <div class="ref-list">
        <div v-for="ref in references" :key="ref.id" class="ref-item" :class="{ selected: selectedReferenceIds.includes(ref.id) }">
          <label class="ref-checkbox">
            <input type="checkbox" :checked="selectedReferenceIds.includes(ref.id)" @change="toggleReference(ref.id)" />
            <span class="ref-title">{{ ref.title }}</span>
            <span class="ref-type">{{ ref.type === 'url' ? 'URL' : t('blog.doc') }}</span>
          </label>
          <button class="ref-delete" @click="deleteReference(ref.id)">{{ t('common.delete') }}</button>
        </div>
        <p v-if="references.length === 0" class="ref-empty">{{ t('blog.noReferences') }}</p>
      </div>

      <button class="ref-toggle" @click="showRefForm = !showRefForm">
        {{ showRefForm ? t('common.cancel') : t('blog.addReference') }}
      </button>

      <div v-if="showRefForm" class="ref-form">
        <label>
          {{ t('blog.refTitle') }}
          <input v-model="newRef.title" :placeholder="t('blog.refTitlePlaceholder')" />
        </label>
        <label>
          {{ t('blog.refType') }}
          <select v-model="newRef.type">
            <option value="document">{{ t('blog.document') }}</option>
            <option value="url">{{ t('blog.urlLink') }}</option>
          </select>
        </label>
        <label v-if="newRef.type === 'url'">
          URL
          <input v-model="newRef.url" placeholder="https://..." />
        </label>
        <label v-if="newRef.type === 'document'">
          {{ t('blog.content') }}
          <textarea v-model="newRef.content" rows="6" :placeholder="t('blog.contentPlaceholder')" />
        </label>
        <label>
          {{ t('blog.topicOptional') }}
          <input v-model="newRef.topic" :placeholder="t('blog.topicOptionalPlaceholder')" />
        </label>
        <button :disabled="busy || !newRef.title.trim()" @click="saveReference">{{ t('blog.saveReference') }}</button>
      </div>

      <div class="actions">
        <button :disabled="busy" @click="saveInputs">{{ t('blog.saveInputs') }}</button>
        <button :disabled="busy || !form.topic.trim()" @click="generateDraft">
          <span v-if="busy && generatingType === 'draft'" class="spinner"></span>
          {{ busy && generatingType === 'draft' ? t('blog.generating') : t('blog.generateDraft') }}
        </button>
        <button :disabled="busy || !draftText.trim()" @click="generateFinal">
          <span v-if="busy && generatingType === 'final'" class="spinner"></span>
          {{ busy && generatingType === 'final' ? t('blog.generating') : t('blog.generateFinal') }}
        </button>
        <button :disabled="busy || !draftText.trim()" @click="savePost('draft')">{{ t('blog.saveDraft') }}</button>
        <button :disabled="busy || !finalText.trim()" @click="savePost('final')">{{ t('blog.saveFinal') }}</button>
      </div>

      <p v-if="saveStatus" :class="saveStatus.type === 'success' ? 'status' : 'error'">{{ saveStatus.message }}</p>
      <p v-if="aiSource" class="status">Last generation source: <strong>{{ aiSource }}</strong></p>
      <p v-if="aiError" class="error">{{ aiError }}</p>
    </section>

    <section class="columns">
      <article class="card">
        <h2>{{ t('blog.savedInputs') }}</h2>
        <div class="list">
          <div v-for="item in inputs" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.topic }}</strong>
              <p>{{ new Date(item.updatedAt).toLocaleString() }}</p>
            </div>
            <div class="row-actions">
              <button @click="restoreFromInput(item)">{{ t('blog.restore') }}</button>
              <button @click="deleteInput(item)">{{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>{{ t('blog.draftOutlines') }}</h2>
        <div class="filters">
          <input v-model="draftSearch" :placeholder="t('blog.searchDrafts')" />
          <label><input v-model="draftPinnedOnly" type="checkbox" /> {{ t('blog.pinnedOnly') }}</label>
        </div>
        <div class="list">
          <div v-for="item in filteredDrafts" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ new Date(item.updatedAt).toLocaleString() }} • {{ item.isPinned ? t('blog.pinned') : t('blog.unpinned') }}</p>
            </div>
            <div class="row-actions wrap">
              <button @click="restoreDraft(item)">{{ t('blog.restore') }}</button>
              <button @click="setPinned(item, !item.isPinned)">{{ item.isPinned ? t('blog.unpin') : t('blog.pin') }}</button>
              <button @click="deletePost(item)">{{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>{{ t('blog.finalPosts') }}</h2>
        <div class="filters">
          <input v-model="finalSearch" :placeholder="t('blog.searchFinals')" />
          <label><input v-model="finalPinnedOnly" type="checkbox" /> {{ t('blog.pinnedOnly') }}</label>
        </div>
        <div class="list">
          <div v-for="item in filteredFinals" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ new Date(item.updatedAt).toLocaleString() }} • {{ item.isPinned ? t('blog.pinned') : t('blog.unpinned') }}</p>
            </div>
            <div class="row-actions wrap">
              <button @click="restoreFinal(item)">{{ t('blog.restore') }}</button>
              <button @click="duplicateFinalToDraft(item)">{{ t('blog.duplicateToDraft') }}</button>
              <button @click="setPinned(item, !item.isPinned)">{{ item.isPinned ? t('blog.unpin') : t('blog.pin') }}</button>
              <button @click="deletePost(item)">{{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="card editor-card">
      <div class="editor-header">
        <h2>{{ t('blog.draftOutline') }} <span v-if="draftWordCount > 0" class="word-count">{{ draftWordCount }} {{ t('blog.words') }}</span></h2>
        <button class="preview-toggle" :class="{ editing: !showPreview }" @click="showPreview = !showPreview">
          {{ showPreview ? t('blog.editMode') : t('blog.saveChanges') }}
        </button>
      </div>
      <textarea v-if="!showPreview" v-model="draftText" rows="14" />
      <div v-else class="markdown-preview" v-html="draftHtml" />

      <div v-if="draftText.trim()" class="ai-instructions-section">
        <h3>{{ t('blog.aiInstructions') }}</h3>
        <p class="ai-instructions-hint">{{ t('blog.aiInstructionsHint') }}</p>
        <textarea
          v-model="form.aiInstructions"
          rows="3"
          :placeholder="t('blog.aiInstructionsPlaceholder')"
          class="ai-instructions-input"
        />
      </div>

      <h2>{{ t('blog.finalPost') }} <span v-if="finalWordCount > 0" class="word-count" :class="{ 'word-count-short': isWordCountShort }">{{ finalWordCount }} {{ t('blog.words') }} <template v-if="isWordCountShort">({{ t('blog.target') }}: {{ form.wordCount }})</template></span></h2>
      <label>
        {{ t('blog.polishLevel') }}
        <select v-model="form.polishLevel">
          <option v-for="level in polishLevels" :key="level" :value="level">{{ level }}</option>
        </select>
      </label>
      <textarea v-if="!showPreview" v-model="finalText" rows="16" />
      <div v-else class="markdown-preview" v-html="finalHtml" />
    </section>
  </main>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: #0f172a;
  min-height: 100vh;
  padding: 1.5rem;
  background:
    radial-gradient(circle at top right, rgba(208, 21, 213, 0.1) 0%, transparent 25%),
    radial-gradient(circle at left top, rgba(255, 150, 255, 0.08) 0%, transparent 30%),
    radial-gradient(circle at bottom right, rgba(208, 21, 213, 0.06) 0%, transparent 35%),
    linear-gradient(180deg, #fdf0fd 0%, #fcecfc 100%);
}

.page-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255, 150, 255, 0.25) 0%, transparent 40%),
    linear-gradient(135deg, #e020e5 0%, #d015d5 25%, #b312b8 50%, #960f9a 75%, #7a0c7e 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(208, 21, 213, 0.35),
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

.stats-strip {
  display: grid;
  gap: 0.58rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.stats-strip article {
  border-radius: 18px;
  padding: 0.62rem 0.7rem;
  background: linear-gradient(180deg, #fce8fc, #f7ccf7);
  box-shadow: 0 12px 28px rgba(208, 21, 213, 0.12);
}
.stats-strip span { display: block; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.08em; color: #8a0e8e; }
.stats-strip strong { display: block; margin-top: 0.2rem; font-size: 1.2rem; color: #6a0b6e; }

.card {
  background: #ffffff;
  border: 1px solid rgba(208, 21, 213, 0.14);
  border-radius: 18px;
  padding: 0.72rem;
  box-shadow: 0 12px 28px rgba(208, 21, 213, 0.08);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.45rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.78rem;
  font-weight: 600;
}

input,
select,
textarea,
button {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.36rem 0.48rem;
  font-size: 0.84rem;
  line-height: 1.2;
}

textarea {
  width: 100%;
  margin: 0.25rem 0 0.55rem;
  font-family: inherit;
}

.actions {
  display: flex;
  gap: 0.38rem;
  flex-wrap: wrap;
  margin-top: 0.55rem;
}

button {
  cursor: pointer;
  background: #fdf4ff;
  border-color: rgba(208, 21, 213, 0.25);
  font-size: 0.8rem;
  line-height: 1.1;
  padding: 0.34rem 0.48rem;
}

button:hover:enabled {
  background: #fae8fa;
  border-color: rgba(208, 21, 213, 0.4);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(208, 21, 213, 0.3);
  border-top-color: #d015d5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 6px;
  vertical-align: middle;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ai-instructions-section {
  margin: 1rem 0;
  padding: 0.75rem;
  background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%);
  border: 1px solid rgba(208, 21, 213, 0.2);
  border-radius: 12px;
}

.ai-instructions-section h3 {
  margin: 0 0 0.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6a0b6e;
}

.ai-instructions-hint {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  color: #64748b;
}

.ai-instructions-input {
  width: 100%;
  min-height: 60px;
  resize: vertical;
  font-family: inherit;
  background: white;
}

.principles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.46rem;
  margin-top: 0.45rem;
}

.principle {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.48rem;
}

.principle h4 {
  margin: 0 0 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6a0b6e;
}

.principle-title {
  width: 100%;
  margin-bottom: 0.4rem;
}

.auto-resize {
  width: 100%;
  min-height: 2rem;
  resize: none;
  overflow: hidden;
  line-height: 1.4;
}

.ref-hint {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 0.5rem;
}

.ref-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.ref-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.4rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
}

.ref-item.selected {
  border-color: #d015d5;
  background: #fdf4ff;
}

.ref-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  cursor: pointer;
}

.ref-checkbox input {
  width: auto;
}

.ref-title {
  font-size: 0.85rem;
  font-weight: 500;
}

.ref-type {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  background: #e2e8f0;
  border-radius: 4px;
  color: #64748b;
}

.ref-delete {
  font-size: 0.7rem;
  padding: 0.2rem 0.4rem;
  background: transparent;
  border: 1px solid #fca5a5;
  color: #b91c1c;
}

.ref-delete:hover {
  background: #fee2e2;
}

.ref-empty {
  font-size: 0.8rem;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
}

.ref-toggle {
  margin-bottom: 0.5rem;
  font-size: 0.8rem;
}

.ref-form {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.6rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #f8fafc;
  margin-bottom: 0.6rem;
}

.columns {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
  max-height: 360px;
  overflow: auto;
}

.list-item {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0.4rem 0.48rem;
}

.list-item p {
  margin: 0.16rem 0 0;
  color: #475569;
  font-size: 0.75rem;
}

.row-actions {
  display: flex;
  gap: 0.3rem;
  margin-top: 0.3rem;
}

.row-actions.wrap {
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.42rem;
  align-items: center;
}

.status {
  color: #a21caf;
}

.error {
  color: #b91c1c;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.editor-header h2 {
  margin: 0;
}

.word-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: #16a34a;
  background: #dcfce7;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
}

.word-count-short {
  color: #dc2626;
  background: #fee2e2;
}

.preview-toggle {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.4rem 0.8rem;
  font-size: 0.8rem;
  font-weight: 500;
}

.preview-toggle:hover {
  background: #4f46e5;
}

.preview-toggle.editing {
  background: #16a34a;
}

.preview-toggle.editing:hover {
  background: #15803d;
}

.markdown-preview {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  background: #fafafa;
  min-height: 200px;
  max-height: 500px;
  overflow-y: auto;
  line-height: 1.6;
}

.markdown-preview :deep(h1) {
  font-size: 1.5rem;
  font-weight: 700;
  color: #6a0b6e;
  margin: 0 0 1rem;
  border-bottom: 2px solid #d015d5;
  padding-bottom: 0.5rem;
}

.markdown-preview :deep(h2) {
  font-size: 1.2rem;
  font-weight: 600;
  color: #8a0e8e;
  margin: 1.5rem 0 0.75rem;
}

.markdown-preview :deep(h3) {
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
  margin: 1rem 0 0.5rem;
}

.markdown-preview :deep(p) {
  margin: 0.75rem 0;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin: 0.75rem 0;
  padding-left: 1.5rem;
}

.markdown-preview :deep(li) {
  margin: 0.4rem 0;
}

.markdown-preview :deep(strong) {
  font-weight: 600;
  color: #6a0b6e;
}

.markdown-preview :deep(a) {
  color: #d015d5;
  text-decoration: underline;
}

@media (max-width: 980px) {
  .stats-strip,
  .grid,
  .principles,
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
