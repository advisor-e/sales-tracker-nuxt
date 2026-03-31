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

<template lang="pug">
  .language-switcher-wrap
    client-only
      b-select(v-model="currentLocale" :key="currentLocale" size="is-small" :aria-label="$t('language.select')" rounded)
        option(v-for="loc in locales" :key="loc.code" :value="loc.code") {{ loc.name }}
      select(slot="placeholder" disabled)
        option ...
</template>

<style scoped>
.language-switcher-wrap {
  display: inline-block;
}
</style>
