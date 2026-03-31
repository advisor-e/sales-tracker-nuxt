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

<template lang="pug">
  section.section.blog-page
    //- Page header
    header.blog-header.mb-4
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-link is-light" rounded) {{ $t('blog.badge') }}
              h1.title.is-spaced.has-text-white.mt-2 {{ $t('blog.title') }}
              p.subtitle.has-text-white-ter {{ $t('blog.subtitle') }}

    //- Stats strip
    .columns.is-mobile.mb-4
      .column
        .box.stat-strip-box
          p.heading {{ $t('blog.savedInputs') }}
          p.title.is-4 {{ inputs.length }}
      .column
        .box.stat-strip-box
          p.heading {{ $t('blog.drafts') }}
          p.title.is-4 {{ draftPosts.length }}
      .column
        .box.stat-strip-box
          p.heading {{ $t('blog.finals') }}
          p.title.is-4 {{ finalPosts.length }}

    b-notification(v-if="startupError" type="is-warning is-light" :closable="false")
      | Startup warning: {{ startupError }}

    //- Blog inputs form
    .box.mb-4
      p.title.is-5 {{ $t('blog.blogInputs') }}
      .columns.is-multiline
        .column.is-6
          b-field(:label="$t('blog.topic')")
            b-input(v-model="form.topic" :placeholder="$t('blog.topicPlaceholder')" expanded)
        .column.is-6
          b-field(:label="$t('blog.audience')")
            b-input(v-model="form.audience" expanded)
        .column.is-6
          b-field(:label="$t('blog.objective')")
            b-input(v-model="form.objective" expanded)
        .column.is-3
          b-field(:label="$t('blog.tone')")
            b-select(v-model="form.tone" expanded)
              option(v-for="tone in tones" :key="tone" :value="tone") {{ tone }}
        .column.is-3
          b-field(:label="$t('blog.length')")
            b-select(v-model="form.length" expanded)
              option(v-for="length in lengths" :key="length" :value="length") {{ length }}
        .column.is-3
          b-field(:label="$t('blog.wordCount')")
            b-input(v-model="form.wordCount" :placeholder="$t('blog.wordCountPlaceholder')" expanded)
        .column.is-3
          b-field(:label="$t('blog.cta')")
            b-input(v-model="form.cta" expanded)
        .column.is-3
          b-field(:label="$t('blog.authorType')")
            b-select(v-model="form.authorType" expanded)
              option(v-for="opt in authorTypeOptions" :key="opt" :value="opt") {{ opt }}
        .column.is-3
          b-field(:label="$t('blog.author')")
            b-select(v-model="form.author" expanded)
              option(value="") {{ $t('blog.selectAuthor') }}
              option(v-for="opt in authorOptions" :key="opt" :value="opt") {{ opt }}

      //- Principles
      p.title.is-6.mb-2 {{ $t('blog.principles') }}
      .columns.is-multiline
        .column.is-4(v-for="(p, index) in principles" :key="index")
          .box.has-background-light
            p.has-text-weight-bold.has-text-purple.mb-2 {{ $t('blog.principle') }} {{ index + 1 }}
            b-field
              b-input(v-model="p.title" type="textarea" rows="1" custom-class="auto-resize" @input.native="autoResize" expanded)
            b-field(v-for="(detail, detailIndex) in p.details" :key="detailIndex" :label="$t('blog.detail') + ' ' + (detailIndex + 1)")
              b-input(v-model="p.details[detailIndex]" type="textarea" rows="1" custom-class="auto-resize" @input.native="autoResize" expanded)

      //- References
      p.title.is-6.mb-2 {{ $t('blog.references') }}
      p.is-size-7.has-text-grey.mb-3 {{ $t('blog.refHint') }}

      .ref-list.mb-3
        .level.is-mobile.ref-item(v-for="ref in references" :key="ref.id" :class="{ 'is-selected-ref': selectedReferenceIds.includes(ref.id) }")
          .level-left
            .level-item
              b-checkbox(:value="selectedReferenceIds.includes(ref.id)" @input="toggleReference(ref.id)")
            .level-item
              span.has-text-weight-medium.is-size-7 {{ ref.title }}
            .level-item
              b-tag(size="is-small" type="is-light") {{ ref.type === 'url' ? 'URL' : $t('blog.doc') }}
          .level-right
            .level-item
              b-button(size="is-small" type="is-danger is-light" @click="deleteReference(ref.id)") {{ $t('common.delete') }}
        p.has-text-grey.is-italic.is-size-7(v-if="references.length === 0") {{ $t('blog.noReferences') }}

      b-button.mb-3(
        size="is-small"
        @click="showRefForm = !showRefForm"
      ) {{ showRefForm ? $t('common.cancel') : $t('blog.addReference') }}

      .box.has-background-light.mb-3(v-if="showRefForm")
        .columns.is-multiline
          .column.is-6
            b-field(:label="$t('blog.refTitle')")
              b-input(v-model="newRef.title" :placeholder="$t('blog.refTitlePlaceholder')" expanded)
          .column.is-6
            b-field(:label="$t('blog.refType')")
              b-select(v-model="newRef.type" expanded)
                option(value="document") {{ $t('blog.document') }}
                option(value="url") {{ $t('blog.urlLink') }}
          .column.is-12(v-if="newRef.type === 'url'")
            b-field(label="URL")
              b-input(v-model="newRef.url" placeholder="https://..." expanded)
          .column.is-12(v-if="newRef.type === 'document'")
            b-field(:label="$t('blog.content')")
              b-input(v-model="newRef.content" type="textarea" rows="6" :placeholder="$t('blog.contentPlaceholder')" expanded)
          .column.is-6
            b-field(:label="$t('blog.topicOptional')")
              b-input(v-model="newRef.topic" :placeholder="$t('blog.topicOptionalPlaceholder')" expanded)
        b-button(
          type="is-success"
          :disabled="busy || !newRef.title.trim()"
          @click="saveReference"
        ) {{ $t('blog.saveReference') }}

      //- Action buttons
      .buttons.mt-4
        b-button(:disabled="busy" @click="saveInputs") {{ $t('blog.saveInputs') }}
        b-button(
          type="is-primary"
          :loading="busy && generatingType === 'draft'"
          :disabled="busy || !form.topic.trim()"
          @click="generateDraft"
        ) {{ $t('blog.generateDraft') }}
        b-button(
          type="is-info"
          :loading="busy && generatingType === 'final'"
          :disabled="busy || !draftText.trim()"
          @click="generateFinal"
        ) {{ $t('blog.generateFinal') }}
        b-button(:disabled="busy || !draftText.trim()" @click="savePost('draft')") {{ $t('blog.saveDraft') }}
        b-button(:disabled="busy || !finalText.trim()" @click="savePost('final')") {{ $t('blog.saveFinal') }}

      b-notification(v-if="saveStatus" :type="saveStatus.type === 'success' ? 'is-success is-light' : 'is-danger is-light'" :closable="false")
        | {{ saveStatus.message }}
      p.is-size-7.has-text-grey.mt-2(v-if="aiSource")
        | Last generation source: #[strong {{ aiSource }}]
      b-notification(v-if="aiError" type="is-warning is-light" :closable="false") {{ aiError }}

    //- Saved lists
    .columns.mb-4
      .column.is-4
        .box
          p.title.is-5 {{ $t('blog.savedInputs') }}
          .saved-list
            .level.is-mobile.saved-item(v-for="item in inputs" :key="item.id")
              .level-left
                .level-item
                  div
                    p.has-text-weight-bold.is-size-7 {{ item.topic }}
                    p.has-text-grey.is-size-7 {{ new Date(item.updatedAt).toLocaleString() }}
              .level-right
                .level-item
                  b-button(size="is-small" @click="restoreFromInput(item)") {{ $t('blog.restore') }}
                .level-item
                  b-button(size="is-small" type="is-danger is-light" @click="deleteInput(item)") {{ $t('common.delete') }}

      .column.is-4
        .box
          p.title.is-5 {{ $t('blog.draftOutlines') }}
          .field.is-grouped.mb-3
            .control.is-expanded
              b-input(v-model="draftSearch" :placeholder="$t('blog.searchDrafts')" size="is-small" expanded)
            .control
              b-checkbox(v-model="draftPinnedOnly" size="is-small") {{ $t('blog.pinnedOnly') }}
          .saved-list
            .saved-item(v-for="item in filteredDrafts" :key="item.id")
              .level.is-mobile
                .level-left
                  .level-item
                    div
                      p.has-text-weight-bold.is-size-7 {{ item.title }}
                      p.has-text-grey.is-size-7
                        | {{ new Date(item.updatedAt).toLocaleString() }}
                        b-tag.ml-1(size="is-small" :type="item.isPinned ? 'is-warning is-light' : 'is-light'")
                          | {{ item.isPinned ? $t('blog.pinned') : $t('blog.unpinned') }}
              .buttons.are-small.mt-1
                b-button(size="is-small" @click="restoreDraft(item)") {{ $t('blog.restore') }}
                b-button(size="is-small" @click="setPinned(item, !item.isPinned)") {{ item.isPinned ? $t('blog.unpin') : $t('blog.pin') }}
                b-button(size="is-small" type="is-danger is-light" @click="deletePost(item)") {{ $t('common.delete') }}

      .column.is-4
        .box
          p.title.is-5 {{ $t('blog.finalPosts') }}
          .field.is-grouped.mb-3
            .control.is-expanded
              b-input(v-model="finalSearch" :placeholder="$t('blog.searchFinals')" size="is-small" expanded)
            .control
              b-checkbox(v-model="finalPinnedOnly" size="is-small") {{ $t('blog.pinnedOnly') }}
          .saved-list
            .saved-item(v-for="item in filteredFinals" :key="item.id")
              .level.is-mobile
                .level-left
                  .level-item
                    div
                      p.has-text-weight-bold.is-size-7 {{ item.title }}
                      p.has-text-grey.is-size-7
                        | {{ new Date(item.updatedAt).toLocaleString() }}
                        b-tag.ml-1(size="is-small" :type="item.isPinned ? 'is-warning is-light' : 'is-light'")
                          | {{ item.isPinned ? $t('blog.pinned') : $t('blog.unpinned') }}
              .buttons.are-small.mt-1
                b-button(size="is-small" @click="restoreFinal(item)") {{ $t('blog.restore') }}
                b-button(size="is-small" @click="duplicateFinalToDraft(item)") {{ $t('blog.duplicateToDraft') }}
                b-button(size="is-small" @click="setPinned(item, !item.isPinned)") {{ item.isPinned ? $t('blog.unpin') : $t('blog.pin') }}
                b-button(size="is-small" type="is-danger is-light" @click="deletePost(item)") {{ $t('common.delete') }}

    //- Editor
    .box
      .level.mb-3
        .level-left
          .level-item
            p.title.is-5.mb-0 {{ $t('blog.draftOutline') }}
          .level-item(v-if="draftWordCount > 0")
            b-tag(:type="'is-success is-light'") {{ draftWordCount }} {{ $t('blog.words') }}
        .level-right
          .level-item
            b-button(
              :type="showPreview ? 'is-primary' : 'is-success'"
              size="is-small"
              @click="showPreview = !showPreview"
            ) {{ showPreview ? $t('blog.editMode') : $t('blog.saveChanges') }}

      b-input(v-if="!showPreview" v-model="draftText" type="textarea" rows="14" expanded)
      .markdown-preview(v-else v-html="draftHtml")

      .box.has-background-light.mt-3(v-if="draftText.trim()")
        p.title.is-6 {{ $t('blog.aiInstructions') }}
        p.is-size-7.has-text-grey.mb-2 {{ $t('blog.aiInstructionsHint') }}
        b-input(
          v-model="form.aiInstructions"
          type="textarea"
          rows="3"
          :placeholder="$t('blog.aiInstructionsPlaceholder')"
          expanded
        )

      .level.mt-4.mb-2
        .level-left
          .level-item
            p.title.is-5.mb-0 {{ $t('blog.finalPost') }}
          .level-item(v-if="finalWordCount > 0")
            b-tag(:type="isWordCountShort ? 'is-danger is-light' : 'is-success is-light'")
              | {{ finalWordCount }} {{ $t('blog.words') }}
              template(v-if="isWordCountShort")  ({{ $t('blog.target') }}: {{ form.wordCount }})
        .level-right
          .level-item
            b-field(:label="$t('blog.polishLevel')" horizontal)
              b-select(v-model="form.polishLevel")
                option(v-for="level in polishLevels" :key="level" :value="level") {{ level }}

      b-input(v-if="!showPreview" v-model="finalText" type="textarea" rows="16" expanded)
      .markdown-preview(v-else v-html="finalHtml")
</template>

<style scoped>
.blog-page {
  padding: 0;
  min-height: 100vh;
  background: linear-gradient(180deg, #fdf0fd 0%, #fcecfc 100%);
}

.blog-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    linear-gradient(135deg, #e020e5 0%, #b312b8 50%, #7a0c7e 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(208, 21, 213, 0.3);
}

.blog-header::before {
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

.stat-strip-box {
  background: linear-gradient(180deg, #fce8fc, #f7ccf7);
  text-align: center;
}

.ref-list {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.ref-item {
  padding: 0.4rem 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fafafa;
}

.is-selected-ref {
  border-color: #d015d5;
  background: #fdf4ff;
}

.saved-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 380px;
  overflow-y: auto;
}

.saved-item {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
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

.auto-resize {
  min-height: 2rem;
  resize: none;
  overflow: hidden;
}

.has-text-purple {
  color: #6a0b6e;
}
</style>
