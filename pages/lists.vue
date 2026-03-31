<script>
export default {
  name: 'ListsPage',

  middleware: ['firm-manager'],

  data() {
    return {
      lists: {},
      expandedList: null,
      newItemText: "",
      saving: false,
      saveMessage: "",
      languages: [],
      languagesLoading: false,
      showAddLanguage: false,
      newLanguage: {
        code: '',
        name: '',
        nativeName: '',
        translations: {}
      },
      languageSaving: false
    };
  },

  computed: {
    listsData() {
      return this.$store.state.lists.lists;
    },
    listsLoading() {
      return this.$store.state.lists.loading;
    },
    usageGuides() {
      return [
        { key: 'status', title: this.$t('lists.prospectStatus'), desc: this.$t('lists.prospectStatusDesc') },
        { key: 'source', title: this.$t('lists.prospectSource'), desc: this.$t('lists.prospectSourceDesc') },
        { key: 'approach', title: this.$t('lists.approachStyle'), desc: this.$t('lists.approachStyleDesc') },
        { key: 'sales', title: this.$t('lists.salesStyle'), desc: this.$t('lists.salesStyleDesc') },
        { key: 'tn', title: this.$t('lists.totalNeedsStage'), desc: this.$t('lists.totalNeedsStageDesc') },
        { key: 'industry', title: this.$t('lists.industry'), desc: this.$t('lists.industryDesc') }
      ];
    }
  },

  watch: {
    listsData: {
      handler(newLists) {
        if (Object.keys(this.lists).length === 0) {
          Object.assign(this.lists, JSON.parse(JSON.stringify(newLists)));
        }
      },
      deep: true
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
    toggleExpand(key) {
      this.expandedList = this.expandedList === key ? null : key;
      this.newItemText = "";
    },
    async addItem(key) {
      const text = this.newItemText.trim();
      if (text && this.lists[key] && !this.lists[key].items.includes(text)) {
        this.lists[key].items.push(text);
        this.newItemText = "";
        await this.saveListToDb(key);
      }
    },
    async removeItem(key, item) {
      if (!this.lists[key]) return;
      const idx = this.lists[key].items.indexOf(item);
      if (idx !== -1) {
        this.lists[key].items.splice(idx, 1);
        await this.saveListToDb(key);
      }
    },
    async moveItem(key, index, direction) {
      if (!this.lists[key]) return;
      const arr = this.lists[key].items;
      const newIndex = index + direction;
      if (newIndex >= 0 && newIndex < arr.length) {
        const temp = arr[index];
        arr[index] = arr[newIndex];
        arr[newIndex] = temp;
        await this.saveListToDb(key);
      }
    },
    async saveListToDb(key) {
      if (!this.lists[key]) return;
      this.saving = true;
      this.saveMessage = "";

      const success = await this.$store.dispatch('lists/saveList', {
        key,
        items: this.lists[key].items,
        colors: this.lists[key].colors
      });

      if (success) {
        this.saveMessage = "Saved";
        this.$store.dispatch('lists/invalidateCache');
        setTimeout(() => {
          this.saveMessage = "";
        }, 2000);
      } else {
        this.saveMessage = "Failed to save";
      }

      this.saving = false;
    },
    async loadLanguages() {
      this.languagesLoading = true;
      try {
        const response = await fetch('/api/languages', { credentials: 'same-origin' }).then(r => r.json());
        this.languages = response.languages;
      } catch (e) {
        console.error('Failed to load languages:', e);
      } finally {
        this.languagesLoading = false;
      }
    },
    async addNewLanguage() {
      if (!this.newLanguage.code || !this.newLanguage.name || !this.newLanguage.nativeName) return;

      this.languageSaving = true;
      try {
        const result = await this.apiFetch('/api/languages/translate', {
          method: 'POST',
          body: {
            code: this.newLanguage.code.toLowerCase(),
            name: this.newLanguage.name,
            nativeName: this.newLanguage.nativeName
          }
        });

        if (this.$addLocale) {
          this.$addLocale(result.language.code, result.language.name, result.language.nativeName, result.translations);
        }

        await this.loadLanguages();

        this.newLanguage.code = '';
        this.newLanguage.name = '';
        this.newLanguage.nativeName = '';
        this.newLanguage.translations = {};
        this.showAddLanguage = false;

        this.saveMessage = this.$t('lists.languageAdded');
        setTimeout(() => { this.saveMessage = ''; }, 3000);
      } catch (e) {
        this.saveMessage = e?.message || 'Translation failed. Please try again.';
        setTimeout(() => { this.saveMessage = ''; }, 4000);
      } finally {
        this.languageSaving = false;
      }
    },
    async deleteLanguage(code) {
      if (!confirm(this.$t('lists.confirmDeleteLanguage'))) return;

      try {
        await this.apiFetch(`/api/languages/${code}`, { method: 'DELETE' });

        if (this.$removeLocale) {
          this.$removeLocale(code);
        }

        await this.loadLanguages();
        if (this.$refreshLocales) {
          await this.$refreshLocales();
        }

        this.saveMessage = this.$t('lists.languageDeleted');
        setTimeout(() => { this.saveMessage = ''; }, 2000);
      } catch (e) {
        console.error('Failed to delete language:', e);
      }
    }
  },

  async mounted() {
    await Promise.all([
      this.$store.dispatch('lists/fetchLists', true),
      this.loadLanguages()
    ]);
    Object.assign(this.lists, JSON.parse(JSON.stringify(this.listsData)));
  }
};
</script>

<template lang="pug">
  section.section.lists-page
    //- Page header
    header.lists-header.mb-5
      .level.is-mobile
        .level-left
          .level-item
            div
              b-tag(type="is-link is-light" rounded) {{ $t('lists.badge') }}
              h1.title.has-text-white.mt-2 {{ $t('lists.title') }}
              p.subtitle.has-text-white-ter {{ $t('lists.subtitle') }}

    //- Loading / save banners
    b-notification(v-if="listsLoading && Object.keys(lists).length === 0" type="is-info is-light" :closable="false")
      | {{ $t('lists.loading') }}
    b-notification(
      v-if="saveMessage"
      :type="saveMessage.includes('Failed') ? 'is-danger is-light' : 'is-success is-light'"
      :closable="false"
    )
      | {{ saveMessage === 'Saved' ? $t('lists.saved') : saveMessage }}

    //- Info banner
    b-message(type="is-info is-light" :closable="false")
      | {{ $t('lists.infoBanner') }}

    //- Languages section
    .box.mb-5
      .level.mb-4
        .level-left
          .level-item
            div
              p.title.is-5.mb-1 {{ $t('lists.languagesTitle') }}
              p.is-size-7.has-text-grey {{ $t('lists.languagesDesc') }}
        .level-right
          .level-item
            b-button(
              @click="showAddLanguage = !showAddLanguage"
              type="is-link"
              size="is-small"
              rounded
            ) {{ showAddLanguage ? '−' : '+' }} {{ $t('lists.addLanguage') }}

      //- Add language form
      .box.has-background-light.mb-4(v-if="showAddLanguage")
        .columns.is-multiline
          .column.is-4
            b-field(:label="$t('lists.languageCode')")
              b-input(v-model="newLanguage.code" :placeholder="$t('lists.languageCodePlaceholder')" maxlength="10" expanded)
          .column.is-4
            b-field(:label="$t('lists.languageName')")
              b-input(v-model="newLanguage.name" :placeholder="$t('lists.languageNamePlaceholder')" expanded)
          .column.is-4
            b-field(:label="$t('lists.nativeName')")
              b-input(v-model="newLanguage.nativeName" :placeholder="$t('lists.nativeNamePlaceholder')" expanded)
        .level
          .level-left
            .level-item
              b-button(
                type="is-success"
                :loading="languageSaving"
                :disabled="!newLanguage.code || !newLanguage.name || !newLanguage.nativeName"
                @click="addNewLanguage"
              ) {{ languageSaving ? 'Translating...' : $t('lists.addLanguage') }}
          .level-right
            .level-item
              p.is-size-7.has-text-grey.is-italic(v-if="!languageSaving")
                | AI will translate all app text into the new language. This takes about 30 seconds.
              p.is-size-7.has-text-link(v-else)
                | Translating with AI — please wait, this takes about 30 seconds...

      //- Language cards
      .tags
        .tag.is-medium.language-tag(
          v-for="lang in languages"
          :key="lang.code"
          :class="lang.isBuiltIn ? 'is-success is-light' : 'is-info is-light'"
        )
          span.has-text-weight-bold.mr-1 {{ lang.code }}
          | {{ lang.nativeName }}
          b-tag.ml-2(size="is-small" :type="lang.isBuiltIn ? 'is-success' : 'is-info'")
            | {{ lang.isBuiltIn ? $t('lists.builtIn') : $t('lists.custom') }}
          button.delete.is-small.ml-2(
            v-if="!lang.isBuiltIn"
            @click="deleteLanguage(lang.code)"
            :title="$t('lists.deleteLanguage')"
          )

    //- Lists grid
    .columns.is-multiline.mb-5
      .column.is-6-desktop.is-12-tablet(v-for="(list, key) in lists" :key="key")
        .box.list-card(:class="{ 'is-expanded': expandedList === key }")
          .list-header(@click="toggleExpand(key)")
            .level.is-mobile
              .level-left
                .level-item
                  div
                    p.has-text-weight-bold {{ list.name }}
                    p.is-size-7.has-text-grey {{ list.description }}
              .level-right
                .level-item
                  b-tag(type="is-light" size="is-small") {{ list.items.length }} {{ $t('lists.items') }}
                .level-item
                  span.expand-toggle {{ expandedList === key ? '−' : '+' }}

          .list-content(v-if="expandedList === key")
            hr.my-2
            .list-items
              .level.list-item.is-mobile(
                v-for="(item, idx) in list.items"
                :key="item"
                :style="list.colors && list.colors[item] ? { backgroundColor: list.colors[item] } : {}"
              )
                .level-left
                  .level-item
                    span.is-size-7 {{ item }}
                .level-right
                  .level-item
                    b-button(size="is-small" :disabled="idx === 0" @click.stop="moveItem(key, idx, -1)") ↑
                  .level-item
                    b-button(size="is-small" :disabled="idx === list.items.length - 1" @click.stop="moveItem(key, idx, 1)") ↓
                  .level-item
                    b-button(size="is-small" type="is-danger is-light" @click.stop="removeItem(key, item)") ×
            .level.mt-3
              .level-left.is-flex-grow-1
                .level-item.is-flex-grow-1
                  b-input(
                    v-model="newItemText"
                    :placeholder="$t('lists.addNewItem')"
                    @keyup.native.enter="addItem(key)"
                    size="is-small"
                    expanded
                  )
              .level-right
                .level-item
                  b-button(
                    type="is-link"
                    size="is-small"
                    :disabled="!newItemText.trim()"
                    @click="addItem(key)"
                  ) {{ $t('common.add') }}

    //- Usage guide
    .box
      p.title.is-5.mb-4 {{ $t('lists.usageGuideTitle') }}
      .columns.is-multiline
        .column.is-4(v-for="guide in usageGuides" :key="guide.key")
          .box.has-background-light
            p.has-text-weight-bold.has-text-link.mb-1 {{ guide.title }}
            p.is-size-7.has-text-grey {{ guide.desc }}
</template>

<style scoped>
.lists-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #ecfeff 0%, #cffafe 100%);
}

.lists-header {
  background: linear-gradient(135deg, #0891b2 0%, #0e7490 50%, #155e75 100%);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(8, 145, 178, 0.3);
}

.lists-header::before {
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

.list-card {
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.list-card:hover,
.list-card.is-expanded {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.list-header {
  user-select: none;
}

.expand-toggle {
  font-size: 1.25rem;
  color: #64748b;
  line-height: 1;
}

.list-items {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.list-item {
  background: #f8fafc;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
}

.language-tag {
  height: auto;
  padding: 0.4rem 0.75rem;
}
</style>
