<script>
import { marked } from "marked";

export default {
  name: 'IndexPage',

  data() {
    return {
      tones: ["Professional", "Friendly", "Confident", "Educational"],
      lengths: ["Short", "Medium", "Long"],
      polishLevels: ["Standard", "Strong", "Premium"],
      authorTypeOptions: ["Partner", "Lead Staff"],

      form: {
        topic: "",
        audience: "Business owners",
        objective: "Help readers make practical financial decisions",
        tone: "Professional",
        length: "Medium",
        wordCount: "300-400",
        cta: "book a short strategy call",
        authorType: "Lead Staff",
        author: "",
        polishLevel: "Strong",
        aiInstructions: ""
      },

      defaultWordCounts: {
        Short: "250-350",
        Medium: "400-600",
        Long: "800-1000"
      },
      lengthWordCounts: {
        Short: "250-350",
        Medium: "400-600",
        Long: "800-1000"
      },

      principles: [
        { title: "Market context", details: ["What changed and why it matters", "Which indicators to watch", "Where uncertainty is highest"] },
        { title: "Action plan", details: ["What to do this month", "How to sequence decisions", "How to avoid overreaction"] },
        { title: "Review cadence", details: ["What to review regularly", "When to adjust", "How to measure progress"] }
      ],

      draftText: "",
      finalText: "",
      aiSource: "",
      aiError: "",
      busy: false,
      generatingType: "",
      startupError: "",
      saveStatus: null,
      showPreview: true,

      inputs: [],
      draftPosts: [],
      finalPosts: [],
      references: [],
      selectedReferenceIds: [],

      newRef: {
        title: "",
        type: "document",
        content: "",
        url: "",
        topic: ""
      },
      showRefForm: false,

      draftSearch: "",
      finalSearch: "",
      draftPinnedOnly: false,
      finalPinnedOnly: false,

      isRestoring: false,
      wordCountSaveTimer: null
    };
  },

  computed: {
    authorOptions() {
      if (this.form.authorType === "Partner") {
        return this.$store.getters['lists/getListItems']("partner");
      }
      return this.$store.getters['lists/getListItems']("leadStaff");
    },
    draftHtml() {
      return marked(this.draftText || "");
    },
    finalHtml() {
      return marked(this.finalText || "");
    },
    draftWordCount() {
      return this.countWords(this.draftText);
    },
    finalWordCount() {
      return this.countWords(this.finalText);
    },
    isWordCountShort() {
      if (!this.form.wordCount || this.finalWordCount === 0) return false;
      const match = this.form.wordCount.match(/(\d+)/);
      const minWords = match ? parseInt(match[1], 10) : 0;
      return this.finalWordCount < minWords;
    },
    filteredDrafts() {
      return this.draftPosts.filter((item) => {
        if (this.draftPinnedOnly && !item.isPinned) return false;
        if (!this.draftSearch.trim()) return true;
        const q = this.draftSearch.toLowerCase();
        return `${item.title} ${item.topic} ${item.selectedPerson || ""}`.toLowerCase().includes(q);
      });
    },
    filteredFinals() {
      return this.finalPosts.filter((item) => {
        if (this.finalPinnedOnly && !item.isPinned) return false;
        if (!this.finalSearch.trim()) return true;
        const q = this.finalSearch.toLowerCase();
        return `${item.title} ${item.topic} ${item.selectedPerson || ""}`.toLowerCase().includes(q);
      });
    }
  },

  watch: {
    'form.authorType'() {
      this.form.author = "";
    },
    'form.length'(newLength) {
      this.form.wordCount = this.lengthWordCounts[newLength] || this.defaultWordCounts[newLength];
    },
    'form.wordCount'(newWordCount) {
      if (this.isRestoring) return;
      this.lengthWordCounts[this.form.length] = newWordCount;
      if (this.wordCountSaveTimer) clearTimeout(this.wordCountSaveTimer);
      this.wordCountSaveTimer = setTimeout(() => {
        this.saveWordCountPrefs();
      }, 500);
    }
  },

  async mounted() {
    try {
      this.loadWordCountPrefs();
      await Promise.all([
        this.$store.dispatch('lists/fetchLists'),
        this.loadInputs(),
        this.loadPosts(),
        this.loadReferences()
      ]);
      this.resizeAllTextareas();
    } catch (error) {
      this.startupError = String(error?.message || "Failed to load initial data");
    }
  },

  methods: {
    t(key) {
      return this.$t(key);
    },

    getCsrfToken() {
      if (typeof document === 'undefined') return '';
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

    countWords(text) {
      return text.trim().split(/\s+/).filter(w => w.length > 0).length;
    },

    loadWordCountPrefs() {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("blogLengthWordCounts");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            Object.assign(this.lengthWordCounts, parsed);
            this.form.wordCount = this.lengthWordCounts[this.form.length] || this.defaultWordCounts[this.form.length];
          } catch {
            // Ignore parse errors
          }
        }
      }
    },

    saveWordCountPrefs() {
      if (typeof window !== "undefined") {
        localStorage.setItem("blogLengthWordCounts", JSON.stringify(this.lengthWordCounts));
      }
    },

    signatureForInputs() {
      const parts = [
        this.form.topic.trim().slice(0, 50),
        this.form.tone,
        this.form.length,
        this.form.author || "none"
      ];
      return parts.join("|").slice(0, 191);
    },

    buildPostTitle(kind) {
      const prefix = kind === "draft" ? "Draft" : "Final";
      return `${prefix}: ${this.form.topic || "Untitled"}`;
    },

    async loadInputs() {
      const res = await this.apiFetch("/api/blog/inputs");
      this.inputs = res.items;
    },

    async loadPosts() {
      const [drafts, finals] = await Promise.all([
        this.apiFetch("/api/blog/posts?kind=draft"),
        this.apiFetch("/api/blog/posts?kind=final")
      ]);
      this.draftPosts = drafts.items;
      this.finalPosts = finals.items;
    },

    async loadReferences() {
      const res = await this.apiFetch("/api/blog/references");
      this.references = res.items;
    },

    async saveReference() {
      if (!this.newRef.title.trim()) return;
      this.busy = true;
      try {
        await this.apiFetch("/api/blog/references", {
          method: "POST",
          body: {
            title: this.newRef.title,
            type: this.newRef.type,
            content: this.newRef.type === "document" ? this.newRef.content : undefined,
            url: this.newRef.type === "url" ? this.newRef.url : undefined,
            topic: this.newRef.topic || undefined
          }
        });
        await this.loadReferences();
        this.newRef.title = "";
        this.newRef.content = "";
        this.newRef.url = "";
        this.newRef.topic = "";
        this.showRefForm = false;
        this.saveStatus = { type: "success", message: "Reference saved!" };
        setTimeout(() => { this.saveStatus = null; }, 3000);
      } catch (error) {
        this.saveStatus = { type: "error", message: String(error?.message || "Failed to save reference") };
      } finally {
        this.busy = false;
      }
    },

    async deleteReference(id) {
      await this.apiFetch(`/api/blog/references/${id}`, { method: "DELETE" });
      this.selectedReferenceIds = this.selectedReferenceIds.filter(rid => rid !== id);
      await this.loadReferences();
    },

    toggleReference(id) {
      const idx = this.selectedReferenceIds.indexOf(id);
      if (idx >= 0) {
        this.selectedReferenceIds.splice(idx, 1);
      } else {
        this.selectedReferenceIds.push(id);
      }
    },

    getSelectedReferencesText() {
      const selected = this.references.filter(r => this.selectedReferenceIds.includes(r.id));
      return selected.map(r => {
        if (r.type === "url") {
          return `Reference: ${r.title}\nURL: ${r.url}`;
        }
        return `Reference: ${r.title}\n${r.content || ""}`;
      }).join("\n\n");
    },

    async generateDraft() {
      this.busy = true;
      this.generatingType = "draft";
      this.aiError = "";
      try {
        const res = await this.apiFetch("/api/blog/generate/draft", {
          method: "POST",
          body: {
            topic: this.form.topic,
            audience: this.form.audience,
            objective: this.form.objective,
            tone: this.form.tone,
            length: this.form.length,
            wordCount: this.form.wordCount,
            cta: this.form.cta,
            author: this.form.author,
            principles: this.principles,
            references: this.getSelectedReferencesText()
          }
        });
        this.draftText = res.text;
        this.aiSource = res.source;
        this.aiError = res.error || "";
        await this.saveInputs();
      } finally {
        this.busy = false;
        this.generatingType = "";
      }
    },

    async generateFinal() {
      this.busy = true;
      this.generatingType = "final";
      this.aiError = "";
      try {
        const res = await this.apiFetch("/api/blog/generate/final", {
          method: "POST",
          body: {
            outlineText: this.draftText,
            topic: this.form.topic,
            audience: this.form.audience,
            objective: this.form.objective,
            tone: this.form.tone,
            cta: this.form.cta,
            polishLevel: this.form.polishLevel,
            wordCount: this.form.wordCount,
            aiInstructions: this.form.aiInstructions
          }
        });
        this.finalText = res.text;
        this.aiSource = res.source;
        this.aiError = res.error || "";
      } finally {
        this.busy = false;
        this.generatingType = "";
      }
    },

    async saveInputs() {
      this.busy = true;
      this.saveStatus = null;
      try {
        await this.apiFetch("/api/blog/inputs", {
          method: "POST",
          body: {
            signature: this.signatureForInputs(),
            topic: this.form.topic,
            audience: this.form.audience,
            objective: this.form.objective,
            tone: this.form.tone,
            length: this.form.length,
            wordCount: this.form.wordCount,
            cta: this.form.cta,
            principles: this.principles,
            authorType: this.form.authorType,
            author: this.form.author
          }
        });
        await this.loadInputs();
        this.saveStatus = { type: "success", message: "Inputs saved successfully!" };
        setTimeout(() => { this.saveStatus = null; }, 3000);
      } catch (error) {
        this.saveStatus = { type: "error", message: String(error?.message || "Failed to save inputs") };
      } finally {
        this.busy = false;
      }
    },

    async savePost(kind) {
      await this.apiFetch("/api/blog/posts", {
        method: "POST",
        body: {
          kind,
          title: this.buildPostTitle(kind),
          topic: this.form.topic,
          audience: this.form.audience,
          objective: this.form.objective,
          tone: this.form.tone,
          length: this.form.length,
          wordCount: this.form.wordCount,
          cta: this.form.cta,
          authorType: this.form.authorType,
          author: this.form.author,
          outlineText: this.draftText,
          finalText: kind === "final" ? this.finalText : null,
          metadata: {
            aiSource: this.aiSource,
            aiError: this.aiError
          }
        }
      });
      await this.loadPosts();
    },

    autoResize(event) {
      const el = event.target;
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    },

    resizeAllTextareas() {
      this.$nextTick(() => {
        document.querySelectorAll(".auto-resize").forEach((el) => {
          el.style.height = "auto";
          el.style.height = el.scrollHeight + "px";
        });
      });
    },

    restoreFromInput(item) {
      this.isRestoring = true;
      this.form.topic = item.topic;
      this.form.audience = item.audience;
      this.form.objective = item.objective;
      this.form.tone = item.tone;
      this.form.length = item.length;
      this.form.wordCount = this.lengthWordCounts[item.length] || this.defaultWordCounts[item.length];
      this.form.cta = item.cta;
      this.form.authorType = item.authorType || "Lead Staff";
      this.form.author = item.author || item.targetMode || "";
      if (Array.isArray(item.principlesJson)) {
        this.principles = item.principlesJson;
      }
      this.resizeAllTextareas();
      this.$nextTick(() => { this.isRestoring = false; });
    },

    restoreDraft(item) {
      this.isRestoring = true;
      this.form.topic = item.topic;
      this.form.audience = item.audience;
      this.form.objective = item.objective;
      this.form.tone = item.tone;
      this.form.length = item.length;
      this.form.wordCount = this.lengthWordCounts[item.length] || this.defaultWordCounts[item.length];
      this.form.cta = item.cta;
      this.form.authorType = item.authorType || "Lead Staff";
      this.form.author = item.author || item.targetMode || "";
      this.draftText = item.outlineText || "";
      this.$nextTick(() => { this.isRestoring = false; });
    },

    restoreFinal(item) {
      this.restoreDraft(item);
      this.finalText = item.finalText || "";
    },

    duplicateFinalToDraft(item) {
      this.draftText = item.finalText || item.outlineText || "";
    },

    async setPinned(item, value) {
      await this.apiFetch(`/api/blog/posts/${item.id}`, {
        method: "PATCH",
        body: { isPinned: value }
      });
      await this.loadPosts();
    },

    async deletePost(item) {
      await this.apiFetch(`/api/blog/posts/${item.id}`, { method: "DELETE" });
      await this.loadPosts();
    },

    async deleteInput(item) {
      await this.apiFetch(`/api/blog/inputs/${item.id}`, { method: "DELETE" });
      await this.loadInputs();
    }
  }
};
</script>

