<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n({ useScope: 'global' });

const locales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' }
];

// Use computed to ensure reactivity with v-model
const currentLocale = computed({
  get: () => locale.value,
  set: (newLocale: string) => {
    // Set the cookie directly for persistence
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `i18n_locale=${newLocale}; expires=${expires}; path=/; SameSite=Lax`;
    // Update the global locale
    locale.value = newLocale;
  }
});
</script>

<template>
  <ClientOnly>
    <select
      class="language-switcher"
      v-model="currentLocale"
      :key="currentLocale"
      :aria-label="t('language.select')"
    >
      <option v-for="loc in locales" :key="loc.code" :value="loc.code">
        {{ loc.name }}
      </option>
    </select>
    <template #fallback>
      <select class="language-switcher" disabled>
        <option>...</option>
      </select>
    </template>
  </ClientOnly>
</template>

<style scoped>
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
