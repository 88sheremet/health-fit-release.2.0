<template>
  <div :class="['app-card', { flat }]" @click="$emit('click', $event)">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ flat?: boolean }>(), { flat: false });

defineEmits<{ click: [e: MouseEvent] }>();
</script>

<style scoped>
.app-card {
  background: var(--white);
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.app-card:not(.flat):hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}
.app-card.flat {
  box-shadow: none;
}
</style>
