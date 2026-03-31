<script>
export default {
  name: 'PageHeader',

  props: {
    badge: String,
    title: String,
    subtitle: String,
    refreshLabel: String,
    loading: Boolean
  },

  emits: ['refresh']
};
</script>

<template lang="pug">
  header.page-header
    .level.is-mobile
      .level-left
        .level-item
          .header-text
            b-tag.mb-3(v-if="badge" type="is-white" rounded) {{ badge }}
            h1.title.has-text-white {{ title }}
            p.subtitle.has-text-white.mt-2(v-if="subtitle") {{ subtitle }}
      .level-right
        .level-item(v-if="refreshLabel")
          b-button(
            @click="$emit('refresh')"
            :loading="loading"
            type="is-white"
            rounded
          ) {{ refreshLabel }}
        slot(name="actions")
</template>

<style scoped>
.page-header {
  background:
    radial-gradient(ellipse at 20% 50%, rgba(255, 255, 255, 0.12) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(0, 200, 255, 0.2) 0%, transparent 40%),
    linear-gradient(135deg, #00c4e8 0%, #00b1e0 25%, #009fc8 50%, #008db3 75%, #007a99 100%);
  border-radius: 24px;
  padding: 2.5rem 2rem;
  color: white;
  box-shadow:
    0 20px 60px rgba(0, 177, 224, 0.35),
    0 8px 25px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  margin-bottom: 1.5rem;
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

.header-text .title,
.header-text .subtitle {
  color: white;
  margin-bottom: 0;
}

@media (max-width: 600px) {
  .header-text .title {
    font-size: 1.5rem;
  }
}
</style>
