<script setup>
defineProps({
  title: String,
  subtitle: String,
  chartType: String,
  wide: Boolean
});
</script>

<template>
  <div class="chart-card" :class="{ wide }">
    <h3>{{ title }}</h3>
    <p v-if="subtitle" class="chart-subtitle">{{ subtitle }}</p>
    <div class="chart-container" :class="chartType || 'default'">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.chart-card {
  background: white;
  border-radius: 20px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  min-width: 0;
}

.chart-card h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
}

.chart-subtitle {
  margin: 0.25rem 0 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
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
