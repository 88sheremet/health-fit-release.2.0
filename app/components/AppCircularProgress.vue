<template>
  <div class="circular-progress" :style="{ width: size, height: size }">
    <svg :viewBox="`0 0 ${r * 2 + stroke} ${r * 2 + stroke}`">
      <circle
        class="track"
        :cx="r + stroke / 2"
        :cy="r + stroke / 2"
        :r="r"
        :stroke-width="stroke"
        fill="none"
      />
      <circle
        class="fill"
        :cx="r + stroke / 2"
        :cy="r + stroke / 2"
        :r="r"
        :stroke-width="stroke"
        :stroke="strokeColor"
        fill="none"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="offset"
        stroke-linecap="round"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{ value: number; max?: number; size?: string; color?: string }>(),
  { max: 100, size: "48px", color: "#4caf50" }
);

const stroke = 6;
const r = 24;
const circumference = 2 * Math.PI * r;
const strokeColor = computed(() => props.color);

const offset = computed(() => {
  const pct = Math.min(props.value / props.max, 1);
  return circumference * (1 - pct);
});
</script>

<style scoped>
.circular-progress {
  display: inline-flex;
}
svg {
  transform: rotate(-90deg);
}
.track {
  stroke: #e0e0e0;
  opacity: 0.3;
}
.fill {
  transition: stroke-dashoffset 0.4s ease;
}
</style>
