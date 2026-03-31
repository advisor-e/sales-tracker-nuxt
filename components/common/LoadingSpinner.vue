<script>
export default {
  name: 'LoadingSpinner',

  props: {
    message: String
  }
};
</script>

<template lang="pug">
  .has-text-centered.p-6
    .spinner
    p.mt-4.has-text-grey(v-if="message") {{ message }}
</template>

<style scoped>
.spinner {
  display: inline-block;
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
