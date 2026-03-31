<script>
export default {
  name: 'ErrorMessage',

  props: {
    message: String
  }
};
</script>

<template lang="pug">
  p.error-message {{ message }}
</template>

<style scoped>
.error-message {
  background: #fef2f2;
  color: #dc2626;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  border: 1px solid #fecaca;
  margin: 0;
}
</style>