<template>
  <main class="page">
    <header class="page-header">
      <div class="header-content">
        <div class="header-text">
          <span class="header-badge">{{ $t('blog.badge') }}</span>
          <h1>{{ $t('blog.title') }}</h1>
          <p>{{ $t('blog.subtitle') }}</p>
        </div>
      </div>
    </header>

    <section class="stats-strip">
      <article><span>{{ $t('blog.savedInputs') }}</span><strong>{{ inputs.length }}</strong></article>
      <article><span>{{ $t('blog.drafts') }}</span><strong>{{ draftPosts.length }}</strong></article>
      <article><span>{{ $t('blog.finals') }}</span><strong>{{ finalPosts.length }}</strong></article>
    </section>

    <p v-if="startupError" class="error">Startup warning: {{ startupError }}</p>

    <section class="card form-card">
      <h2>{{ $t('blog.blogInputs') }}</h2>
      <div class="grid">
        <label>
          {{ $t('blog.topic') }}
          <input v-model="form.topic" :placeholder="$t('blog.topicPlaceholder')" />
        </label>
        <label>
          {{ $t('blog.audience') }}
          <input v-model="form.audience" />
        </label>
        <label>
          {{ $t('blog.objective') }}
          <input v-model="form.objective" />
        </label>
        <label>
          {{ $t('blog.tone') }}
          <select v-model="form.tone">
            <option v-for="tone in tones" :key="tone" :value="tone">{{ tone }}</option>
          </select>
        </label>
        <label>
          {{ $t('blog.length') }}
          <select v-model="form.length">
            <option v-for="length in lengths" :key="length" :value="length">{{ length }}</option>
          </select>
        </label>
        <label>
          {{ $t('blog.wordCount') }}
          <input v-model="form.wordCount" :placeholder="$t('blog.wordCountPlaceholder')" />
        </label>
        <label>
          {{ $t('blog.cta') }}
          <input v-model="form.cta" />
        </label>
        <label>
          {{ $t('blog.authorType') }}
          <select v-model="form.authorType">
            <option v-for="opt in authorTypeOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
        <label>
          {{ $t('blog.author') }}
          <select v-model="form.author">
            <option value="">{{ $t('blog.selectAuthor') }}</option>
            <option v-for="opt in authorOptions" :key="opt" :value="opt">{{ opt }}</option>
          </select>
        </label>
      </div>

      <h3>{{ $t('blog.principles') }}</h3>
      <div class="principles">
        <article v-for="(p, index) in principles" :key="index" class="principle">
          <h4>{{ $t('blog.principle') }} {{ index + 1 }}</h4>
          <textarea v-model="p.title" class="auto-resize" rows="1" @input="autoResize" />
          <label v-for="(detail, detailIndex) in p.details" :key="detailIndex">
            {{ $t('blog.detail') }} {{ detailIndex + 1 }}
            <textarea v-model="p.details[detailIndex]" class="auto-resize" rows="1" @input="autoResize" />
          </label>
        </article>
      </div>

      <h3>{{ $t('blog.references') }}</h3>
      <p class="ref-hint">{{ $t('blog.refHint') }}</p>

      <div class="ref-list">
        <div v-for="ref in references" :key="ref.id" class="ref-item" :class="{ selected: selectedReferenceIds.includes(ref.id) }">
          <label class="ref-checkbox">
            <input type="checkbox" :checked="selectedReferenceIds.includes(ref.id)" @change="toggleReference(ref.id)" />
            <span class="ref-title">{{ ref.title }}</span>
            <span class="ref-type">{{ ref.type === 'url' ? 'URL' : $t('blog.doc') }}</span>
          </label>
          <button class="ref-delete" @click="deleteReference(ref.id)">{{ $t('common.delete') }}</button>
        </div>
        <p v-if="references.length === 0" class="ref-empty">{{ $t('blog.noReferences') }}</p>
      </div>

      <button class="ref-toggle" @click="showRefForm = !showRefForm">
        {{ showRefForm ? $t('common.cancel') : $t('blog.addReference') }}
      </button>

      <div v-if="showRefForm" class="ref-form">
        <label>
          {{ $t('blog.refTitle') }}
          <input v-model="newRef.title" :placeholder="$t('blog.refTitlePlaceholder')" />
        </label>
        <label>
          {{ $t('blog.refType') }}
          <select v-model="newRef.type">
            <option value="document">{{ $t('blog.document') }}</option>
            <option value="url">{{ $t('blog.urlLink') }}</option>
          </select>
        </label>
        <label v-if="newRef.type === 'url'">
          URL
          <input v-model="newRef.url" placeholder="https://..." />
        </label>
        <label v-if="newRef.type === 'document'">
          {{ $t('blog.content') }}
          <textarea v-model="newRef.content" rows="6" :placeholder="$t('blog.contentPlaceholder')" />
        </label>
        <label>
          {{ $t('blog.topicOptional') }}
          <input v-model="newRef.topic" :placeholder="$t('blog.topicOptionalPlaceholder')" />
        </label>
        <button :disabled="busy || !newRef.title.trim()" @click="saveReference">{{ $t('blog.saveReference') }}</button>
      </div>

      <div class="actions">
        <button :disabled="busy" @click="saveInputs">{{ $t('blog.saveInputs') }}</button>
        <button :disabled="busy || !form.topic.trim()" @click="generateDraft">
          <span v-if="busy && generatingType === 'draft'" class="spinner"></span>
          {{ busy && generatingType === 'draft' ? $t('blog.generating') : $t('blog.generateDraft') }}
        </button>
        <button :disabled="busy || !draftText.trim()" @click="generateFinal">
          <span v-if="busy && generatingType === 'final'" class="spinner"></span>
          {{ busy && generatingType === 'final' ? $t('blog.generating') : $t('blog.generateFinal') }}
        </button>
        <button :disabled="busy || !draftText.trim()" @click="savePost('draft')">{{ $t('blog.saveDraft') }}</button>
        <button :disabled="busy || !finalText.trim()" @click="savePost('final')">{{ $t('blog.saveFinal') }}</button>
      </div>

      <p v-if="saveStatus" :class="saveStatus.type === 'success' ? 'status' : 'error'">{{ saveStatus.message }}</p>
      <p v-if="aiSource" class="status">Last generation source: <strong>{{ aiSource }}</strong></p>
      <p v-if="aiError" class="error">{{ aiError }}</p>
    </section>

    <section class="columns">
      <article class="card">
        <h2>{{ $t('blog.savedInputs') }}</h2>
        <div class="list">
          <div v-for="item in inputs" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.topic }}</strong>
              <p>{{ new Date(item.updatedAt).toLocaleString() }}</p>
            </div>
            <div class="row-actions">
              <button @click="restoreFromInput(item)">{{ $t('blog.restore') }}</button>
              <button @click="deleteInput(item)">{{ $t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>{{ $t('blog.draftOutlines') }}</h2>
        <div class="filters">
          <input v-model="draftSearch" :placeholder="$t('blog.searchDrafts')" />
          <label><input v-model="draftPinnedOnly" type="checkbox" /> {{ $t('blog.pinnedOnly') }}</label>
        </div>
        <div class="list">
          <div v-for="item in filteredDrafts" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ new Date(item.updatedAt).toLocaleString() }} &bull; {{ item.isPinned ? $t('blog.pinned') : $t('blog.unpinned') }}</p>
            </div>
            <div class="row-actions wrap">
              <button @click="restoreDraft(item)">{{ $t('blog.restore') }}</button>
              <button @click="setPinned(item, !item.isPinned)">{{ item.isPinned ? $t('blog.unpin') : $t('blog.pin') }}</button>
              <button @click="deletePost(item)">{{ $t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </article>

      <article class="card">
        <h2>{{ $t('blog.finalPosts') }}</h2>
        <div class="filters">
          <input v-model="finalSearch" :placeholder="$t('blog.searchFinals')" />
          <label><input v-model="finalPinnedOnly" type="checkbox" /> {{ $t('blog.pinnedOnly') }}</label>
        </div>
        <div class="list">
          <div v-for="item in filteredFinals" :key="item.id" class="list-item">
            <div>
              <strong>{{ item.title }}</strong>
              <p>{{ new Date(item.updatedAt).toLocaleString() }} &bull; {{ item.isPinned ? $t('blog.pinned') : $t('blog.unpinned') }}</p>
            </div>
            <div class="row-actions wrap">
              <button @click="restoreFinal(item)">{{ $t('blog.restore') }}</button>
              <button @click="duplicateFinalToDraft(item)">{{ $t('blog.duplicateToDraft') }}</button>
              <button @click="setPinned(item, !item.isPinned)">{{ item.isPinned ? $t('blog.unpin') : $t('blog.pin') }}</button>
              <button @click="deletePost(item)">{{ $t('common.delete') }}</button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <section class="card editor-card">
      <div class="editor-header">
        <h2>{{ $t('blog.draftOutline') }} <span v-if="draftWordCount > 0" class="word-count">{{ draftWordCount }} {{ $t('blog.words') }}</span></h2>
        <button class="preview-toggle" :class="{ editing: !showPreview }" @click="showPreview = !showPreview">
          {{ showPreview ? $t('blog.editMode') : $t('blog.saveChanges') }}
        </button>
      </div>
      <textarea v-if="!showPreview" v-model="draftText" rows="14" />
      <div v-else class="markdown-preview" v-html="draftHtml" />

      <div v-if="draftText.trim()" class="ai-instructions-section">
        <h3>{{ $t('blog.aiInstructions') }}</h3>
        <p class="ai-instructions-hint">{{ $t('blog.aiInstructionsHint') }}</p>
        <textarea
          v-model="form.aiInstructions"
          rows="3"
          :placeholder="$t('blog.aiInstructionsPlaceholder')"
          class="ai-instructions-input"
        />
      </div>

      <h2>{{ $t('blog.finalPost') }} <span v-if="finalWordCount > 0" class="word-count" :class="{ 'word-count-short': isWordCountShort }">{{ finalWordCount }} {{ $t('blog.words') }} <template v-if="isWordCountShort">({{ $t('blog.target') }}: {{ form.wordCount }})</template></span></h2>
      <label>
        {{ $t('blog.polishLevel') }}
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

@media (max-width: 980px) {
  .stats-strip,
  .grid,
  .principles,
  .columns {
    grid-template-columns: 1fr;
  }
}
</style>
