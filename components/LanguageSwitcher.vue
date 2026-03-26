<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n({ useScope: 'global' });

const locales = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' }
];

function changeLanguage(event: Event) {
  const target = event.target as HTMLSelectElement;
  const newLocale = target.value;

  // Set the cookie directly for persistence
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `i18n_locale=${newLocale}; expires=${expires}; path=/; SameSite=Lax`;

  // Update the global locale - triggers reactivity everywhere
  locale.value = newLocale;
}
</script>

<template>
  <select
    class="language-switcher"
    :value="locale"
    @change="changeLanguage"
    :aria-label="t('language.select')"
  >
    <option v-for="loc in locales" :key="loc.code" :value="loc.code">
      {{ loc.name }}
    </option>
  </select>
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
