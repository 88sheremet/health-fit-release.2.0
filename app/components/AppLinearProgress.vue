<template>
  <div
    class="linear-progress"
    :style="{ height: size, borderRadius: rounded ? size : '0' }"
  >
    <div class="track" :style="{ background: trackColor }" />
    <div
      class="fill"
      :style="{
        width: `${value * 100}%`,
        background: color,
        borderRadius: rounded ? size : '0',
      }"
    />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    value: number;
    color?: string;
    trackColor?: string;
    rounded?: boolean;
    size?: string;
  }>(),
  { color: "#4caf50", trackColor: "#e0e0e0", rounded: false, size: "4px" }
);
</script>

<style scoped>
.linear-progress {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.track,
.fill {
  position: absolute;
  inset: 0;
}
.track {
  z-index: 0;
}
.fill {
  z-index: 1;
  transition: width 0.35s ease;
}
</style>
