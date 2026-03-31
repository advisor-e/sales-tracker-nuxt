<script>
export default {
  name: 'LanguageSwitcher',

  computed: {
    locales() {
      const available = this.$availableLocales || [];
      return available.map(loc => ({
        code: loc.code,
        name: loc.nativeName
      }));
    },
    currentLocale: {
      get() {
        return this.$i18n.locale;
      },
      set(newLocale) {
        if (this.$setLocale) {
          this.$setLocale(newLocale);
        }
      }
    }
  }
};
</script>

<template>
  <div class="language-switcher-wrap">
    <client-only>
      <select
        class="language-switcher"
        v-model="currentLocale"
        :key="currentLocale"
        :aria-label="$t('language.select')"
      >
        <option v-for="loc in locales" :key="loc.code" :value="loc.code">
          {{ loc.name }}
        </option>
      </select>
      <select slot="placeholder" class="language-switcher" disabled>
        <option>...</option>
      </select>
    </client-only>
  </div>
</template>

<style scoped>
.language-switcher-wrap {
  display: inline-block;
}

.language-switcher {
  padding: 0.4rem 0.6rem;
  border: 1px solid rgba(15, 122, 138, 0.3);
  border-radius: 999px;
  background: linear-gradient(120deg, #f0fdfa, #e0f7fa);
  color: #0f7a8a;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.language-switcher:hover {
  border-color: rgba(15, 122, 138, 0.5);
  background: linear-gradient(120deg, #e0f7fa, #b2ebf2);
}

.language-switcher:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(15, 122, 138, 0.2);
}
</style>
