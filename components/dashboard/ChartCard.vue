<script>
export default {
  name: 'ChartCard',

  props: {
    title: String,
    subtitle: String,
    chartType: String,
    wide: Boolean
  }
};
</script>

<template lang="pug">
  .box.chart-card(:class="{ wide }")
    p.title.is-6.mb-1 {{ title }}
    p.is-size-7.has-text-grey-light.mb-3(v-if="subtitle") {{ subtitle }}
    .chart-container(:class="chartType || 'default'")
      slot
</template>

<style scoped>
.chart-card {
  overflow: hidden;
  min-width: 0;
}

.chart-container {
  position: relative;
  width: 100%;
  max-width: 100%;
}

.chart-container.pie,
.chart-container.doughnut {
  height: 280px;
}

.chart-container.line {
  height: 220px;
}

.chart-container.bar-h {
  height: 200px;
}

.chart-container.bar-v {
  height: 240px;
}

.chart-container.default {
  height: 220px;
}
</style>
