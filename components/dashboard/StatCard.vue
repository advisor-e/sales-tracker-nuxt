<script>
export default {
  name: 'StatCard',

  props: {
    label: String,
    value: [String, Number],
    badge: String,
    badgeColor: String,
    footer: String
  }
};
</script>

<template lang="pug">
  .stat-card
    .stat-header
      span.stat-label {{ label }}
      span.stat-badge(v-if="badge" :class="badgeColor") {{ badge }}
    strong.stat-value {{ value }}
    .stat-footer(v-if="footer")
      span.stat-sub {{ footer }}
    slot(name="footer")
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
