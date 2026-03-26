<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'cyan' | 'teal' | 'orange' | 'pink';
  footer?: string;
}>();
</script>

<template>
  <div class="stat-card">
    <div class="stat-header">
      <span class="stat-label">{{ label }}</span>
      <span v-if="badge" class="stat-badge" :class="badgeColor">{{ badge }}</span>
    </div>
    <strong class="stat-value">{{ value }}</strong>
    <div v-if="footer" class="stat-footer">
      <span class="stat-sub">{{ footer }}</span>
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.stat-card {
  background: white;
  border-radius: 14px;
  padding: 1.25rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.stat-label {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.stat-badge {
  font-size: 0.65rem;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  text-transform: uppercase;
}

.stat-badge.blue { background: #dbeafe; color: #2563eb; }
.stat-badge.green { background: #dcfce7; color: #16a34a; }
.stat-badge.cyan { background: #cffafe; color: #0891b2; }
.stat-badge.teal { background: #ccfbf1; color: #0d9488; }
.stat-badge.orange { background: #ffedd5; color: #ea580c; }
.stat-badge.pink { background: #fce7f3; color: #db2777; }

.stat-value {
  display: block;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.stat-footer {
  font-size: 0.8rem;
  color: #94a3b8;
}

.stat-sub {
  color: inherit;
}
</style>
