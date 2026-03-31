<script>
export default {
  name: 'StatCard',

  props: {
    label: String,
    value: [String, Number],
    badge: String,
    badgeColor: String,
    footer: String
  },

  computed: {
    tagType() {
      const map = {
        blue: 'is-info is-light',
        green: 'is-success is-light',
        cyan: 'is-link is-light',
        teal: 'is-primary is-light',
        orange: 'is-warning is-light',
        pink: 'is-danger is-light'
      };
      return map[this.badgeColor] || 'is-light';
    }
  }
};
</script>

<template lang="pug">
  .box.stat-card
    .level.mb-3
      .level-left
        .level-item
          p.heading.mb-0 {{ label }}
      .level-right(v-if="badge")
        .level-item
          b-tag(:type="tagType" size="is-small") {{ badge }}
    p.title.is-3.mb-2 {{ value }}
    p.has-text-grey-light.is-size-7(v-if="footer") {{ footer }}
    slot(name="footer")
</template>

<style scoped>
.stat-card {
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}
</style>
