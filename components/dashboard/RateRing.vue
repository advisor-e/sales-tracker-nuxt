<script>
export default {
  name: 'RateRing',

  props: {
    rate: Number,
    label: String,
    count: String,
    color: String
  },

  data() {
    return {
      circumference: 264 // 2 * PI * 42 (radius)
    };
  }
};
</script>

<template lang="pug">
  .rate-card.has-text-centered
    .rate-ring
      svg(viewBox="0 0 100 100")
        circle.ring-bg(cx="50" cy="50" r="42")
        circle.ring-progress(
          :class="color || 'cyan'"
          cx="50"
          cy="50"
          r="42"
          :stroke-dasharray="circumference"
          :stroke-dashoffset="circumference - (circumference * rate / 100)"
        )
      .rate-value {{ rate }}%
    p.is-size-7.has-text-grey.mt-2.mb-0 {{ label }}
    p.is-size-7.has-text-grey-light {{ count }}
</template>

<style scoped>
.rate-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.rate-ring {
  position: relative;
  width: 100px;
  height: 100px;
}

.rate-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-bg {
  fill: none;
  stroke: #f1f5f9;
  stroke-width: 8;
}

.ring-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s ease;
}

.ring-progress.cyan { stroke: #00b1e0; }
.ring-progress.blue { stroke: #3b82f6; }
.ring-progress.green { stroke: #22c55e; }
.ring-progress.orange { stroke: #f97316; }
.ring-progress.teal { stroke: #14b8a6; }
.ring-progress.amber { stroke: #f59e0b; }
.ring-progress.lime { stroke: #84cc16; }
.ring-progress.emerald { stroke: #10b981; }

.rate-value {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}
</style>
