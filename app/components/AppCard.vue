<template>
  <div :class="['app-card', { flat }]">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ flat?: boolean }>(), { flat: false });
</script>

<style scoped>
.app-card {
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.app-card.flat {
  box-shadow: none;
}
</style>
