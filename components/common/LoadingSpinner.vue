<script>
export default {
  name: 'LoadingSpinner',

  props: {
    message: String
  }
};
</script>

<template lang="pug">
  .loading-state
    .spinner
    p(v-if="message") {{ message }}
</template>

<style scoped>
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 4rem;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #00b1e0;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
