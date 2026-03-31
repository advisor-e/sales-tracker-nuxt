<script>
export default {
  name: 'ErrorMessage',

  props: {
    message: String
  }
};
</script>

<template lang="pug">
  b-notification(type="is-danger is-light" :closable="false") {{ message }}
</template>
