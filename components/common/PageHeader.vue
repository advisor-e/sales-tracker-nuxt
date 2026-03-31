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
    .header-content
      .header-text
        span.header-badge {{ badge }}
        h1 {{ title }}
        p {{ subtitle }}
      button.refresh-btn(
        v-if="refreshLabel"
        @click="$emit('refresh')"
        :disabled="loading"
      )
        svg(xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round")
          path(d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8")
          path(d="M21 3v5h-5")
        | {{ refreshLabel }}
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

.header-text h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.header-text p {
  margin: 0.5rem 0 0;
  opacity: 0.9;
  font-size: 0.95rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  color: #008db3;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.refresh-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

@media (max-width: 600px) {
  .header-text h1 {
    font-size: 1.5rem;
  }
}
</style>
